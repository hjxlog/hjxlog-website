import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

class TableImportError extends Error {
  constructor(message, result, statusCode = 400) {
    super(message);
    this.name = 'TableImportError';
    this.result = result;
    this.statusCode = statusCode;
  }
}

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function parsePositiveInt(value, fallbackValue, maxValue) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallbackValue;
  if (maxValue && parsed > maxValue) return maxValue;
  return parsed;
}

function normalizeCsvText(csvText) {
  if (csvText.charCodeAt(0) === 0xfeff) {
    return csvText.slice(1);
  }
  return csvText;
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }
      row.push(current);
      current = '';
      if (row.length > 1 || row[0] !== '') {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.length > 1 || row[0] !== '') {
    rows.push(row);
  }

  return rows;
}

function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return JSON.stringify(value);
  }
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function convertCsvValue(rawValue, column, rowNumber) {
  const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
  const empty = value === '' || value === undefined;

  if (empty) {
    if (column.isNullable) return null;
    return undefined;
  }

  const dataType = String(column.dataType || '').toLowerCase();
  const udtName = String(column.udtName || '').toLowerCase();

  if (udtName === 'vector') {
    throw new Error(`第 ${rowNumber} 行字段 ${column.name} 暂不支持导入非空 vector 值`);
  }

  if (dataType === 'boolean') {
    const normalized = String(value).toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
    throw new Error(`第 ${rowNumber} 行字段 ${column.name} 布尔值无效`);
  }

  if (['smallint', 'integer', 'bigint'].includes(dataType)) {
    const parsed = Number.parseInt(String(value), 10);
    if (Number.isNaN(parsed)) {
      throw new Error(`第 ${rowNumber} 行字段 ${column.name} 整数值无效`);
    }
    return parsed;
  }

  if (['real', 'double precision', 'numeric', 'decimal'].includes(dataType)) {
    const parsed = Number.parseFloat(String(value));
    if (Number.isNaN(parsed)) {
      throw new Error(`第 ${rowNumber} 行字段 ${column.name} 数值无效`);
    }
    return parsed;
  }

  if (['json', 'jsonb'].includes(dataType)) {
    try {
      return JSON.parse(String(value));
    } catch {
      throw new Error(`第 ${rowNumber} 行字段 ${column.name} JSON 格式无效`);
    }
  }

  if (dataType === 'array') {
    try {
      const parsed = JSON.parse(String(value));
      if (!Array.isArray(parsed)) {
        throw new Error('not array');
      }
      return parsed;
    } catch {
      throw new Error(`第 ${rowNumber} 行字段 ${column.name} 需要 JSON 数组`);
    }
  }

  return value;
}

async function getTableList(dbClient) {
  const tablesResult = await dbClient.query(
    `SELECT t.table_name
     FROM information_schema.tables t
     WHERE t.table_schema = 'public'
       AND t.table_type = 'BASE TABLE'
     ORDER BY t.table_name ASC`
  );

  return tablesResult.rows.map((row) => row.table_name);
}

async function getTableColumns(dbClient, tableName) {
  const result = await dbClient.query(
    `SELECT
        c.column_name,
        c.data_type,
        c.udt_name,
        c.is_nullable,
        c.column_default,
        c.ordinal_position
     FROM information_schema.columns c
     WHERE c.table_schema = 'public'
       AND c.table_name = $1
     ORDER BY c.ordinal_position ASC`,
    [tableName]
  );

  return result.rows.map((row) => ({
    name: row.column_name,
    dataType: row.data_type,
    udtName: row.udt_name,
    isNullable: row.is_nullable === 'YES',
    defaultValue: row.column_default,
    ordinalPosition: row.ordinal_position
  }));
}

