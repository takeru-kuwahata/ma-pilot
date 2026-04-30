import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { createPaymentIntent, confirmPaymentOnServer } from '../services/stripeService';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined;

interface StripePaymentFormProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const CardForm = ({ orderId, amount, onSuccess, onCancel }: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const { client_secret, payment_intent_id } = await createPaymentIntent(orderId);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('カード情報が入力されていません');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        client_secret,
        { payment_method: { card: cardElement } }
      );

      if (stripeError) {
        setError(stripeError.message || '決済に失敗しました');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        await confirmPaymentOnServer(orderId, payment_intent_id);
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '決済に失敗しました');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="body2" sx={{ mb: 2, color: '#616161' }}>
        お支払い金額：¥{Math.floor(amount * 1.1).toLocaleString()}（税込）
      </Typography>

      <Box
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '12px 16px',
          mb: 2,
          backgroundColor: '#fafafa',
        }}
      >
        <CardElement
          options={{
            style: {
              base: { fontSize: '16px', color: '#212121', '::placeholder': { color: '#9e9e9e' } },
              invalid: { color: '#d32f2f' },
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onCancel} disabled={processing}>
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || processing}
          sx={{ backgroundColor: '#FF6B35', '&:hover': { backgroundColor: '#E55A2B' } }}
        >
          {processing ? <CircularProgress size={20} color="inherit" /> : '決済する'}
        </Button>
      </Box>
    </Box>
  );
};

export const StripePaymentForm = (props: StripePaymentFormProps) => {
  if (!STRIPE_PUBLIC_KEY) {
    return (
      <Alert severity="info">
        クレジットカード決済は現在準備中です。請求書払いをお選びください。
      </Alert>
    );
  }

  const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

  return (
    <Elements stripe={stripePromise}>
      <CardForm {...props} />
    </Elements>
  );
};
