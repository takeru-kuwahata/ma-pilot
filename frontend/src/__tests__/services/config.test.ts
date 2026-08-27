import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthHeaders, ensureFreshToken } from '../../services/api/config';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
vi.stubGlobal('localStorage', mockLocalStorage);

const nowSeconds = () => Math.floor(Date.now() / 1000);

describe('getAuthHeaders / ensureFreshToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('トークンが失効間近でなければリフレッシュせずヘッダーを返す', async () => {
    mockLocalStorage.setItem('access_token', 'valid-token');
    mockLocalStorage.setItem('refresh_token', 'refresh-abc');
    mockLocalStorage.setItem('token_expires_at', String(nowSeconds() + 3600));

    const headers = await getAuthHeaders();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(headers).toMatchObject({ Authorization: 'Bearer valid-token' });
  });

  it('失効5分前を切ったらリフレッシュして新トークンを保存・使用する', async () => {
    mockLocalStorage.setItem('access_token', 'old-token');
    mockLocalStorage.setItem('refresh_token', 'refresh-abc');
    mockLocalStorage.setItem('token_expires_at', String(nowSeconds() + 60));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_at: nowSeconds() + 3600,
      }),
    });

    const headers = await getAuthHeaders();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refresh_token: 'refresh-abc' }),
      }),
    );
    expect(mockLocalStorage.getItem('access_token')).toBe('new-token');
    expect(mockLocalStorage.getItem('refresh_token')).toBe('new-refresh');
    expect(headers).toMatchObject({ Authorization: 'Bearer new-token' });
  });

  it('リフレッシュ失敗時は既存トークンのまま続行する（throwしない）', async () => {
    mockLocalStorage.setItem('access_token', 'old-token');
    mockLocalStorage.setItem('refresh_token', 'refresh-abc');
    mockLocalStorage.setItem('token_expires_at', String(nowSeconds() - 10));
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    const headers = await getAuthHeaders();

    expect(headers).toMatchObject({ Authorization: 'Bearer old-token' });
  });

  it('refresh_tokenが無い（旧セッション）ならリフレッシュを試みない', async () => {
    mockLocalStorage.setItem('access_token', 'legacy-token');

    const headers = await getAuthHeaders();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(headers).toMatchObject({ Authorization: 'Bearer legacy-token' });
  });

  it('同時に複数回呼ばれてもリフレッシュは1回だけ実行される（単一飛行）', async () => {
    mockLocalStorage.setItem('access_token', 'old-token');
    mockLocalStorage.setItem('refresh_token', 'refresh-abc');
    mockLocalStorage.setItem('token_expires_at', String(nowSeconds() + 60));
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_at: nowSeconds() + 3600,
      }),
    });

    await Promise.all([ensureFreshToken(), ensureFreshToken(), ensureFreshToken()]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
