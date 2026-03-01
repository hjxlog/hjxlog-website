import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import type {
  DataCenterBulkImportResult,
  DataCenterColumn,
  DataCenterImportResult,
  DataCenterTable
} from '@/types/dataCenter';
import {
  downloadAllDataCenterZip,
  downloadDataCenterCsv,
  downloadDataCenterTemplate,
  fetchDataCenterRows,
  fetchDataCenterTables,
  importAllDataCenterZip,
  importDataCenterCsv
} from '@/utils/dataCenterApi';

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

function toDisplayValue(value: unknown) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}

export default function DataCenterTab() {
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [tables, setTables] = useState<DataCenterTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<DataCenterColumn[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [importResult, setImportResult] = useState<DataCenterImportResult | null>(null);
  const [bulkImportResult, setBulkImportResult] = useState<DataCenterBulkImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);

  const selectedTableMeta = useMemo(
    () => tables.find((table) => table.tableName === selectedTable) || null,
    [tables, selectedTable]
  );

  const loadTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const nextTables = await fetchDataCenterTables();
      setTables(nextTables);
      if (nextTables.length > 0) {
        setSelectedTable((prev) => prev || nextTables[0].tableName);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载数据表失败');
    } finally {
      setLoadingTables(false);
    }
  }, []);

  const loadRows = useCallback(async () => {
    if (!selectedTable) return;
    setLoadingRows(true);
    try {
      const data = await fetchDataCenterRows({
        table: selectedTable,
        page,
        pageSize,
        search: search.trim(),
        sortBy,
        sortOrder
      });
      setRows(data.rows);
      setColumns(data.columnMeta);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setSortBy(data.sort.sortBy);
      setSortOrder(data.sort.sortOrder);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载数据失败');
      setRows([]);
      setColumns([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoadingRows(false);
    }
  }, [page, pageSize, search, selectedTable, sortBy, sortOrder]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  useEffect(() => {
    setPage(1);
    setImportResult(null);
  }, [selectedTable]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const handleToggleSort = useCallback((columnName: string) => {
    if (sortBy !== columnName) {
      setSortBy(columnName);
      setSortOrder('asc');
      return;
    }
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, [sortBy]);

  const handleDownloadExport = useCallback(async () => {
    if (!selectedTable) return;
    try {
      const { blob, fileName } = await downloadDataCenterCsv(selectedTable);
      downloadBlob(blob, fileName);
      toast.success('CSV 导出成功');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'CSV 导出失败');
    }
  }, [selectedTable]);

  const handleDownloadTemplate = useCallback(async () => {
    if (!selectedTable) return;
    try {
      const { blob, fileName } = await downloadDataCenterTemplate(selectedTable);
      downloadBlob(blob, fileName);
      toast.success('模板下载成功');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '模板下载失败');
    }
  }, [selectedTable]);

  const handleClickImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClickImportAll = useCallback(() => {
    zipInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedTable) return;
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const confirmed = window.confirm(
      '导入将按“有 id 更新、无 id 新增”执行，并可能覆盖敏感字段。确认继续？'
    );
    if (!confirmed) return;

    setUploading(true);
    try {
      const result = await importDataCenterCsv(selectedTable, file);
      if (!result.ok) {
        setImportResult(result.data || null);
        toast.error(result.message || 'CSV 导入失败');
        return;
      }
      setImportResult(result.data);
      toast.success(`导入完成：新增 ${result.data.inserted}，更新 ${result.data.updated}`);
      await loadRows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'CSV 导入失败');
    } finally {
      setUploading(false);
    }
  }, [loadRows, selectedTable]);

  const handleDownloadAll = useCallback(async () => {
    try {
      const { blob, fileName } = await downloadAllDataCenterZip();
      downloadBlob(blob, fileName);
      toast.success('全量 ZIP 导出成功');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '全量 ZIP 导出失败');
    }
  }, []);

  const handleImportAllZip = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const confirmed = window.confirm(
      '将按 ZIP 内每个 CSV 分表导入：表不存在会忽略，允许部分成功。确认继续？'
    );
    if (!confirmed) return;

    setUploading(true);
    try {
      const result = await importAllDataCenterZip(file);
      if (!result.ok) {
        setBulkImportResult(result.data || null);
        toast.error(result.message || '全量 ZIP 导入失败');
        return;
      }
      setBulkImportResult(result.data);
      toast.success(
        `全量导入完成：成功 ${result.data.succeededTables} 表，失败 ${result.data.failedTables}，忽略 ${result.data.skippedTables}`
      );
      await loadTables();
      await loadRows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '全量 ZIP 导入失败');
    } finally {
      setUploading(false);
    }
  }, [loadRows, loadTables]);

  return (
    <div className="flex h-[calc(100vh-9.5rem)] flex-col overflow-hidden space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">数据库数据中心</h3>
            <p className="mt-1 text-sm text-slate-500">浏览全部表，支持单表 CSV 与全量 ZIP 导入导出。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadAll}
              disabled={loadingTables || loadingRows}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              导出全部 ZIP
            </button>
            <button
              onClick={handleClickImportAll}
              disabled={uploading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              导入全部 ZIP
            </button>
            <button
              onClick={handleDownloadTemplate}
              disabled={!selectedTable || loadingRows}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              下载模板
            </button>
            <button
              onClick={handleDownloadExport}
              disabled={!selectedTable || loadingRows}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              导出 CSV
            </button>
            <button
              onClick={handleClickImport}
              disabled={!selectedTable || uploading}
              className="rounded-lg bg-[#165DFF] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0E4BA4] disabled:opacity-60"
            >
              {uploading ? '导入中...' : '导入 CSV'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportFile}
            />
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              className="hidden"
              onChange={handleImportAllZip}
            />
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">数据表</h4>
            <button
              onClick={loadTables}
              disabled={loadingTables}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              刷新
            </button>
          </div>

          {loadingTables ? (
            <p className="text-sm text-slate-500">加载中...</p>
          ) : (
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {tables.map((table) => (
                <button
                  key={table.tableName}
                  onClick={() => setSelectedTable(table.tableName)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    selectedTable === table.tableName
                      ? 'border-[#165DFF] bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate text-sm font-medium text-slate-800">{table.tableName}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    估算 {table.rowCountEstimate} 行
                    {table.primaryKey ? ` · PK: ${table.primaryKey}` : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-9">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-600">
              当前表：<span className="font-semibold text-slate-900">{selectedTable || '-'}</span>
              {selectedTableMeta?.primaryKey ? (
                <span className="ml-2 text-xs text-slate-500">主键 {selectedTableMeta.primaryKey}</span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="搜索文本字段..."
                className="w-52 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400"
              />
              <select
                value={String(pageSize)}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="20">20 / 页</option>
                <option value="50">50 / 页</option>
                <option value="100">100 / 页</option>
              </select>
            </div>
          </div>

          {loadingRows ? (
            <p className="py-10 text-center text-sm text-slate-500">数据加载中...</p>
          ) : columns.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">暂无可展示数据</p>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column.name}
                          className="cursor-pointer whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700"
                          onClick={() => handleToggleSort(column.name)}
                        >
                          {column.name}
                          {sortBy === column.name ? (
                            <span className="ml-1 text-xs text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          ) : null}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={`row-${rowIndex}`} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                        {columns.map((column) => (
                          <td key={`${rowIndex}-${column.name}`} className="max-w-[280px] truncate px-3 py-2 text-slate-700">
                            {toDisplayValue(row[column.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <div>
                  共 {total} 条，当前第 {page} / {totalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                    className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                    className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {importResult ? (
        <div className="max-h-52 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-900">最近一次导入结果</h4>
          <p className="mt-1 text-sm text-slate-600">
            总计 {importResult.total} 行，新增 {importResult.inserted}，更新 {importResult.updated}，跳过 {importResult.skipped}
          </p>
          {importResult.errors.length > 0 ? (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {importResult.errors.map((item, index) => (
                <div key={`err-${index}`}>
                  第 {item.row} 行：{item.reason}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {bulkImportResult ? (
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-900">最近一次全量 ZIP 导入结果</h4>
          <p className="mt-1 text-sm text-slate-600">
            文件 {bulkImportResult.zipFileName}，CSV {bulkImportResult.totalCsvFiles} 个；成功 {bulkImportResult.succeededTables} 表，失败 {bulkImportResult.failedTables} 表，忽略 {bulkImportResult.skippedTables} 表。
          </p>
          <p className="mt-1 text-xs text-slate-500">
            汇总：新增 {bulkImportResult.summary.inserted}，更新 {bulkImportResult.summary.updated}，跳过 {bulkImportResult.summary.skipped}，错误行 {bulkImportResult.summary.erroredRows}
          </p>
          <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            {bulkImportResult.tables.map((item, index) => (
              <div key={`${item.tableName}-${index}`} className="py-1">
                <span className="font-medium">{item.tableName}</span>
                <span className="ml-2">
                  {item.status === 'success' ? '成功' : item.status === 'failed' ? '失败' : '忽略'}
                </span>
                {item.result ? (
                  <span className="ml-2 text-slate-500">
                    新增 {item.result.inserted} / 更新 {item.result.updated} / 跳过 {item.result.skipped}
                  </span>
                ) : null}
                {item.reason ? <span className="ml-2 text-red-600">{item.reason}</span> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
