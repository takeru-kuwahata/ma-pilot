const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8432';

export const API_BASE_URL = BACKEND_URL;

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public error?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // 401: セッション切れ → ローカルストレージをクリアしてログイン画面へ
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedClinicId');
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/login') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      window.location.href = '/login';
      // リダイレクト後はエラーをthrowせずに空のPromiseを返す
      return new Promise(() => {}) as Promise<T>;
    }
    const error = await response.json().catch(() => ({
      error: 'Unknown Error',
      message: response.statusText
    }));
    const apiError = new ApiError(
      response.status,
      error.message || error.detail || 'Request failed',
      error.error
    );
    // バックエンドの詳細エラーをdetailとして保持
    (apiError as ApiError & { detail?: string }).detail = error.detail;
    throw apiError;
  }
  return response.json();
}

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}
