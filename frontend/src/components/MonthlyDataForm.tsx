import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { MonthlyDataFormData } from '../types';

interface MonthlyDataFormProps {
  onSubmit: (data: MonthlyDataFormData) => void;
  onCancel: () => void;
  initialData?: MonthlyDataFormData;
}

// 全角数字を半角に変換
const convertToHalfWidth = (str: string): string => {
  return str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
};

// 文字列を数値に変換（カンマ区切り対応）
const parseNumber = (value: string): number => {
  const halfWidth = convertToHalfWidth(value);
  const cleaned = halfWidth.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// 数値を3桁カンマ区切り文字列に変換
const formatNumber = (num: number): string => {
  return num.toLocaleString('ja-JP');
};

type NumberField = 'insurance_revenue' | 'self_pay_revenue' | 'retail_revenue' | 'variable_cost' | 'fixed_cost' | 'first_visit_patients' | 're_first_visit_patients' | 'returning_patients' | 'other_patients';

export const MonthlyDataForm = memo(({ onSubmit, onCancel, initialData }: MonthlyDataFormProps) => {
  const defaultValues: MonthlyDataFormData = {
    year_month: '',
    total_revenue: 0,
    insurance_revenue: 0,
    self_pay_revenue: 0,
    retail_revenue: 0,
    variable_cost: 0,
    fixed_cost: 0,
    first_visit_patients: 0,
    re_first_visit_patients: 0,
    returning_patients: 0,
    other_patients: 0,
    total_patients: 0,
  };

  const [formData, setFormData] = useState<MonthlyDataFormData>(initialData || defaultValues);

  // 表示用の文字列状態（initialDataがある場合はその値でフォーマットして初期化）
  const initDisplay = useCallback((data?: MonthlyDataFormData) => ({
    insurance_revenue: data?.insurance_revenue ? formatNumber(data.insurance_revenue) : '',
    self_pay_revenue: data?.self_pay_revenue ? formatNumber(data.self_pay_revenue) : '',
    retail_revenue: data?.retail_revenue ? formatNumber(data.retail_revenue) : '',
    variable_cost: data?.variable_cost ? formatNumber(data.variable_cost) : '',
    fixed_cost: data?.fixed_cost ? formatNumber(data.fixed_cost) : '',
    first_visit_patients: data?.first_visit_patients ? formatNumber(data.first_visit_patients) : '',
    re_first_visit_patients: data?.re_first_visit_patients ? formatNumber(data.re_first_visit_patients) : '',
    returning_patients: data?.returning_patients ? formatNumber(data.returning_patients) : '',
    other_patients: data?.other_patients ? formatNumber(data.other_patients) : '',
  }), []);

  const [displayValues, setDisplayValues] = useState<Record<NumberField, string>>(() => initDisplay(initialData));

  // initialDataが変わったとき（編集ダイアログを開き直した場合）に同期
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setDisplayValues(initDisplay(initialData));
    }
  }, [initialData, initDisplay]);

  // メモ化: 総売上と総患者数を計算（派生値として扱う）
  const totalRevenue = useMemo(
    () => (Number(formData.insurance_revenue) || 0) + (Number(formData.self_pay_revenue) || 0) + (Number(formData.retail_revenue) || 0),
    [formData.insurance_revenue, formData.self_pay_revenue, formData.retail_revenue]
  );

  const totalPatients = useMemo(
    () => (Number(formData.first_visit_patients) || 0) + (Number(formData.re_first_visit_patients) || 0) + (Number(formData.returning_patients) || 0) + (Number(formData.other_patients) || 0),
    [formData.first_visit_patients, formData.re_first_visit_patients, formData.returning_patients, formData.other_patients]
  );

  const handleYearMonthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, year_month: e.target.value }));
  }, []);

  const handleNumberChange = useCallback((field: NumberField) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setDisplayValues((prev) => ({ ...prev, [field]: value }));
    const numValue = parseNumber(value);
    setFormData((prev) => ({ ...prev, [field]: numValue }));
  }, []);

  const handleFocus = useCallback((field: NumberField) => () => {
    setDisplayValues((prev) => ({
      ...prev,
      [field]: formData[field] > 0 ? formData[field].toString() : ''
    }));
  }, [formData]);

  const handleBlur = useCallback((field: NumberField) => () => {
    setDisplayValues((prev) => ({
      ...prev,
      [field]: formData[field] > 0 ? formatNumber(formData[field]) : ''
    }));
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, total_revenue: totalRevenue, total_patients: totalPatients });
  }, [formData, totalRevenue, totalPatients, onSubmit]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        月次データ入力フォーム
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* 対象年月 */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="対象年月"
              type="month"
              value={formData.year_month}
              onChange={handleYearMonthChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: '2020-01', max: '2099-12' }}
            />
          </Grid>

          {/* 収益関連 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              収益関連（3項目入力 + 1自動計算）
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="保険診療収入"
              type="text"
              value={displayValues.insurance_revenue}
              onChange={handleNumberChange('insurance_revenue')}
              onFocus={handleFocus('insurance_revenue')}
              onBlur={handleBlur('insurance_revenue')}
              helperText="数字を入力（カンマ可）"
              InputProps={{
                endAdornment: <InputAdornment position="end">円</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="自由診療収入"
              type="text"
              value={displayValues.self_pay_revenue}
              onChange={handleNumberChange('self_pay_revenue')}
              onFocus={handleFocus('self_pay_revenue')}
              onBlur={handleBlur('self_pay_revenue')}
              helperText="数字を入力（カンマ可）"
              InputProps={{
                endAdornment: <InputAdornment position="end">円</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="物販（その他）"
              type="text"
              value={displayValues.retail_revenue}
              onChange={handleNumberChange('retail_revenue')}
              onFocus={handleFocus('retail_revenue')}
              onBlur={handleBlur('retail_revenue')}
              helperText="数字を入力（カンマ可）"
              InputProps={{
                endAdornment: <InputAdornment position="end">円</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="総売上"
              type="text"
              value={formatNumber(totalRevenue)}
              disabled
              helperText="自動計算"
              InputProps={{
                endAdornment: <InputAdornment position="end">円</InputAdornment>,
              }}
            />
          </Grid>

          {/* コスト関連 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              コスト関連（2項目）
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="変動費"
              type="text"
              value={displayValues.variable_cost}
              onChange={handleNumberChange('variable_cost')}
              onFocus={handleFocus('variable_cost')}
              onBlur={handleBlur('variable_cost')}
              helperText="材料費、技工料など（カンマ可）"
              InputProps={{
                endAdornment: <InputAdornment position="end">円</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="固定費"
              type="text"
              value={displayValues.fixed_cost}
              onChange={handleNumberChange('fixed_cost')}
              onFocus={handleFocus('fixed_cost')}
              onBlur={handleBlur('fixed_cost')}
              helperText="人件費、家賃、光熱費など（カンマ可）"
              InputProps={{
                endAdornment: <InputAdornment position="end">円</InputAdornment>,
              }}
            />
          </Grid>

          {/* 患者数関連 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              患者数関連（4項目入力 + 1自動計算）
            </Typography>
          </Grid>

          <Grid item xs={12} md={2.4}>
            <TextField
              fullWidth
              label="初診"
              type="text"
              value={displayValues.first_visit_patients}
              onChange={handleNumberChange('first_visit_patients')}
              onFocus={handleFocus('first_visit_patients')}
              onBlur={handleBlur('first_visit_patients')}
              helperText="初めての来院"
              InputProps={{
                endAdornment: <InputAdornment position="end">人</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={2.4}>
            <TextField
              fullWidth
              label="再初診"
              type="text"
              value={displayValues.re_first_visit_patients}
              onChange={handleNumberChange('re_first_visit_patients')}
              onFocus={handleFocus('re_first_visit_patients')}
              onBlur={handleBlur('re_first_visit_patients')}
              helperText="再度初診扱い"
              InputProps={{
                endAdornment: <InputAdornment position="end">人</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={2.4}>
            <TextField
              fullWidth
              label="再診"
              type="text"
              value={displayValues.returning_patients}
              onChange={handleNumberChange('returning_patients')}
              onFocus={handleFocus('returning_patients')}
              onBlur={handleBlur('returning_patients')}
              helperText="継続来院"
              InputProps={{
                endAdornment: <InputAdornment position="end">人</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={2.4}>
            <TextField
              fullWidth
              label="他"
              type="text"
              value={displayValues.other_patients}
              onChange={handleNumberChange('other_patients')}
              onFocus={handleFocus('other_patients')}
              onBlur={handleBlur('other_patients')}
              helperText="その他"
              InputProps={{
                endAdornment: <InputAdornment position="end">人</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={2.4}>
            <TextField
              fullWidth
              label="総患者数"
              type="text"
              value={formatNumber(totalPatients)}
              disabled
              helperText="自動計算"
              InputProps={{
                endAdornment: <InputAdornment position="end">人</InputAdornment>,
              }}
            />
          </Grid>

          {/* アクションボタン */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
              >
                保存
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
});

MonthlyDataForm.displayName = 'MonthlyDataForm';
