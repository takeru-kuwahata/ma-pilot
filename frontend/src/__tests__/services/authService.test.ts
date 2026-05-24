import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../../services/api/authService';

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

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('login', () => {
    it('ログイン成功時にトークンとユーザーをlocalStorageに保存する', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'clinic_owner',
        clinic_id: 'clinic-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token-abc',
          token_type: 'bearer',
          user: mockUser,
        }),
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result.access_token).toBe('token-abc');
      expect(result.user.email).toBe('test@example.com');
      expect(mockLocalStorage.getItem('access_token')).toBe('token-abc');
      expect(JSON.parse(mockLocalStorage.getItem('user')!).email).toBe('test@example.com');
    });

    it('ログイン失敗時（400）にApiErrorをthrowする', async () => {
      // 注: 401は handleResponse がリダイレクトするため、400でテスト
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'メールアドレスまたはパスワードが間違っています' }),
      });

      const { ApiError } = await import('../../services/api/config');
      await expect(authService.login('wrong@example.com', 'wrong')).rejects.toThrow(ApiError);
    });

    it('正しいエンドポイントとContent-Typeで呼び出す', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token-xyz',
          token_type: 'bearer',
          user: { id: 'u1', email: 'a@b.com', role: 'clinic_owner' },
        }),
      });

      await authService.login('a@b.com', 'pass');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ email: 'a@b.com', password: 'pass' }),
        }),
      );
    });
  });

  describe('logout', () => {
    it('localStorageからトークンとユーザーを削除する', async () => {
      mockLocalStorage.setItem('access_token', 'token-abc');
      mockLocalStorage.setItem('user', '{"id":"u1"}');
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await authService.logout();

      expect(mockLocalStorage.getItem('access_token')).toBeNull();
      expect(mockLocalStorage.getItem('user')).toBeNull();
    });

    it('トークンがない場合はfetchを呼ばない', async () => {
      await authService.logout();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockLocalStorage.getItem('access_token')).toBeNull();
    });

    it('logoutエンドポイントにPOSTする', async () => {
      mockLocalStorage.setItem('access_token', 'my-token');
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await authService.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
        }),
      );
    });
  });

  describe('getCurrentUser', () => {
    it('localStorageにユーザーがある場合はパースして返す', () => {
      const mockUser = { id: 'u1', email: 'test@example.com', role: 'clinic_owner' };
      mockLocalStorage.setItem('user', JSON.stringify(mockUser));

      const user = authService.getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('localStorageにユーザーがない場合はnullを返す', () => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('不正なJSONの場合はnullを返す', () => {
      mockLocalStorage.setItem('user', 'not-valid-json{');
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('トークンがある場合はtrueを返す', () => {
      mockLocalStorage.setItem('access_token', 'some-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('トークンがない場合はfalseを返す', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('メールアドレスでパスワードリセットをリクエストする', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'パスワードリセットメールを送信しました' }),
      });

      const result = await authService.resetPassword('test@example.com');

      expect(result).toHaveProperty('message');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/reset-password'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('register', () => {
    it('必要な情報で新規登録リクエストを送る', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: '登録が完了しました' }),
      });

      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        clinic_name: 'テスト歯科医院',
        postal_code: '150-0001',
        address: '東京都渋谷区1-2-3',
        phone_number: '03-1234-5678',
      };

      const result = await authService.register(registerData);

      expect(result.message).toBeTruthy();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(registerData),
        }),
      );
    });
  });
});
