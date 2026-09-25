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

  const data = await response.json();

  if (!response.ok || !data.success) {
    if (response.status === 401) {
      localStorage.removeItem('topkpi_token');
      localStorage.removeItem('topkpi_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const errorMsg = data.message || 'Có lỗi xảy ra, vui lòng thử lại';
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
