import type {
  DataCenterBulkImportResult,
  DataCenterImportResult,
  DataCenterRowsResponse,
  DataCenterTable
} from '@/types/dataCenter';

const BASE_PATH = '/api/admin/data-center';

function getAuthToken() {
  try {
    const authData = localStorage.getItem('auth') || sessionStorage.getItem('auth');
    if (!authData) return '';
    const parsed = JSON.parse(authData);
    return parsed?.token || '';
  } catch {
    return '';
  }
}

function createAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const token = getAuthToken();
  if (!token) return { ...extraHeaders };
  return {
    Authorization: `Bearer ${token}`,
    ...extraHeaders
  };
}

async function parseJsonResponse(response: Response) {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const responseBody = (payload && typeof payload === 'object') ? payload as Record<string, unknown> : null;
  const success = responseBody?.success === true;
  const message = typeof responseBody?.message === 'string' ? responseBody.message : '';
  const data = responseBody?.data;

  if (!response.ok) {
    throw new Error(message || `HTTP ${response.status}`);
  }

  if (!success) {
    throw new Error(message || '请求失败');
  }

  return data;
}

export async function fetchDataCenterTables() {
  const response = await fetch(`${BASE_PATH}/tables`, {
    headers: createAuthHeaders()
  });
  return parseJsonResponse(response) as Promise<DataCenterTable[]>;
}

export async function fetchDataCenterRows(params: {
  table: string;
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    ...(params.search ? { search: params.search } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortOrder ? { sortOrder: params.sortOrder } : {})
  });

  const response = await fetch(`${BASE_PATH}/tables/${encodeURIComponent(params.table)}/rows?${query.toString()}`, {
    headers: createAuthHeaders()
  });
  return parseJsonResponse(response) as Promise<DataCenterRowsResponse>;
}

export async function importDataCenterCsv(table: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_PATH}/tables/${encodeURIComponent(table)}/import.csv`, {
    method: 'POST',
    headers: createAuthHeaders(),
    body: formData
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    return {
      ok: false,
      message: payload?.message || `HTTP ${response.status}`,
      data: payload?.data as DataCenterImportResult | undefined
    };
  }

  return {
    ok: true,
    message: '',
    data: payload.data as DataCenterImportResult
  };
}

export async function downloadDataCenterCsv(table: string) {
  const response = await fetch(`${BASE_PATH}/tables/${encodeURIComponent(table)}/export.csv`, {
    headers: createAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`导出失败 (${response.status})`);
  }
  const blob = await response.blob();
  return {
    blob,
    fileName: `${table}_${new Date().toISOString().slice(0, 10)}.csv`
  };
}

export async function downloadDataCenterTemplate(table: string) {
  const response = await fetch(`${BASE_PATH}/tables/${encodeURIComponent(table)}/template.csv`, {
    headers: createAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`下载模板失败 (${response.status})`);
  }
  const blob = await response.blob();
  return {
    blob,
    fileName: `${table}_template_${new Date().toISOString().slice(0, 10)}.csv`
  };
}

export async function downloadAllDataCenterZip() {
  const response = await fetch(`${BASE_PATH}/export/all.zip`, {
    headers: createAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`导出全部失败 (${response.status})`);
  }
  const blob = await response.blob();
  return {
    blob,
    fileName: `data_center_all_${new Date().toISOString().slice(0, 10)}.zip`
  };
}

export async function importAllDataCenterZip(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_PATH}/import/all.zip`, {
    method: 'POST',
    headers: createAuthHeaders(),
    body: formData
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    return {
      ok: false,
      message: payload?.message || `HTTP ${response.status}`,
      data: payload?.data as DataCenterBulkImportResult | undefined
    };
  }

  return {
    ok: true,
    message: '',
    data: payload.data as DataCenterBulkImportResult
  };
}
