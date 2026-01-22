import type {
  PriceTable,
  PrintOrder,
  PrintOrderFormData,
  PriceEstimateResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8432';

/**
 * 価格マスタ取得
 */
export const getPriceTables = async (): Promise<PriceTable[]> => {
  const response = await fetch(`${API_BASE_URL}/api/price-tables`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`価格マスタの取得に失敗しました: ${response.statusText}`);
  }

  return response.json();
};

/**
 * 見積もり計算
 */
export const calculateEstimate = async (
  productType: string,
  quantity: number
): Promise<PriceEstimateResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/print-orders/estimate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_type: productType,
      quantity,
    }),
  });

  if (!response.ok) {
    throw new Error(`見積もり計算に失敗しました: ${response.statusText}`);
  }

  return response.json();
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

  return response.json();
};

/**
 * 注文履歴取得
 */
export const getPrintOrders = async (params?: {
  clinicName?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PrintOrder[]> => {
  const queryParams = new URLSearchParams();

  if (params?.clinicName) {
    queryParams.append('clinic_name', params.clinicName);
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
