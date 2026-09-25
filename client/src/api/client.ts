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