async function getPrimaryKeyColumns(dbClient, tableName) {
  const result = await dbClient.query(
    `SELECT kcu.column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
     WHERE tc.table_schema = 'public'
       AND tc.table_name = $1
       AND tc.constraint_type = 'PRIMARY KEY'
     ORDER BY kcu.ordinal_position ASC`,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
}

async function getRowEstimateMap(dbClient) {
  const result = await dbClient.query(
    `SELECT c.relname AS table_name,
            GREATEST(COALESCE(c.reltuples, 0), 0)::bigint AS row_estimate
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'`
  );

  const map = new Map();
  result.rows.forEach((row) => {
    map.set(row.table_name, Number(row.row_estimate || 0));
  });
  return map;
}

async function ensureTableExists(dbClient, tableName) {
  const tables = await getTableList(dbClient);
  return tables.includes(tableName);
}

async function exportTableToCsv(dbClient, tableName) {
  const columns = await getTableColumns(dbClient, tableName);
  const headers = columns.map((column) => column.name);

  const result = await dbClient.query(`SELECT * FROM ${quoteIdentifier(tableName)}`);
  const lines = [headers.map(toCsvValue).join(',')];
  result.rows.forEach((row) => {
    const values = headers.map((header) => toCsvValue(row[header]));
    lines.push(values.join(','));
  });

  return lines.join('\n');
}

async function refreshIdSequenceIfNeeded(dbClient, tableName, primaryKey) {
  if (primaryKey !== 'id') return;

  const seqResult = await dbClient.query(
    `SELECT pg_get_serial_sequence($1, 'id') AS seq`,
    [tableName]
  );
  const seqName = seqResult.rows[0]?.seq;
  if (!seqName) return;

  await dbClient.query(
    `SELECT setval(
       $1::regclass,
       COALESCE((SELECT MAX(id) FROM ${quoteIdentifier(tableName)}), 1),
       true
     )`,
    [seqName]
  );
}

async function importCsvToTable(dbClient, tableName, rawCsvText) {
  let transactionStarted = false;

  try {
    const columns = await getTableColumns(dbClient, tableName);
    const pkColumns = await getPrimaryKeyColumns(dbClient, tableName);
    const singlePrimaryKey = pkColumns.length === 1 ? pkColumns[0] : null;
    const columnMap = new Map(columns.map((column) => [column.name, column]));

    const csvText = normalizeCsvText(rawCsvText);
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      throw new TableImportError('CSV 内容为空', null, 400);
    }

    const headers = rows[0].map((header) => String(header || '').trim());
    if (headers.length === 0 || headers.every((header) => !header)) {
      throw new TableImportError('CSV 表头为空', null, 400);
    }

    const unknownHeaders = headers.filter((header) => !columnMap.has(header));
    if (unknownHeaders.length > 0) {
      throw new TableImportError(`存在无效列: ${unknownHeaders.join(', ')}`, null, 400);
    }

    const dataRows = rows.slice(1);
    if (dataRows.length === 0) {
      throw new TableImportError('CSV 没有数据行', null, 400);
    }

    const validationErrors = [];
    const normalizedRows = dataRows.map((rawRow, index) => {
      const rowNumber = index + 2;
      const record = {};

      headers.forEach((header, headerIndex) => {
        record[header] = rawRow[headerIndex] ?? '';
      });

      const normalized = {};
      Object.keys(record).forEach((columnName) => {
        const column = columnMap.get(columnName);
        if (!column) return;
        try {
          const converted = convertCsvValue(record[columnName], column, rowNumber);
          if (converted !== undefined) {
            normalized[columnName] = converted;
          }
        } catch (error) {
          validationErrors.push({
            row: rowNumber,
            reason: error.message
          });
        }
      });

      return normalized;
    });

    if (validationErrors.length > 0) {
      throw new TableImportError(
        'CSV 校验失败',
        {
          total: dataRows.length,
          inserted: 0,
          updated: 0,
          skipped: dataRows.length,
          errors: validationErrors.slice(0, 200)
        },
        400
      );
    }

    await dbClient.query('BEGIN');
    transactionStarted = true;

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const rowErrors = [];

    for (let i = 0; i < normalizedRows.length; i += 1) {
      const rowNumber = i + 2;
      const rowData = normalizedRows[i];

      const rowKeys = Object.keys(rowData).filter((key) => columnMap.has(key));
      if (rowKeys.length === 0) {
        skipped += 1;
        continue;
      }

      const hasPkValue = (
        singlePrimaryKey &&
        rowData[singlePrimaryKey] !== undefined &&
        rowData[singlePrimaryKey] !== null &&
        String(rowData[singlePrimaryKey]).trim() !== ''
      );

      try {
        if (hasPkValue && singlePrimaryKey) {
          const insertColumns = [...new Set([singlePrimaryKey, ...rowKeys])];
          const values = insertColumns.map((column) => rowData[column]);
          const insertSql = insertColumns.map(quoteIdentifier).join(', ');
          const placeholderSql = insertColumns.map((_, index) => `$${index + 1}`).join(', ');

          const updateColumns = insertColumns.filter((column) => column !== singlePrimaryKey);
          if (updateColumns.length === 0) {
            skipped += 1;
            continue;
          }

          const updateSql = updateColumns
            .map((column) => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`)
            .join(', ');

          const query = `
            INSERT INTO ${quoteIdentifier(tableName)} (${insertSql})
            VALUES (${placeholderSql})
            ON CONFLICT (${quoteIdentifier(singlePrimaryKey)}) DO UPDATE SET ${updateSql}
            RETURNING (xmax = 0) AS inserted`;

          const result = await dbClient.query(query, values);
          if (result.rows[0]?.inserted) {
            inserted += 1;
          } else {
            updated += 1;
          }
        } else {
          const insertColumns = rowKeys.filter((column) => column !== singlePrimaryKey);
          if (insertColumns.length === 0) {
            skipped += 1;
            continue;
          }

          const values = insertColumns.map((column) => rowData[column]);
          const insertSql = insertColumns.map(quoteIdentifier).join(', ');
          const placeholderSql = insertColumns.map((_, index) => `$${index + 1}`).join(', ');
          const query = `
            INSERT INTO ${quoteIdentifier(tableName)} (${insertSql})
            VALUES (${placeholderSql})`;
          await dbClient.query(query, values);
          inserted += 1;
        }
      } catch (error) {
        rowErrors.push({ row: rowNumber, reason: error.message });
        break;
      }
    }

    if (rowErrors.length > 0) {
      await dbClient.query('ROLLBACK');
      transactionStarted = false;
      throw new TableImportError(
        '导入失败，事务已回滚',
        {
          total: dataRows.length,
          inserted: 0,
          updated: 0,
          skipped: dataRows.length,
          errors: rowErrors.slice(0, 200)
        },
        400
      );
    }

    await refreshIdSequenceIfNeeded(dbClient, tableName, singlePrimaryKey);
    await dbClient.query('COMMIT');
    transactionStarted = false;

    return {
      total: dataRows.length,
      inserted,
      updated,
      skipped,
      errors: []
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await dbClient.query('ROLLBACK');
      } catch {
        // ignore rollback error
      }
    }
    if (error instanceof TableImportError) {
      throw error;
    }
    throw new TableImportError(error.message || '导入失败', null, 500);
  }
}

function getTableNameFromEntryName(entryName) {
  const normalized = String(entryName || '').trim();
  if (!normalized.toLowerCase().endsWith('.csv')) return null;
  if (normalized.includes('/')) return null;
  const tableName = normalized.slice(0, -4);
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) return null;
  return tableName;
}

async function createTempDir(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function safeRemoveDir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
}

export function createDataCenterRouter(getDbClient) {
  const router = express.Router();

  router.get('/tables', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');

      const [tableNames, rowEstimateMap] = await Promise.all([
        getTableList(dbClient),
        getRowEstimateMap(dbClient)
      ]);

      const payload = [];
      for (const tableName of tableNames) {
        const [columns, pkColumns] = await Promise.all([
          getTableColumns(dbClient, tableName),
          getPrimaryKeyColumns(dbClient, tableName)
        ]);

        payload.push({
          tableName,
          rowCountEstimate: rowEstimateMap.get(tableName) || 0,
          primaryKey: pkColumns.length === 1 ? pkColumns[0] : null,
          primaryKeyColumns: pkColumns,
          columns: columns.map((column) => ({
            name: column.name,
            dataType: column.dataType,
            udtName: column.udtName,
            isNullable: column.isNullable,
            defaultValue: column.defaultValue
          }))
        });
      }

      res.json({ success: true, data: payload });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/tables/:table/rows', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');

      const tableName = String(req.params.table || '');
      const exists = await ensureTableExists(dbClient, tableName);
      if (!exists) {
        return res.status(404).json({ success: false, message: '表不存在' });
      }

      const columns = await getTableColumns(dbClient, tableName);
      const columnMap = new Map(columns.map((column) => [column.name, column]));
      const pkColumns = await getPrimaryKeyColumns(dbClient, tableName);

      const page = parsePositiveInt(req.query.page, 1);
      const pageSize = parsePositiveInt(req.query.pageSize, 50, 200);
      const search = String(req.query.search || '').trim();
      const sortByRaw = String(req.query.sortBy || '').trim();
      const sortOrderRaw = String(req.query.sortOrder || 'desc').toLowerCase();

      const sortBy = columnMap.has(sortByRaw)
        ? sortByRaw
        : (pkColumns[0] || columns[0]?.name || 'id');
      const sortOrder = sortOrderRaw === 'asc' ? 'ASC' : 'DESC';

      const params = [];
      const conditions = [];

      if (search) {
        const searchableColumns = columns
          .filter((column) => ['character varying', 'text', 'uuid', 'date', 'timestamp with time zone', 'timestamp without time zone'].includes(String(column.dataType).toLowerCase()))
          .map((column) => column.name);

        if (searchableColumns.length > 0) {
          const patternConditions = searchableColumns.map((columnName) => {
            params.push(`%${search}%`);
            return `${quoteIdentifier(columnName)}::text ILIKE $${params.length}`;
          });
          conditions.push(`(${patternConditions.join(' OR ')})`);
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countSql = `SELECT COUNT(*)::int AS total FROM ${quoteIdentifier(tableName)} ${whereClause}`;
      const countResult = await dbClient.query(countSql, params);
      const total = Number(countResult.rows[0]?.total || 0);

      params.push(pageSize);
      const limitParamIndex = params.length;
      params.push((page - 1) * pageSize);
      const offsetParamIndex = params.length;

      const dataSql = `
        SELECT *
        FROM ${quoteIdentifier(tableName)}
        ${whereClause}
        ORDER BY ${quoteIdentifier(sortBy)} ${sortOrder}
        LIMIT $${limitParamIndex}
        OFFSET $${offsetParamIndex}`;

      const dataResult = await dbClient.query(dataSql, params);

      res.json({
        success: true,
        data: {
          rows: dataResult.rows,
          columnMeta: columns.map((column) => ({
            name: column.name,
            dataType: column.dataType,
            udtName: column.udtName,
            isNullable: column.isNullable,
            defaultValue: column.defaultValue
          })),
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize))
          },
          sort: {
            sortBy,
            sortOrder: sortOrder.toLowerCase()
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/tables/:table/export.csv', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');

      const tableName = String(req.params.table || '');
      const exists = await ensureTableExists(dbClient, tableName);
      if (!exists) {
        return res.status(404).json({ success: false, message: '表不存在' });
      }

      const csv = await exportTableToCsv(dbClient, tableName);
      const date = new Date().toISOString().slice(0, 10);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${tableName}_${date}.csv"`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/export/all.zip', async (req, res) => {
    let tempDir = '';
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');

      const tableNames = await getTableList(dbClient);
      tempDir = await createTempDir('data-center-export-');
      const csvPaths = [];
      for (const tableName of tableNames) {
        const csv = await exportTableToCsv(dbClient, tableName);
        const csvPath = path.join(tempDir, `${tableName}.csv`);
        await fs.writeFile(csvPath, csv, 'utf8');
        csvPaths.push(csvPath);
      }

      const date = new Date().toISOString().slice(0, 10);
      const zipPath = path.join(tempDir, `data_center_all_${date}.zip`);
      await execFileAsync('zip', ['-q', '-j', zipPath, ...csvPaths], {
        maxBuffer: 200 * 1024 * 1024
      });
      const buffer = await fs.readFile(zipPath);

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="data_center_all_${date}.zip"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    } finally {
      if (tempDir) {
        await safeRemoveDir(tempDir);
      }
    }
  });

  router.get('/tables/:table/template.csv', async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');

      const tableName = String(req.params.table || '');
      const exists = await ensureTableExists(dbClient, tableName);
      if (!exists) {
        return res.status(404).json({ success: false, message: '表不存在' });
      }

      const columns = await getTableColumns(dbClient, tableName);
      const csv = `${columns.map((column) => toCsvValue(column.name)).join(',')}\n`;
      const date = new Date().toISOString().slice(0, 10);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${tableName}_template_${date}.csv"`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/tables/:table/import.csv', upload.single('file'), async (req, res) => {
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');

      const tableName = String(req.params.table || '');
      const exists = await ensureTableExists(dbClient, tableName);
      if (!exists) {
        return res.status(404).json({ success: false, message: '表不存在' });
      }

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ success: false, message: '请上传 CSV 文件' });
      }

      const result = await importCsvToTable(dbClient, tableName, req.file.buffer.toString('utf-8'));
      res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof TableImportError) {
        return res.status(error.statusCode || 400).json({
          success: false,
          message: error.message,
          data: error.result || undefined
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/import/all.zip', upload.single('file'), async (req, res) => {
    let tempDir = '';
    try {
      const dbClient = getDbClient();
      if (!dbClient) throw new Error('数据库未连接');

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ success: false, message: '请上传 ZIP 文件' });
      }

      tempDir = await createTempDir('data-center-import-');
      const zipPath = path.join(tempDir, 'uploaded.zip');
      await fs.writeFile(zipPath, req.file.buffer);

      let entryListText = '';
      try {
        const { stdout } = await execFileAsync('unzip', ['-Z1', zipPath], {
          maxBuffer: 50 * 1024 * 1024
        });
        entryListText = String(stdout || '');
      } catch {
        return res.status(400).json({ success: false, message: 'ZIP 文件无效或已损坏' });
      }

      const allEntryNames = entryListText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const allCsvEntryNames = allEntryNames.filter((entryName) =>
        entryName.toLowerCase().endsWith('.csv')
      );

      if (allCsvEntryNames.length === 0) {
        return res.status(400).json({ success: false, message: 'ZIP 中未找到 CSV 文件' });
      }

      const tableSet = new Set(await getTableList(dbClient));
      const tables = [];

      let processedTables = 0;
      let skippedTables = 0;
      let succeededTables = 0;
      let failedTables = 0;

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let erroredRows = 0;

      for (const entryName of allCsvEntryNames) {
        const tableName = getTableNameFromEntryName(entryName);

        if (!tableName) {
          skippedTables += 1;
          tables.push({
            tableName: entryName,
            status: 'ignored',
            reason: 'invalid_csv_filename_or_nested_path'
          });
          continue;
        }

        if (!tableSet.has(tableName)) {
          skippedTables += 1;
          tables.push({
            tableName,
            status: 'ignored',
            reason: 'table_not_found'
          });
          continue;
        }

        processedTables += 1;
        try {
          const { stdout } = await execFileAsync('unzip', ['-p', zipPath, entryName], {
            encoding: 'utf8',
            maxBuffer: 200 * 1024 * 1024
          });
          const csvText = String(stdout || '');
          const result = await importCsvToTable(dbClient, tableName, csvText);

          inserted += result.inserted;
          updated += result.updated;
          skipped += result.skipped;

          succeededTables += 1;
          tables.push({
            tableName,
            status: 'success',
            result
          });
        } catch (error) {
          failedTables += 1;

          const errorResult = error instanceof TableImportError ? error.result : null;
          if (errorResult?.errors?.length) {
            erroredRows += errorResult.errors.length;
          }

          tables.push({
            tableName,
            status: 'failed',
            reason: error.message || 'import_failed',
            result: errorResult || undefined
          });
        }
      }

      res.json({
        success: true,
        data: {
          zipFileName: req.file.originalname || 'uploaded.zip',
          totalCsvFiles: allCsvEntryNames.length,
          processedTables,
          skippedTables,
          succeededTables,
          failedTables,
          summary: {
            inserted,
            updated,
            skipped,
            erroredRows
          },
          tables
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    } finally {
      if (tempDir) {
        await safeRemoveDir(tempDir);
      }
    }
  });

  return router;
}
