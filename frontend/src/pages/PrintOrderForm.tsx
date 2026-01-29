import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  MenuItem,
  Select,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { useLayout } from '../hooks/useLayout';
import type {
  PrintOrderFormData,
  PriceTable,
  PrintOrderPattern,
} from '../types';
import * as printOrderService from '../services/printOrderService';

const PRODUCT_TYPES = [
  '診察券',
  '名刺',
  'リコールハガキ',
  'A4三つ折りリーフレット',
  'ネームプレート',
];

export default function PrintOrderForm() {
  const { Layout } = useLayout();
  const [pattern, setPattern] = useState<PrintOrderPattern>('consultation');
  const [priceTables, setPriceTables] = useState<PriceTable[]>([]);
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [availableQuantities, setAvailableQuantities] = useState<number[]>([]);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PrintOrderFormData>({
    defaultValues: {
      clinic_name: '',
      email: '',
      pattern: 'consultation',
      product_type: '',
      quantity: undefined,
      delivery_date: '',
      design_required: false,
      notes: '',
    },
  });

  const watchProductType = watch('product_type');
  const watchQuantity = watch('quantity');

  // 価格マスタ取得
  useEffect(() => {
    const fetchPriceTables = async () => {
      try {
        const data = await printOrderService.getPriceTables();
        setPriceTables(data);
      } catch (error) {
        console.error('価格マスタ取得エラー:', error);
        setSubmitError('価格マスタの取得に失敗しました。');
      }
    };

    fetchPriceTables();
  }, []);

  // 商品種類が選択されたら、該当する数量の選択肢を更新
  useEffect(() => {
    if (watchProductType && pattern === 'reorder') {
      const quantities = priceTables
        .filter((pt) => pt.product_type === watchProductType)
        .map((pt) => pt.quantity)
        .sort((a, b) => a - b);

      setAvailableQuantities(quantities);
      setSelectedProductType(watchProductType);

      // 数量をリセット
      setValue('quantity', undefined);
      setEstimatedPrice(null);
    }
  }, [watchProductType, pattern, priceTables, setValue]);

  // 見積もり計算
  const calculateEstimate = useCallback(async () => {
    if (!watchProductType || !watchQuantity) return;

    setEstimating(true);

    try {
      const estimateData = await printOrderService.calculateEstimate(
        watchProductType,
        watchQuantity
      );
      setEstimatedPrice(estimateData.estimated_price);
    } catch (error) {
      console.error('見積もり計算エラー:', error);
      setEstimatedPrice(null);
    } finally {
      setEstimating(false);
    }
  }, [watchProductType, watchQuantity]);

  // パターンC: 数量が選択されたら自動見積もり
  useEffect(() => {
    if (pattern === 'reorder' && watchProductType && watchQuantity) {
      calculateEstimate();
    }
  }, [pattern, watchProductType, watchQuantity, calculateEstimate]);

  // フォーム送信
  const onSubmit = async (data: PrintOrderFormData) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const orderData: PrintOrderFormData = {
        clinic_name: data.clinic_name,
        email: data.email,
        pattern,
        product_type: pattern === 'reorder' ? data.product_type : (data.product_type || ''),
        quantity: pattern === 'reorder' ? data.quantity : data.quantity,
        delivery_date: data.delivery_date || '',
        design_required: data.design_required || false,
        notes: data.notes || '',
      };

      await printOrderService.createPrintOrder(orderData);

      setSubmitSuccess(true);
      reset();
      setEstimatedPrice(null);

      // 成功メッセージを5秒後に消す
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('注文送信エラー:', error);
      setSubmitError(
        error instanceof Error ? error.message : '注文の送信に失敗しました。もう一度お試しください。'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            印刷物注文フォーム
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* パターン選択 */}
          <FormControl component="fieldset" sx={{ mb: 4 }}>
            <FormLabel component="legend">注文パターン</FormLabel>
            <RadioGroup
              row
              value={pattern}
              onChange={(e) => {
                setPattern(e.target.value as PrintOrderPattern);
                setValue('pattern', e.target.value as PrintOrderPattern);
                setEstimatedPrice(null);
              }}
            >
              <FormControlLabel
                value="consultation"
                control={<Radio />}
                label="相談フォーム（初回・内容未確定）"
              />
              <FormControlLabel
                value="reorder"
                control={<Radio />}
                label="再注文（内容確定・見積もり自動計算）"
              />
            </RadioGroup>
          </FormControl>

          {/* 成功・エラーメッセージ */}
          {submitSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              ご注文を受け付けました。確認メールをお送りしましたのでご確認ください。
            </Alert>
          )}
          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* 必須項目: クリニック名・メールアドレス */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="clinic_name"
                  control={control}
                  rules={{ required: 'クリニック名は必須です' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="クリニック名"
                      fullWidth
                      required
                      error={!!errors.clinic_name}
                      helperText={errors.clinic_name?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: 'メールアドレスは必須です',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: '正しいメールアドレスを入力してください',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="メールアドレス"
                      type="email"
                      fullWidth
                      required
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>

              {/* パターンC: 商品種類・数量（必須） */}
              {pattern === 'reorder' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="product_type"
                      control={control}
                      rules={{ required: '商品種類は必須です' }}
                      render={({ field }) => (
                        <FormControl fullWidth required error={!!errors.product_type}>
                          <InputLabel>商品種類</InputLabel>
                          <Select {...field} label="商品種類">
                            {PRODUCT_TYPES.map((type) => (
                              <MenuItem key={type} value={type}>
                                {type}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.product_type && (
                            <Typography variant="caption" color="error">
                              {errors.product_type.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="quantity"
                      control={control}
                      rules={{ required: '数量は必須です' }}
                      render={({ field }) => (
                        <FormControl
                          fullWidth
                          required
                          error={!!errors.quantity}
                          disabled={!selectedProductType}
                        >
                          <InputLabel>数量</InputLabel>
                          <Select {...field} label="数量" value={field.value || ''}>
                            {availableQuantities.map((qty) => (
                              <MenuItem key={qty} value={qty}>
                                {qty.toLocaleString()}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.quantity && (
                            <Typography variant="caption" color="error">
                              {errors.quantity.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>
                </>
              )}

              {/* パターンA/B: 商品種類・数量（任意） */}
              {pattern === 'consultation' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="product_type"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>商品種類（任意）</InputLabel>
                          <Select {...field} label="商品種類（任意）">
                            <MenuItem value="">
                              <em>未定</em>
                            </MenuItem>
                            {PRODUCT_TYPES.map((type) => (
                              <MenuItem key={type} value={type}>
                                {type}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="quantity"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="数量（任意）"
                          type="number"
                          fullWidth
                          inputProps={{ min: 1 }}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              {/* 納期希望日 */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="delivery_date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="納期希望日"
                      type="date"
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  )}
                />
              </Grid>

              {/* デザイン要否 */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="design_required"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label="デザイン作成を依頼する"
                    />
                  )}
                />
              </Grid>

              {/* 備考 */}
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="備考・ご要望"
                      multiline
                      rows={4}
                      fullWidth
                      placeholder="その他、ご要望やご質問がありましたらご記入ください"
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* パターンC: 見積もり表示 */}
            {pattern === 'reorder' && estimatedPrice !== null && (
              <Card sx={{ mt: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    見積もり金額
                  </Typography>
                  <Typography variant="h4">
                    ¥{estimatedPrice.toLocaleString()}
                    {estimating && <CircularProgress size={24} sx={{ ml: 2 }} />}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    ※この金額は自動計算による概算です。正式な見積もりは別途メールでお送りします。
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* 送信ボタン */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                sx={{ minWidth: 200 }}
              >
                {submitting ? <CircularProgress size={24} /> : '注文を送信'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Layout>
  );
}
