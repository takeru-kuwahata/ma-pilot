import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, TextField, Snackbar, Alert, CircularProgress } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { clinicService } from '../services/api';

interface ClinicBasicInfo {
  name: string;
  slug: string;
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [basicInfo, setBasicInfo] = useState<ClinicBasicInfo>({
    name: '',
    slug: '',
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
          slug: clinic.slug || '',
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

  const geocodeAddress = async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
      console.log('[geocode] apiKey:', apiKey ? 'SET' : 'NOT SET', 'address:', address);
      const encoded = encodeURIComponent(address);
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`);
      const data = await res.json();
      console.log('[geocode] status:', data.status, 'results:', data.results?.length);
      if (data.status === 'OK' && data.results?.length > 0) {
        const loc = data.results[0].geometry.location;
        return { latitude: loc.lat, longitude: loc.lng };
      }
    } catch (e) {
      console.error('[geocode] error:', e);
    }
    return null;
  };

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

      const coords = basicInfo.address ? await geocodeAddress(basicInfo.address) : null;

      await clinicService.updateClinic(clinicId, {
        name: basicInfo.name,
        slug: basicInfo.slug || undefined,
        postal_code: basicInfo.postalCode,
        address: basicInfo.address,
        phone_number: basicInfo.phone,
        ...(coords && { latitude: coords.latitude, longitude: coords.longitude }),
      });

      setSnackbar({
        open: true,
        message: '基本情報を保存しました',
        severity: 'success'
      });

      // slug変更時はURLを新しいslugに更新
      if (basicInfo.slug && basicInfo.slug !== clinicId) {
        setTimeout(() => {
          navigate(`/clinic/${basicInfo.slug}/settings`, { replace: true });
        }, 1000);
      }
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

  // 郵便番号から住所を自動取得
  const handlePostalCodeChange = async (value: string) => {
    const formatted = formatPostalCode(value);
    setBasicInfo((prev) => ({ ...prev, postalCode: formatted }));

    // ハイフンを除去して7桁になったら住所検索
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 7) {
      setLoadingAddress(true);
      try {
        const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`);
        const data = await response.json();

        if (data.status === 200 && data.results && data.results.length > 0) {
          const result = data.results[0];
          const autoAddress = `${result.address1}${result.address2}${result.address3}`;
          setBasicInfo((prev) => ({ ...prev, address: autoAddress }));
        } else {
          setSnackbar({
            open: true,
            message: '郵便番号に該当する住所が見つかりませんでした',
            severity: 'error'
          });
        }
      } catch (error) {
        console.error('Failed to fetch address:', error);
        setSnackbar({
          open: true,
          message: '住所の取得に失敗しました',
          severity: 'error'
        });
      } finally {
        setLoadingAddress(false);
      }
    }
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: '16px' }}>
          <TextField
            label="医院名"
            value={basicInfo.name}
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="スラッグ（URL識別子）"
            value={basicInfo.slug}
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
            fullWidth
            placeholder="例: yamada-dental"
            helperText="半角英小文字・数字・ハイフンのみ。URLのパスとして使用されます。"
          />
          <TextField
            label="郵便番号"
            value={basicInfo.postalCode}
            onChange={(e) => handlePostalCodeChange(e.target.value)}
            fullWidth
            inputProps={{ maxLength: 8 }}
            placeholder="000-0000"
            helperText="7桁入力すると自動で住所を取得します"
          />
          <TextField
            label="住所"
            value={basicInfo.address}
            onChange={(e) => setBasicInfo((prev) => ({ ...prev, address: e.target.value }))}
            fullWidth
            sx={{ gridColumn: '1 / -1' }}
            placeholder="郵便番号から自動入力後、番地以降を追記してください"
            disabled={loadingAddress}
            helperText={loadingAddress ? '住所を取得中...' : ''}
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: '16px' }}>
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
