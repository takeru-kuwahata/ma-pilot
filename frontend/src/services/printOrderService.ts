import type {
  PriceTable,
  PrintOrder,
  PrintOrderFormData,
  PriceEstimateResponse,
} from '../types';

export interface PriceTableFormData {
  product_type: string;
  quantity: number;
  price: number;
  design_fee: number;
  design_fee_included: boolean;
  delivery_days: number;
  specifications?: string;
}
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8432';

/**
 * 価格マスタ取得（Supabaseから直接取得）
 */
export const getPriceTables = async (): Promise<PriceTable[]> => {
  const { data, error } = await supabase
    .from('price_tables')
    .select('*')
    .order('product_type', { ascending: true })
    .order('quantity', { ascending: true });

  if (error) {
    throw new Error(`価格マスタの取得に失敗しました: ${error.message}`);
  }

  return data || [];
};

/**
 * 価格マスタ新規作成
 */
export const createPriceTable = async (data: PriceTableFormData): Promise<PriceTable> => {
  const response = await fetch(`${API_BASE_URL}/api/price-tables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || `作成に失敗しました: ${response.statusText}`);
  }
  return response.json();
};

/**
 * 価格マスタ更新
 */
export const updatePriceTable = async (id: string, data: Partial<PriceTableFormData>): Promise<PriceTable> => {
  const response = await fetch(`${API_BASE_URL}/api/price-tables/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || `更新に失敗しました: ${response.statusText}`);
  }
  return response.json();
};

/**
 * 価格マスタ削除
 */
export const deletePriceTable = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/price-tables/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || `削除に失敗しました: ${response.statusText}`);
  }
};

/**
 * 見積もり計算（Supabaseから価格マスタを取得して計算）
 */
export const calculateEstimate = async (
  productType: string,
  quantity: number
): Promise<PriceEstimateResponse> => {
  // 価格マスタから該当する商品・数量を取得
  const { data, error } = await supabase
    .from('price_tables')
    .select('*')
    .eq('product_type', productType)
    .eq('quantity', quantity)
    .single();

  if (error || !data) {
    throw new Error(`該当する価格情報が見つかりませんでした`);
  }

  // 見積もり計算
  const basePrice = data.price;
  const designFee = 0; // フロントエンドでは基本価格のみ表示、デザイン料は含めない

  return {
    estimated_price: basePrice,
    breakdown: {
      base_price: basePrice,
      design_fee: designFee,
      total: basePrice + designFee,
    },
    delivery_days: data.delivery_days,
    price_table_id: data.id,
  };
};

/**
 * 注文作成
 */
export const createPrintOrder = async (
  orderData: PrintOrderFormData
): Promise<PrintOrder> => {
  const response = await fetch(`${API_BASE_URL}/api/print-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `注文の作成に失敗しました: ${response.statusText}`
    );
  }

  const json = await response.json();
  // バックエンドはApiResponse({ data: PrintOrder })でラップして返す
  return json.data ?? json;
};

/**
 * 注文履歴取得
 */
export const getPrintOrders = async (params?: {
  clinic_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PrintOrder[]> => {
  const queryParams = new URLSearchParams();

  if (params?.clinic_id) {
    queryParams.append('clinic_id', params.clinic_id);
  }
  if (params?.status) {
    queryParams.append('status', params.status);
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.offset) {
    queryParams.append('offset', params.offset.toString());
  }

  const url = `${API_BASE_URL}/api/print-orders${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`注文履歴の取得に失敗しました: ${response.statusText}`);
  }

  return response.json();
};

/**
 * 注文詳細取得
 */
export const getPrintOrder = async (orderId: string): Promise<PrintOrder> => {
  const response = await fetch(`${API_BASE_URL}/api/print-orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`注文詳細の取得に失敗しました: ${response.statusText}`);
  }

  return response.json();
};

/**
 * 注文承認（決済処理含む）
 */
export const approvePrintOrder = async (
  orderId: string,
  paymentMethodId?: string
): Promise<PrintOrder> => {
  const response = await fetch(
    `${API_BASE_URL}/api/print-orders/${orderId}/approve`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_method_id: paymentMethodId,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `注文承認に失敗しました: ${response.statusText}`
    );
  }

  return response.json();
};

/**
 * 注文への添付ファイルアップロード
 */
export const uploadOrderAttachment = async (
  orderId: string,
  file: File
): Promise<{ url: string; filename: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_BASE_URL}/api/print-orders/${orderId}/attachment`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `ファイルのアップロードに失敗しました: ${response.statusText}`
    );
  }

  const result = await response.json();
  return result.data;
};

/**
 * 見積もりPDFダウンロード
 */
export const downloadEstimatePdf = async (orderId: string): Promise<Blob> => {
  const response = await fetch(
    `${API_BASE_URL}/api/print-orders/${orderId}/estimate-pdf`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    throw new Error(`PDFのダウンロードに失敗しました: ${response.statusText}`);
  }

  return response.blob();
};
