const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8432';

export const API_BASE_URL = BACKEND_URL;

// アクセストークン失効の何秒前からリフレッシュを行うか
const REFRESH_MARGIN_SECONDS = 300;

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

export function clearAuthStorage(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expires_at');
  localStorage.removeItem('user');
  localStorage.removeItem('selectedClinicId');
}

export function saveSession(session: {
  access_token: string;
  refresh_token?: string | null;
  expires_at?: number | null;
}): void {
  localStorage.setItem('access_token', session.access_token);
  if (session.refresh_token) {
    localStorage.setItem('refresh_token', session.refresh_token);
  }
  if (session.expires_at) {
    localStorage.setItem('token_expires_at', String(session.expires_at));
  }
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // 401: セッション切れ → ローカルストレージをクリアしてログイン画面へ
    if (response.status === 401) {
      clearAuthStorage();
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

// 同時リクエストで多重リフレッシュしないための単一飛行Promise
let refreshPromise: Promise<void> | null = null;

async function refreshSession(refreshToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  if (!response.ok) {
    throw new Error(`Token refresh failed: HTTP ${response.status}`);
  }
  const data = await response.json();
  saveSession(data);
}

/**
 * アクセストークンが失効間近ならリフレッシュする。
 * リフレッシュ失敗時は現在のトークンのまま続行し、後続APIの401処理
 * （handleResponseのログイン画面リダイレクト）に委ねる。
 */
export async function ensureFreshToken(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');
  const expiresAt = Number(localStorage.getItem('token_expires_at'));
  if (!refreshToken || !expiresAt) return;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds < expiresAt - REFRESH_MARGIN_SECONDS) return;

  if (!refreshPromise) {
    refreshPromise = refreshSession(refreshToken).finally(() => {
      refreshPromise = null;
    });
  }
  try {
    await refreshPromise;
  } catch (e) {
    console.error('Token refresh failed:', e);
  }
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  await ensureFreshToken();
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}
