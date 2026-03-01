export interface DataCenterColumn {
  name: string;
  dataType: string;
  udtName: string;
  isNullable: boolean;
  defaultValue: string | null;
}

export interface DataCenterTable {
  tableName: string;
  rowCountEstimate: number;
  primaryKey: string | null;
  primaryKeyColumns: string[];
  columns: DataCenterColumn[];
}

export interface DataCenterPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DataCenterRowsResponse {
  rows: Record<string, unknown>[];
  columnMeta: DataCenterColumn[];
  pagination: DataCenterPagination;
  sort: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export interface DataCenterImportResult {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    reason: string;
  }>;
}

export interface DataCenterBulkImportTableResult {
  tableName: string;
  status: 'success' | 'failed' | 'ignored';
  reason?: string;
  result?: DataCenterImportResult;
}

export interface DataCenterBulkImportResult {
  zipFileName: string;
  totalCsvFiles: number;
  processedTables: number;
  skippedTables: number;
  succeededTables: number;
  failedTables: number;
  summary: {
    inserted: number;
    updated: number;
    skipped: number;
    erroredRows: number;
  };
  tables: DataCenterBulkImportTableResult[];
}
