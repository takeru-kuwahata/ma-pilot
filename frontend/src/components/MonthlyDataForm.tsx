import { useState, useEffect } from 'react';
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

export const MonthlyDataForm = ({ onSubmit, onCancel, initialData }: MonthlyDataFormProps) => {
  const [formData, setFormData] = useState<MonthlyDataFormData>(
    initialData || {
      yearMonth: '',
      totalRevenue: 0,
      insuranceRevenue: 0,
      selfPayRevenue: 0,
      retailRevenue: 0,
      variableCost: 0,
      fixedCost: 0,
      newPatients: 0,
      returningPatients: 0,
      totalPatients: 0,
    }
  );

  // 表示用の文字列状態（フォーカス時：カンマなし、非フォーカス時：カンマあり）
  const [displayValues, setDisplayValues] = useState({
    insuranceRevenue: '',
    selfPayRevenue: '',
    retailRevenue: '',
    variableCost: '',
    fixedCost: '',
    newPatients: '',
    returningPatients: '',
  });

  // 自動計算: 総売上
  useEffect(() => {
    const total = formData.insuranceRevenue + formData.selfPayRevenue + formData.retailRevenue;
    setFormData((prev) => ({ ...prev, totalRevenue: total }));
  }, [formData.insuranceRevenue, formData.selfPayRevenue, formData.retailRevenue]);

  // 自動計算: 総患者数
  useEffect(() => {
    const total = formData.newPatients + formData.returningPatients;
    setFormData((prev) => ({ ...prev, totalPatients: total }));
  }, [formData.newPatients, formData.returningPatients]);

  const handleYearMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, yearMonth: e.target.value });
  };

  const handleNumberChange = (field: keyof typeof displayValues) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setDisplayValues({ ...displayValues, [field]: value });
    const numValue = parseNumber(value);
    setFormData({ ...formData, [field]: numValue });
  };

  const handleFocus = (field: keyof typeof displayValues) => () => {
    // フォーカス時：カンマを除去した数値を表示
    const currentValue = formData[field];
    setDisplayValues({
      ...displayValues,
      [field]: currentValue > 0 ? currentValue.toString() : ''
    });
  };

  const handleBlur = (field: keyof typeof displayValues) => () => {
    // ブラー時：カンマ区切りでフォーマット
    const currentValue = formData[field];
    setDisplayValues({
      ...displayValues,
      [field]: currentValue > 0 ? formatNumber(currentValue) : ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

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
              value={formData.yearMonth}
              onChange={handleYearMonthChange}
              InputLabelProps={{ shrink: true }}
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
              required
              label="保険診療収入"
              type="text"
              value={displayValues.insuranceRevenue}
              onChange={handleNumberChange('insuranceRevenue')}
              onFocus={handleFocus('insuranceRevenue')}
              onBlur={handleBlur('insuranceRevenue')}
              helperText="数字を入力（カンマ可）"
              InputProps={{
                endAdornment: <InputAdornment position="end">円</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              required
              label="自由診療収入"
              type="text"
              value={displayValues.selfPayRevenue}
              onChange={handleNumberChange('selfPayRevenue')}
              onFocus={handleFocus('selfPayRevenue')}
              onBlur={handleBlur('selfPayRevenue')}
              helperText="数字を入力（カンマ可）"
              InputProps={{
                endAdornment: <InputAdornment position="end">円</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              required
              label="物販（その他）"
              type="text"
              value={displayValues.retailRevenue}
              onChange={handleNumberChange('retailRevenue')}
              onFocus={handleFocus('retailRevenue')}
              onBlur={handleBlur('retailRevenue')}
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
              value={formatNumber(formData.totalRevenue)}
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
              required
              label="変動費"
              type="text"
              value={displayValues.variableCost}
              onChange={handleNumberChange('variableCost')}
              onFocus={handleFocus('variableCost')}
              onBlur={handleBlur('variableCost')}
              helperText="材料費、技工料など（カンマ可）"
              InputProps={{
                endAdornment: <InputAdornment position="end">円</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="固定費"
              type="text"
              value={displayValues.fixedCost}
              onChange={handleNumberChange('fixedCost')}
              onFocus={handleFocus('fixedCost')}
              onBlur={handleBlur('fixedCost')}
              helperText="人件費、家賃、光熱費など（カンマ可）"
              InputProps={{
                endAdornment: <InputAdornment position="end">円</InputAdornment>,
              }}
            />
          </Grid>

          {/* 患者数関連 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              患者数関連（2項目入力 + 1自動計算）
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="新患数"
              type="text"
              value={displayValues.newPatients}
              onChange={handleNumberChange('newPatients')}
              onFocus={handleFocus('newPatients')}
              onBlur={handleBlur('newPatients')}
              helperText="数字を入力（カンマ可）"
              InputProps={{
                endAdornment: <InputAdornment position="end">人</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="再診患者数"
              type="text"
              value={displayValues.returningPatients}
              onChange={handleNumberChange('returningPatients')}
              onFocus={handleFocus('returningPatients')}
              onBlur={handleBlur('returningPatients')}
              helperText="数字を入力（カンマ可）"
              InputProps={{
                endAdornment: <InputAdornment position="end">人</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="総患者数"
              type="text"
              value={formatNumber(formData.totalPatients)}
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
};
