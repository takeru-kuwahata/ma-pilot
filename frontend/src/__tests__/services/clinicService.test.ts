import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clinicService } from '../../services/api/clinicService';

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

const SAMPLE_CLINIC = {
  id: 'clinic-uuid-001',
  name: 'テスト歯科医院',
  slug: 'test-dental',
  postal_code: '150-0001',
  address: '東京都渋谷区1-2-3',
  phone_number: '03-1234-5678',
  latitude: 35.6595,
  longitude: 139.7004,
  owner_id: 'owner-uuid-001',
  is_active: true,
  openhouse_status: 'none',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('clinicService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe('getClinic', () => {
    it('医院データを取得して返す', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: SAMPLE_CLINIC }),
      });

      const clinic = await clinicService.getClinic('clinic-uuid-001');

      expect(clinic.id).toBe('clinic-uuid-001');
      expect(clinic.name).toBe('テスト歯科医院');
    });

    it('正しいエンドポイントにGETリクエストを送る', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: SAMPLE_CLINIC }),
      });

      await clinicService.getClinic('clinic-uuid-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clinics/clinic-uuid-001'),
        expect.any(Object),
      );
    });

    it('Authorizationヘッダーを送る（トークンあり）', async () => {
      mockLocalStorage.setItem('access_token', 'my-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: SAMPLE_CLINIC }),
      });

      await clinicService.getClinic('clinic-uuid-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
        }),
      );
    });

    it('APIエラー時はApiErrorをthrowする', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: '医院が見つかりません' }),
      });

      const { ApiError } = await import('../../services/api/config');
      await expect(clinicService.getClinic('nonexistent-id')).rejects.toThrow(ApiError);
    });
  });

  describe('updateClinic', () => {
    it('医院データを更新して返す', async () => {
      const updatedClinic = { ...SAMPLE_CLINIC, name: '更新された歯科医院' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedClinic }),
      });

      const result = await clinicService.updateClinic('clinic-uuid-001', {
        name: '更新された歯科医院',
        address: '東京都渋谷区1-2-3',
        phone_number: '03-1234-5678',
        postal_code: '150-0001',
      });

      expect(result.name).toBe('更新された歯科医院');
    });

    it('PUTメソッドで正しいエンドポイントにリクエストを送る', async () => {
      const updateData = {
        name: 'テスト歯科',
        address: '東京都港区1-1-1',
        phone_number: '03-9999-8888',
        postal_code: '105-0001',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: SAMPLE_CLINIC }),
      });

      await clinicService.updateClinic('clinic-uuid-001', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clinics/clinic-uuid-001'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        }),
      );
    });

    it('更新エラー時はApiErrorをthrowする', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'バリデーションエラー' }),
      });

      const { ApiError } = await import('../../services/api/config');
      await expect(
        clinicService.updateClinic('clinic-uuid-001', {
          name: '',
          address: '',
          phone_number: '',
          postal_code: '',
        }),
      ).rejects.toThrow(ApiError);
    });
  });
});
