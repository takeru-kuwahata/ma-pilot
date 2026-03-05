import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import type {
  PrintOrderFormData,
  PriceTable,
  PrintOrderPattern,
  Clinic,
} from '../types';
import * as printOrderService from '../services/printOrderService';
import * as clinicService from '../services/api/clinicService';
import { useCurrentClinic } from '../hooks/useCurrentClinic';
import { useAuthStore } from '../stores/authStore';

const SHIPPING_FEE = 1000; // 送料（税抜・定額）
const DELIVERY_DAYS = 7; // 発送予定日数

export default function PrintOrderFormPhase2() {
  const { clinicName, clinicId } = useCurrentClinic();
  const { user } = useAuthStore();

  const [pattern, setPattern] = useState<PrintOrderPattern>('consultation');
  const [priceTables, setPriceTables] = useState<PriceTable[]>([]);
  const [availableProductTypes, setAvailableProductTypes] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [clinicData, setClinicData] = useState<Clinic | null>(null);
  const [isAddressEditable, setIsAddressEditable] = useState(false);
  const [isPhoneEditable, setIsPhoneEditable] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PrintOrderFormData>({
    defaultValues: {
      clinic_name: clinicName || '',
      email: user?.email || '',
      pattern: 'consultation',
      items: [{ product_type: '', quantity: 100 }],
      delivery_date: '',
      design_required: false,
      notes: '',
      delivery_address: '',
      daytime_contact: '',
      terms_agreed: false,
      payment_method: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // クリニックデータ取得
  useEffect(() => {
    const fetchClinicData = async () => {
      if (clinicId) {
        try {
          const data = await clinicService.getClinic(clinicId);
          setClinicData(data);
          // 住所と電話番号を自動反映
          if (data.address) {
            setValue('delivery_address', data.address);
          }
          if (data.phone) {
            setValue('daytime_contact', data.phone);
          }
        } catch (error) {
          console.error('クリニック情報取得エラー:', error);
        }
      }
    };
    fetchClinicData();
  }, [clinicId, setValue]);

  // クリニック名とメールアドレスを自動反映
  useEffect(() => {
    if (clinicName) {
      setValue('clinic_name', clinicName);
    }
    if (user?.email) {
      setValue('email', user.email);
    }
  }, [clinicName, user, setValue]);

  // useWatchで配列の内容変更を検知
  const watchItems = useWatch({
    control,
    name: 'items',
  });

  // 価格マスタ取得
  useEffect(() => {
    const fetchPriceTables = async () => {
      try {
        const data = await printOrderService.getPriceTables();
        setPriceTables(data);

        // 重複なしの商品種類リストを作成
        const uniqueProductTypes = Array.from(
          new Set(data.map((pt) => pt.product_type))
        ).sort();
        setAvailableProductTypes(uniqueProductTypes);
      } catch (error) {
        console.error('価格マスタ取得エラー:', error);
        setSubmitError('価格マスタの取得に失敗しました。');
      }
    };

    fetchPriceTables();
  }, []);

  // 商品ごとの価格を取得
  const getItemPrice = useCallback(
    (productType: string, quantity: number): number => {
      const priceEntry = priceTables.find(
        (pt) => pt.product_type === productType && pt.quantity === quantity
      );
      return priceEntry?.price || 0;
    },
    [priceTables]
  );

  // 商品ごとの数量選択肢を取得
  const getAvailableQuantities = useCallback(
    (productType: string): number[] => {
      return priceTables
        .filter((pt) => pt.product_type === productType)
        .map((pt) => pt.quantity)
        .sort((a, b) => a - b);
    },
    [priceTables]
  );

  // 合計金額の自動計算
  useEffect(() => {
    if (pattern === 'reorder' && watchItems && Array.isArray(watchItems)) {
      let subtotal = 0;
      watchItems.forEach((item) => {
        if (item?.product_type && item?.quantity) {
          const price = getItemPrice(item.product_type, item.quantity);
          subtotal += price;
        }
      });
      const total = subtotal + SHIPPING_FEE; // 定額送料
      setTotalAmount(total);
    } else {
      setTotalAmount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern, JSON.stringify(watchItems), getItemPrice]);

  // 商品を追加
  const handleAddItem = () => {
    append({ product_type: '', quantity: 100 });
  };

  // 商品を削除
  const handleRemoveItem = (index: number) => {
    remove(index);
  };

  // フォーム送信
  const onSubmit = async (data: PrintOrderFormData) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Phase 2: 複数商品対応
      // 再注文パターンの場合、空のproduct_typeを持つアイテムを除外
      const validItems = pattern === 'reorder' && data.items
        ? data.items.filter(item => item.product_type && item.product_type.trim() !== '' && item.quantity > 0).map(item => ({
            ...item,
            specifications: item.specifications ? JSON.stringify(item.specifications) : undefined
          }))
        : undefined;

      const orderData: PrintOrderFormData = {
        clinic_name: data.clinic_name,
        email: data.email,
        pattern,
        items: validItems,
        product_type: pattern === 'consultation' ? data.product_type : undefined,
        quantity: pattern === 'consultation' ? data.quantity : undefined,
        delivery_date: data.delivery_date || undefined,
        design_required: data.design_required || false,
        notes: data.notes || undefined,
        delivery_address: data.delivery_address || undefined,
        daytime_contact: data.daytime_contact || undefined,
        terms_agreed: data.terms_agreed || false,
        payment_method: pattern === 'reorder' ? data.payment_method : undefined,
        specifications: data.specifications ? JSON.stringify(data.specifications) : undefined,
      };

      const result = await printOrderService.createPrintOrder(orderData);

      setSubmittedOrderId(result.id);
      setSuccessModalOpen(true);
      setSubmitSuccess(true);
      reset();
      setTotalAmount(0);
      // 編集状態をリセット
      setIsAddressEditable(false);
      setIsPhoneEditable(false);
    } catch (error) {
      console.error('注文送信エラー:', error);
      setSubmitError(
        error instanceof Error ? error.message : '注文の送信に失敗しました。もう一度お試しください。'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalOpen(false);
    setSubmittedOrderId(null);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          印刷物注文フォーム
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* パターン選択 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            注文パターンを選択してください
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: pattern === 'consultation' ? '3px solid' : '1px solid',
                  borderColor: pattern === 'consultation' ? 'primary.main' : 'divider',
                  bgcolor: pattern === 'consultation' ? 'rgba(255, 152, 0, 0.08)' : 'background.paper',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 3,
                    bgcolor: pattern === 'consultation' ? 'rgba(255, 152, 0, 0.08)' : 'rgba(255, 152, 0, 0.04)',
                  },
                }}
                onClick={() => {
                  setPattern('consultation');
                  setValue('pattern', 'consultation');
                  setTotalAmount(0);
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Radio
                      checked={pattern === 'consultation'}
                      value="consultation"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      相談フォーム
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    初回のご注文や内容が未確定の場合はこちら。担当者よりご連絡いたします。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: pattern === 'reorder' ? '3px solid' : '1px solid',
                  borderColor: pattern === 'reorder' ? 'primary.main' : 'divider',
                  bgcolor: pattern === 'reorder' ? 'rgba(255, 152, 0, 0.08)' : 'background.paper',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 3,
                    bgcolor: pattern === 'reorder' ? 'rgba(255, 152, 0, 0.08)' : 'rgba(255, 152, 0, 0.04)',
                  },
                }}
                onClick={() => {
                  setPattern('reorder');
                  setValue('pattern', 'reorder');
                  setTotalAmount(0);
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Radio
                      checked={pattern === 'reorder'}
                      value="reorder"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      再注文
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    内容が確定している場合はこちら。見積もりを自動計算します。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* 成功モーダル */}
        <Dialog open={successModalOpen} onClose={handleCloseSuccessModal}>
          <DialogTitle>注文を受け付けました</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              ご注文ありがとうございます。
            </Typography>
            {submittedOrderId && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                注文ID: {submittedOrderId}
              </Typography>
            )}
            <Typography variant="body2" sx={{ mt: 2 }}>
              確認メールをお送りしましたのでご確認ください。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSuccessModal} variant="contained">
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {/* エラーメッセージ */}
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
                    helperText={errors.clinic_name?.message || '自動入力されています。異なる場合は修正してください。'}
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
                    helperText={errors.email?.message || '登録されているメールアドレスが自動入力されています。変更も可能です。'}
                  />
                )}
              />
            </Grid>

            {/* Phase 2: 複数商品選択（再注文モード） */}
            {pattern === 'reorder' && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  商品選択
                </Typography>

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>商品種類</TableCell>
                      <TableCell>数量</TableCell>
                      <TableCell align="right">単価</TableCell>
                      <TableCell align="right">小計</TableCell>
                      <TableCell align="center">削除</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fields.map((field, index) => {
                      const item = watchItems?.[index];
                      const price = item?.product_type && item?.quantity
                        ? getItemPrice(item.product_type, item.quantity)
                        : 0;
                      const quantities = item?.product_type
                        ? getAvailableQuantities(item.product_type)
                        : [];

                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              name={`items.${index}.product_type`}
                              control={control}
                              rules={{ required: '商品種類は必須です' }}
                              render={({ field }) => (
                                <FormControl fullWidth size="small" error={!!errors.items?.[index]?.product_type}>
                                  <Select {...field} displayEmpty>
                                    <MenuItem value="" disabled>
                                      <em>選択してください</em>
                                    </MenuItem>
                                    {availableProductTypes.map((type) => (
                                      <MenuItem key={type} value={type}>
                                        {type}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Controller
                              name={`items.${index}.quantity`}
                              control={control}
                              rules={{ required: '数量は必須です' }}
                              render={({ field }) => (
                                <FormControl fullWidth size="small" error={!!errors.items?.[index]?.quantity} disabled={!item?.product_type}>
                                  <Select {...field} displayEmpty value={field.value || ''}>
                                    {quantities.map((qty) => (
                                      <MenuItem key={qty} value={qty}>
                                        {qty.toLocaleString()}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              )}
                            />
                          </TableCell>
                          <TableCell align="right">
                            ¥{price.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <strong>¥{price.toLocaleString()}</strong>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveItem(index)}
                              disabled={fields.length === 1}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  sx={{ mt: 2 }}
                  variant="outlined"
                >
                  商品を追加
                </Button>

                {/* 合計金額表示 */}
                {totalAmount > 0 && (() => {
                  let subtotal = 0;
                  watchItems?.forEach((item) => {
                    if (item?.product_type && item?.quantity) {
                      subtotal += getItemPrice(item.product_type, item.quantity);
                    }
                  });

                  return (
                    <Card sx={{ mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          合計金額（税抜）
                        </Typography>
                        <Typography variant="h4">
                          ¥{totalAmount.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" display="block" sx={{ mt: 2 }}>
                          内訳：商品代 ¥{subtotal.toLocaleString()} + 送料 ¥{SHIPPING_FEE.toLocaleString()}（定額）
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          ※この金額は自動計算による概算です。正式な見積もりは別途メールでお送りします。
                        </Typography>
                        <Typography variant="caption" display="block">
                          ※税込金額は見積書にてご確認ください。
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* 決済方法選択 */}
                <Grid item xs={12} sx={{ mt: 3 }}>
                  <FormControl component="fieldset" required error={!!errors.payment_method}>
                    <FormLabel component="legend">決済方法</FormLabel>
                    <Controller
                      name="payment_method"
                      control={control}
                      rules={{ required: '決済方法を選択してください' }}
                      render={({ field }) => (
                        <RadioGroup {...field}>
                          <FormControlLabel
                            value="stripe"
                            control={<Radio />}
                            label="クレジットカード決済（Stripe）"
                          />
                          <FormControlLabel
                            value="invoice"
                            control={<Radio />}
                            label="請求書払い（後日請求書を郵送）"
                          />
                        </RadioGroup>
                      )}
                    />
                    {errors.payment_method && (
                      <Typography variant="caption" color="error">
                        {errors.payment_method.message}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            )}

            {/* 相談モード: 商品種類・数量（任意） */}
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
                          {availableProductTypes.map((type) => (
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

            {/* 納品予定日 */}
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  {pattern === 'consultation' ? (
                    <>オンラインにてご注文いただいた後、内容を確認のうえ、正式なお見積りおよび制作内容について担当者よりご連絡させていただきます。</>
                  ) : (
                    <>ご注文確定後、<strong>{DELIVERY_DAYS}日後に発送予定</strong>です。お急ぎの場合は備考欄にご記入ください。</>
                  )}
                </Typography>
              </Alert>
            </Grid>

            {/* 納品先住所 */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Controller
                  name="delivery_address"
                  control={control}
                  rules={{ required: '納品先住所は必須です' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="納品先住所"
                      fullWidth
                      required
                      multiline
                      rows={2}
                      error={!!errors.delivery_address}
                      helperText={errors.delivery_address?.message || (clinicData?.address && !isAddressEditable ? 'クリニック情報から自動入力されています' : undefined)}
                      placeholder="〒000-0000 東京都..."
                      disabled={!isAddressEditable && !!clinicData?.address}
                    />
                  )}
                />
                {!isAddressEditable && clinicData?.address && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setIsAddressEditable(true)}
                    sx={{ mt: 0.5, minWidth: '80px' }}
                  >
                    編集
                  </Button>
                )}
              </Box>
            </Grid>

            {/* 日中連絡先 */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Controller
                  name="daytime_contact"
                  control={control}
                  rules={{ required: '日中連絡先は必須です' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="日中連絡先（電話番号）"
                      fullWidth
                      required
                      error={!!errors.daytime_contact}
                      helperText={errors.daytime_contact?.message || (clinicData?.phone && !isPhoneEditable ? 'クリニック情報から自動入力されています' : undefined)}
                      placeholder="03-1234-5678"
                      disabled={!isPhoneEditable && !!clinicData?.phone}
                    />
                  )}
                />
                {!isPhoneEditable && clinicData?.phone && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setIsPhoneEditable(true)}
                    sx={{ mt: 0.5, minWidth: '80px' }}
                  >
                    編集
                  </Button>
                )}
              </Box>
            </Grid>

            {/* デザイン要否 */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">デザイン修正について</FormLabel>
                <Controller
                  name="design_required"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      {...field}
                      value={field.value ? 'yes' : 'no'}
                      onChange={(e) => field.onChange(e.target.value === 'yes')}
                    >
                      <FormControlLabel
                        value="no"
                        control={<Radio />}
                        label="データ修正なしで印刷物作成を依頼する"
                      />
                      <FormControlLabel
                        value="yes"
                        control={<Radio />}
                        label="デザイン修正費を含めたお見積りを依頼する"
                      />
                    </RadioGroup>
                  )}
                />
              </FormControl>
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

          {/* 注意事項 */}
          <Paper sx={{ mt: 4, p: 3, bgcolor: '#fff3e0' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              印刷物ご注文の方はご一読ください
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
              【印刷物の色合いについて】
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              ・パソコンなどの画面上で表示されるRGBカラーと、印刷時に使用されるCMYKカラーでは色の再現方式が異なるため、画面上と実際の印刷物の色味に差異が生じる場合がございます。<br />
              ・仕上がりの色合いに関しまして、印刷毎に機械が変わるため同一データであっても毎回同じ色合いでの仕上がりは保証しかねます。<br />
              ・ゴールド、シルバー、ブロンズ等の色は出力出来かねる為、ベージュやグレーなどの【近似色対応】となります。
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              【各印刷物の修正費用に関して】
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              ・修正費用は、修正の内容、量によって異なります。ご依頼時に算出いたしますが、作成過程で増えた場合は別途料金が発生いたしますので予めご了承ください。
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              【納品に関して】
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              天候・交通事情により商品のお届けに遅れが生じる可能性がございます。お客様には大変ご迷惑をお掛けいたしますが、何卒ご理解を賜りますようお願い申し上げます。
            </Typography>

            <Controller
              name="terms_agreed"
              control={control}
              rules={{ required: '注意事項への同意が必要です' }}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      sx={{
                        '&.Mui-checked': {
                          color: '#ff6b35',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      上記の注意事項を確認しました
                    </Typography>
                  }
                />
              )}
            />
            {errors.terms_agreed && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                {errors.terms_agreed.message}
              </Typography>
            )}
          </Paper>

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
  );
}
