import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Button, TextField, Snackbar, Alert, CircularProgress } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { clinicService } from '../services/api';

interface ClinicBasicInfo {
  name: string;
  postalCode: string;
  address: string;
  phone: string;
  ownerName: string;
  foundedDate: string;
  departments: string;
  businessHours: string;
}

interface ClinicBusinessInfo {
  chairs: number;
  dentists: number;
  hygienists: number;
  partTimeStaff: number;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

const formatPostalCode = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
};

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.startsWith('0') && (digits[1] === '3' || digits[1] === '6' || digits[1] === '4' || digits[1] === '5')) {
    if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length <= 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

export const ClinicSettings = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [basicInfo, setBasicInfo] = useState<ClinicBasicInfo>({
    name: '',
    postalCode: '',
    address: '',
    phone: '',
    ownerName: '',
    foundedDate: '',
    departments: '',
    businessHours: '',
  });

  const [businessInfo, setBusinessInfo] = useState<ClinicBusinessInfo>({
    chairs: 0,
    dentists: 0,
    hygienists: 0,
    partTimeStaff: 0,
  });

  useEffect(() => {
    const loadClinicData = async () => {
      try {
        if (!clinicId) {
          setSnackbar({
            open: true,
            message: '医院情報が取得できませんでした',
            severity: 'error'
          });
          setLoadingData(false);
          return;
        }

        const clinic = await clinicService.getClinic(clinicId);

        setBasicInfo({
          name: clinic.name || '',
          postalCode: clinic.postal_code || '',
          address: clinic.address || '',
          phone: clinic.phone_number || '',
          ownerName: '',
          foundedDate: '',
          departments: '',
          businessHours: '',
        });

        setBusinessInfo({
          chairs: 0,
          dentists: 0,
          hygienists: 0,
          partTimeStaff: 0,
        });

        setLoadingData(false);
      } catch (error) {
        console.error('Failed to load clinic data:', error);
        setSnackbar({
          open: true,
          message: 'データの読み込みに失敗しました',
          severity: 'error'
        });
        setLoadingData(false);
      }
    };

    loadClinicData();
  }, [clinicId]);

  const handleSaveBasicInfo = async () => {
    try {
      setLoading(true);
      if (!clinicId) {
        setSnackbar({
          open: true,
          message: '医院情報が取得できませんでした',
          severity: 'error'
        });
        return;
      }

      await clinicService.updateClinic(clinicId, {
        name: basicInfo.name,
        postal_code: basicInfo.postalCode,
        address: basicInfo.address,
        phone_number: basicInfo.phone,
      });

      setSnackbar({
        open: true,
        message: '基本情報を保存しました',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save basic info:', error);
      setSnackbar({
        open: true,
        message: '保存に失敗しました。もう一度お試しください。',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusinessInfo = async () => {
    try {
      setLoading(true);
      setSnackbar({
        open: true,
        message: '経営情報の保存機能は開発中です',
        severity: 'error'
      });
    } catch (error) {
      console.error('Failed to save business info:', error);
      setSnackbar({
        open: true,
        message: '保存に失敗しました。もう一度お試しください。',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ marginBottom: '24px' }}>
        <Typography variant="h4" sx={{ fontSize: '32px', fontWeight: 500, marginBottom: '8px' }}>
          医院設定
        </Typography>
        <Typography variant="body2" sx={{ color: '#616161', fontSize: '14px' }}>
          医院の基本情報と経営情報の管理
        </Typography>
      </Box>

      <Paper sx={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', marginBottom: '24px' }}>
        <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
          基本情報
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <TextField
            label="医院名"
            value={basicInfo.name}
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="郵便番号"
            value={basicInfo.postalCode}
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, postalCode: formatPostalCode(e.target.value) }))}
            fullWidth
            inputProps={{ maxLength: 8 }}
          />
          <TextField
            label="住所"
            value={basicInfo.address}
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, address: e.target.value }))}
            fullWidth
            sx={{ gridColumn: '1 / -1' }}
          />
          <TextField
            label="電話番号"
            value={basicInfo.phone}
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
            fullWidth
            inputProps={{ maxLength: 13 }}
          />
          <TextField
            label="オーナー名"
            value={basicInfo.ownerName}
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, ownerName: e.target.value }))}
            fullWidth
          />
          <TextField
            label="開業年月"
            value={basicInfo.foundedDate}
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, foundedDate: e.target.value }))}
            fullWidth
            placeholder="YYYY-MM"
          />
          <TextField
            label="診療科目"
            value={basicInfo.departments}
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, departments: e.target.value }))}
            fullWidth
          />
          <TextField
            label="営業時間"
            value={basicInfo.businessHours}
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, businessHours: e.target.value }))}
            fullWidth
            multiline
            rows={3}
            sx={{ gridColumn: '1 / -1' }}
          />
        </Box>
        <Box sx={{ marginTop: '24px', textAlign: 'right' }}>
          <Button
            variant="contained"
            onClick={handleSaveBasicInfo}
            disabled={loading}
            sx={{ backgroundColor: '#FF6B35', color: '#ffffff', '&:hover': { backgroundColor: '#E55A2B' } }}
            startIcon={loading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : <SaveIcon />}
          >
            {loading ? '保存中...' : '保存する'}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
        <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
          経営情報
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <TextField
            label="ユニット数"
            type="number"
            value={businessInfo.chairs}
            onChange={(e) => setBusinessInfo((prev) => ({ ...prev, chairs: parseInt(e.target.value) || 0 }))}
            fullWidth
          />
          <TextField
            label="常勤歯科医師数"
            type="number"
            value={businessInfo.dentists}
            onChange={(e) => setBusinessInfo((prev) => ({ ...prev, dentists: parseInt(e.target.value) || 0 }))}
            fullWidth
          />
          <TextField
            label="常勤歯科衛生士数"
            type="number"
            value={businessInfo.hygienists}
            onChange={(e) => setBusinessInfo((prev) => ({ ...prev, hygienists: parseInt(e.target.value) || 0 }))}
            fullWidth
          />
          <TextField
            label="非常勤スタッフ数"
            type="number"
            value={businessInfo.partTimeStaff}
            onChange={(e) => setBusinessInfo((prev) => ({ ...prev, partTimeStaff: parseInt(e.target.value) || 0 }))}
            fullWidth
          />
        </Box>
        <Box sx={{ marginTop: '24px', textAlign: 'right' }}>
          <Button
            variant="contained"
            onClick={handleSaveBusinessInfo}
            disabled={loading}
            sx={{ backgroundColor: '#FF6B35', color: '#ffffff', '&:hover': { backgroundColor: '#E55A2B' } }}
            startIcon={loading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : <SaveIcon />}
          >
            {loading ? '保存中...' : '保存する'}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};
