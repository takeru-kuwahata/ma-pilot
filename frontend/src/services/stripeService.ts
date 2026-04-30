const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8432';

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
}

export const createPaymentIntent = async (orderId: string): Promise<PaymentIntentResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/stripe/payment-intent/${orderId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || '決済の準備に失敗しました');
  }

  return response.json();
};

export const confirmPaymentOnServer = async (
  orderId: string,
  paymentIntentId: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/stripe/confirm/${orderId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_intent_id: paymentIntentId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || '決済確認に失敗しました');
  }
};
