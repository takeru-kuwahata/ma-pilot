import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Supabaseクライアントをモック（getPriceTables, calculateEstimateが使用）
// vi.mockはホイストされるため、ファクトリ内で直接チェーンを構築する
vi.mock('../../lib/supabase', () => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
  };
  // 全メソッドがデフォルトでchainを返す（resolveOneで上書き可能）
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.single.mockReturnValue(chain);
  return {
    supabase: { from: vi.fn(() => chain) },
    __chain: chain,
  };
});

import * as printOrderService from '../../services/printOrderService';

const SAMPLE_PRICE_TABLE = {
  id: 'price-001',
  product_type: 'チラシ',
  quantity: 1000,
  price: 15000,
  design_fee: 5000,
  design_fee_included: false,
  delivery_days: 7,
  specifications: 'A4サイズ',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const SAMPLE_PRINT_ORDER = {
  id: 'order-uuid-001',
  clinic_id: 'clinic-uuid-001',
  price_table_id: 'price-001',
  product_type: 'チラシ',
  quantity: 1000,
  unit_price: 15000,
  design_fee: 0,
  total_price: 15000,
  status: 'pending',
  notes: 'テスト注文',
  delivery_address: '東京都渋谷区1-2-3',
  estimated_delivery_date: '2025-04-07',
  created_at: '2025-03-31T00:00:00Z',
  updated_at: '2025-03-31T00:00:00Z',
};

describe('printOrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPriceTables', () => {
    it('Supabaseから価格マスタ一覧を取得する', async () => {
      const { __chain } = await import('../../lib/supabase') as unknown as { __chain: Record<string, ReturnType<typeof vi.fn>> };
      // 2回目の .order() がPromiseとして解決する
      __chain.order.mockReturnValueOnce(__chain).mockResolvedValueOnce({
        data: [SAMPLE_PRICE_TABLE],
        error: null,
      });

      const result = await printOrderService.getPriceTables();

      expect(Array.isArray(result)).toBe(true);
    });

    it('エラー時はエラーをthrowする', async () => {
      const { __chain } = await import('../../lib/supabase') as unknown as { __chain: Record<string, ReturnType<typeof vi.fn>> };
      __chain.order.mockReturnValueOnce(__chain).mockResolvedValueOnce({
        data: null,
        error: { message: 'DB接続エラー' },
      });

      await expect(printOrderService.getPriceTables()).rejects.toThrow('価格マスタの取得に失敗しました');
    });
  });

  describe('getPrintOrders', () => {
    it('注文一覧を取得する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [SAMPLE_PRINT_ORDER],
      });

      const result = await printOrderService.getPrintOrders({ clinic_id: 'clinic-uuid-001' });

      expect(Array.isArray(result)).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/print-orders'),
        expect.any(Object),
      );
    });

    it('clinic_idクエリパラメータを付与する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await printOrderService.getPrintOrders({ clinic_id: 'clinic-abc' });

      const [url] = mockFetch.mock.calls[0] as [string, ...unknown[]];
      expect(url).toContain('clinic_id=clinic-abc');
    });

    it('エラー時はエラーをthrowする', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(printOrderService.getPrintOrders()).rejects.toThrow('注文履歴の取得に失敗しました');
    });
  });

  describe('createPrintOrder', () => {
    it('POSTで注文を作成して返す', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: SAMPLE_PRINT_ORDER }),
      });

      const orderData = {
        clinic_id: 'clinic-uuid-001',
        clinic_name: 'テスト歯科医院',
        email: 'test@example.com',
        pattern: 'consultation' as const,
        product_type: 'チラシ',
        quantity: 1000,
        delivery_address: '東京都渋谷区1-2-3',
      };

      const result = await printOrderService.createPrintOrder(orderData);

      expect(result).toBeTruthy();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/print-orders'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('作成失敗時はエラーをthrowする', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({ detail: 'バリデーションエラー' }),
      });

      await expect(
        printOrderService.createPrintOrder({
          clinic_id: '',
          clinic_name: '',
          email: '',
          pattern: 'consultation' as const,
        }),
      ).rejects.toThrow();
    });
  });

  describe('approvePrintOrder', () => {
    it('注文承認リクエストを送る', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...SAMPLE_PRINT_ORDER, status: 'approved' }),
      });

      const result = await printOrderService.approvePrintOrder('order-uuid-001', 'pm_test_xxx');

      expect(result).toBeTruthy();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/print-orders/order-uuid-001/approve'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('downloadEstimatePdf', () => {
    it('PDFをBlobとして返す', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await printOrderService.downloadEstimatePdf('order-uuid-001');

      expect(result).toBeInstanceOf(Blob);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/print-orders/order-uuid-001/estimate-pdf'),
        expect.any(Object),
      );
    });

    it('エラー時はエラーをthrowする', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(printOrderService.downloadEstimatePdf('nonexistent-id')).rejects.toThrow(
        'PDFのダウンロードに失敗しました',
      );
    });
  });
});
