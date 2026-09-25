const API_BASE = '/api';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('topkpi_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any = null;
  const rawText = await response.text();
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {
      success: false,
      message: `Máy chủ phản hồi không đúng định dạng (${response.status} ${response.statusText}). Có thể backend đang khởi động lại.`,
    };
  }

  if (!response.ok || !data.success) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('topkpi_token');
      localStorage.removeItem('topkpi_user');
      window.location.hash = '/login';
    }
    const errorMsg = data.message || `Lỗi máy chủ (${response.status} ${response.statusText})`;
    throw new Error(errorMsg);
  }

  return data.data;
}

export const api = {
  get: async (url: string) => {
    const data = await apiClient<any>(url.replace('/api', ''), { method: 'GET' });
    return { data: { success: true, data } };
  },
  post: async (url: string, body?: any) => {
    const data = await apiClient<any>(url.replace('/api', ''), { method: 'POST', body: JSON.stringify(body) });
    return { data: { success: true, data } };
  },
  put: async (url: string, body?: any) => {
    const data = await apiClient<any>(url.replace('/api', ''), { method: 'PUT', body: JSON.stringify(body) });
    return { data: { success: true, data } };
  },
  delete: async (url: string) => {
    const data = await apiClient<any>(url.replace('/api', ''), { method: 'DELETE' });
    return { data: { success: true, data } };
  },
};
