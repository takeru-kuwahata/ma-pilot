import { useState } from 'react';
import { Box, Typography, Paper, Button, TextField } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { MainLayout } from '../layouts/MainLayout';

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

export const ClinicSettings = () => {
  const [basicInfo, setBasicInfo] = useState<ClinicBasicInfo>({
    name: 'さくら歯科クリニック',
    postalCode: '150-0001',
    address: '東京都渋谷区神宮前1-2-3',
    phone: '03-1234-5678',
    ownerName: '田中太郎',
    foundedDate: '2020-04',
    departments: '一般歯科、小児歯科、矯正歯科、インプラント',
    businessHours: '月〜金: 9:00-13:00, 14:30-19:00\n土: 9:00-13:00\n休診日: 日曜・祝日',
  });

  const [businessInfo, setBusinessInfo] = useState<ClinicBusinessInfo>({
    chairs: 4,
    dentists: 2,
    hygienists: 3,
    partTimeStaff: 2,
  });

  const handleSaveBasicInfo = () => {
    console.log('Save basic info:', basicInfo);
  };

  const handleSaveBusinessInfo = () => {
    console.log('Save business info:', businessInfo);
  };

  return (
    <MainLayout>
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
            onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="郵便番号"
            value={basicInfo.postalCode}
            onChange={(e) => setBasicInfo({ ...basicInfo, postalCode: e.target.value })}
            fullWidth
          />
          <TextField
            label="住所"
            value={basicInfo.address}
            onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
            fullWidth
            sx={{ gridColumn: '1 / -1' }}
          />
          <TextField
            label="電話番号"
            value={basicInfo.phone}
            onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
            fullWidth
          />
          <TextField
            label="オーナー名"
            value={basicInfo.ownerName}
            onChange={(e) => setBasicInfo({ ...basicInfo, ownerName: e.target.value })}
            fullWidth
          />
          <TextField
            label="開業年月"
            value={basicInfo.foundedDate}
            onChange={(e) => setBasicInfo({ ...basicInfo, foundedDate: e.target.value })}
            fullWidth
            placeholder="YYYY-MM"
          />
          <TextField
            label="診療科目"
            value={basicInfo.departments}
            onChange={(e) => setBasicInfo({ ...basicInfo, departments: e.target.value })}
            fullWidth
          />
          <TextField
            label="営業時間"
            value={basicInfo.businessHours}
            onChange={(e) => setBasicInfo({ ...basicInfo, businessHours: e.target.value })}
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
            sx={{ backgroundColor: '#FF6B35', color: '#ffffff', '&:hover': { backgroundColor: '#E55A2B' } }}
            startIcon={<SaveIcon />}
          >
            保存する
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
            onChange={(e) => setBusinessInfo({ ...businessInfo, chairs: parseInt(e.target.value) || 0 })}
            fullWidth
          />
          <TextField
            label="常勤歯科医師数"
            type="number"
            value={businessInfo.dentists}
            onChange={(e) => setBusinessInfo({ ...businessInfo, dentists: parseInt(e.target.value) || 0 })}
            fullWidth
          />
          <TextField
            label="常勤歯科衛生士数"
            type="number"
            value={businessInfo.hygienists}
            onChange={(e) => setBusinessInfo({ ...businessInfo, hygienists: parseInt(e.target.value) || 0 })}
            fullWidth
          />
          <TextField
            label="非常勤スタッフ数"
            type="number"
            value={businessInfo.partTimeStaff}
            onChange={(e) => setBusinessInfo({ ...businessInfo, partTimeStaff: parseInt(e.target.value) || 0 })}
            fullWidth
          />
        </Box>
        <Box sx={{ marginTop: '24px', textAlign: 'right' }}>
          <Button
            variant="contained"
            onClick={handleSaveBusinessInfo}
            sx={{ backgroundColor: '#FF6B35', color: '#ffffff', '&:hover': { backgroundColor: '#E55A2B' } }}
            startIcon={<SaveIcon />}
          >
            保存する
          </Button>
        </Box>
      </Paper>
    </MainLayout>
  );
};
