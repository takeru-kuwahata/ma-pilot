import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, Snackbar, Alert, CircularProgress } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useLayout } from '../hooks/useLayout';
import { clinicService, authService } from '../services/api';

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

export const ClinicSettings = () => {
  const { Layout } = useLayout();
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
        const user = authService.getCurrentUser();
        if (!user?.clinic_id) {
          setSnackbar({
            open: true,
            message: 'ユーザー情報が取得できませんでした',
            severity: 'error'
          });
          setLoadingData(false);
          return;
        }

        const clinic = await clinicService.getClinic(user.clinic_id);

        setBasicInfo({
          name: clinic.name || '',
          postalCode: clinic.postalCode || '',
          address: clinic.address || '',
          phone: clinic.phoneNumber || '',
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
  }, []);

  const handleSaveBasicInfo = async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      if (!user?.clinic_id) {
        setSnackbar({
          open: true,
          message: 'ユーザー情報が取得できませんでした',
          severity: 'error'
        });
        return;
      }

      await clinicService.updateClinic(user.clinic_id, {
        name: basicInfo.name,
        postalCode: basicInfo.postalCode,
        address: basicInfo.address,
        phoneNumber: basicInfo.phone,
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
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
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
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, postalCode: e.target.value }))}
            fullWidth
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
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, phone: e.target.value }))}
            fullWidth
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
    </Layout>
  );
};
