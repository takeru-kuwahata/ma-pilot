import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { MainLayout } from '../layouts/MainLayout';

// @MOCK_TO_API: 医院基本情報の型定義
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

// @MOCK_TO_API: 経営情報の型定義
interface ClinicBusinessInfo {
  chairs: number;
  dentists: number;
  hygienists: number;
  partTimeStaff: number;
}

// @MOCK_TO_API: スタッフの型定義
interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  registeredAt: string;
}

export const Settings = () => {
  const [tabValue, setTabValue] = useState(0);

  // @MOCK_TO_API: モックデータ
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

  const staffList: Staff[] = [
    {
      id: '1',
      name: '田中太郎',
      email: 'tanaka@sakura-dental.jp',
      role: 'owner',
      registeredAt: '2025-01-15',
    },
    {
      id: '2',
      name: '佐藤花子',
      email: 'sato@sakura-dental.jp',
      role: 'editor',
      registeredAt: '2025-02-01',
    },
    {
      id: '3',
      name: '鈴木一郎',
      email: 'suzuki@sakura-dental.jp',
      role: 'viewer',
      registeredAt: '2025-03-10',
    },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveBasicInfo = () => {
    // TODO: Phase 4でAPI呼び出し実装
    console.log('Save basic info:', basicInfo);
  };

  const handleSaveBusinessInfo = () => {
    // TODO: Phase 4でAPI呼び出し実装
    console.log('Save business info:', businessInfo);
  };

  const handleInviteStaff = () => {
    // TODO: Phase 4でスタッフ招待ダイアログ実装
    console.log('Invite staff');
  };

  const handleEditStaff = (staffId: string) => {
    // TODO: Phase 4でスタッフ編集ダイアログ実装
    console.log('Edit staff:', staffId);
  };

  const handleDeleteStaff = (staffId: string) => {
    // TODO: Phase 4でAPI呼び出し実装
    console.log('Delete staff:', staffId);
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'owner':
        return 'オーナー';
      case 'editor':
        return '編集者';
      case 'viewer':
        return '閲覧者';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return { backgroundColor: '#FFF3E0', color: '#EF6C00' };
      case 'editor':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case 'viewer':
        return { backgroundColor: '#F5F5F5', color: '#616161' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#616161' };
    }
  };

  return (
    <MainLayout>
      {/* ページヘッダー */}
      <Box sx={{ marginBottom: '24px' }}>
        <Typography
          variant="h4"
          sx={{
            fontSize: '32px',
            fontWeight: 500,
            marginBottom: '8px',
          }}
        >
          医院設定
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#616161',
            fontSize: '14px',
          }}
        >
          医院の基本情報とスタッフ権限の管理
        </Typography>
      </Box>

      {/* タブナビゲーション */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{
          marginBottom: '24px',
          borderBottom: '1px solid #e0e0e0',
          '& .MuiTab-root': {
            fontSize: '14px',
            fontWeight: 500,
            textTransform: 'none',
            minHeight: '48px',
            color: '#616161',
          },
          '& .Mui-selected': {
            color: '#FF6B35',
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#FF6B35',
          },
        }}
      >
        <Tab label="基本情報" />
        <Tab label="スタッフ管理" />
      </Tabs>

      {/* 基本情報タブ */}
      {tabValue === 0 && (
        <>
          {/* 医院基本情報 */}
          <Paper
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              marginBottom: '24px',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              医院基本情報
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '24px',
              }}
            >
              {/* 左列 */}
              <Box>
                <TextField
                  label={
                    <>
                      医院名 <span style={{ color: '#F44336' }}>*</span>
                    </>
                  }
                  fullWidth
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                  sx={{ marginBottom: '16px' }}
                />
                <TextField
                  label={
                    <>
                      郵便番号 <span style={{ color: '#F44336' }}>*</span>
                    </>
                  }
                  fullWidth
                  value={basicInfo.postalCode}
                  onChange={(e) =>
                    setBasicInfo({ ...basicInfo, postalCode: e.target.value })
                  }
                  placeholder="例: 150-0001"
                  sx={{ marginBottom: '16px' }}
                />
                <TextField
                  label={
                    <>
                      住所 <span style={{ color: '#F44336' }}>*</span>
                    </>
                  }
                  fullWidth
                  value={basicInfo.address}
                  onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
                  sx={{ marginBottom: '16px' }}
                />
                <TextField
                  label={
                    <>
                      電話番号 <span style={{ color: '#F44336' }}>*</span>
                    </>
                  }
                  fullWidth
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                  placeholder="例: 03-1234-5678"
                />
              </Box>

              {/* 右列 */}
              <Box>
                <TextField
                  label="院長名"
                  fullWidth
                  value={basicInfo.ownerName}
                  onChange={(e) =>
                    setBasicInfo({ ...basicInfo, ownerName: e.target.value })
                  }
                  sx={{ marginBottom: '16px' }}
                />
                <TextField
                  label="開業年月"
                  type="month"
                  fullWidth
                  value={basicInfo.foundedDate}
                  onChange={(e) =>
                    setBasicInfo({ ...basicInfo, foundedDate: e.target.value })
                  }
                  sx={{ marginBottom: '16px' }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="診療科目"
                  fullWidth
                  value={basicInfo.departments}
                  onChange={(e) =>
                    setBasicInfo({ ...basicInfo, departments: e.target.value })
                  }
                  placeholder="例: 一般歯科、小児歯科"
                  sx={{ marginBottom: '16px' }}
                />
                <TextField
                  label="診療時間メモ"
                  fullWidth
                  multiline
                  rows={3}
                  value={basicInfo.businessHours}
                  onChange={(e) =>
                    setBasicInfo({ ...basicInfo, businessHours: e.target.value })
                  }
                  placeholder="診療時間や休診日などを記載"
                />
              </Box>
            </Box>

            <Box sx={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
              <Button
                variant="contained"
                onClick={handleSaveBasicInfo}
                sx={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '16px',
                  backgroundColor: '#FF6B35',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#E55A2B',
                  },
                }}
              >
                <SaveIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
                保存する
              </Button>
              <Button
                variant="outlined"
                sx={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '16px',
                }}
              >
                キャンセル
              </Button>
            </Box>
          </Paper>

          {/* 経営情報 */}
          <Paper
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              経営情報（シミュレーション用）
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '24px',
              }}
            >
              <TextField
                label="診療チェア台数"
                type="number"
                fullWidth
                value={businessInfo.chairs}
                onChange={(e) =>
                  setBusinessInfo({ ...businessInfo, chairs: Number(e.target.value) })
                }
                placeholder="例: 4"
              />
              <TextField
                label="常勤歯科医師数"
                type="number"
                fullWidth
                value={businessInfo.dentists}
                onChange={(e) =>
                  setBusinessInfo({ ...businessInfo, dentists: Number(e.target.value) })
                }
                placeholder="例: 2"
              />
              <TextField
                label="常勤歯科衛生士数"
                type="number"
                fullWidth
                value={businessInfo.hygienists}
                onChange={(e) =>
                  setBusinessInfo({
                    ...businessInfo,
                    hygienists: Number(e.target.value),
                  })
                }
                placeholder="例: 3"
              />
              <TextField
                label="非常勤スタッフ数"
                type="number"
                fullWidth
                value={businessInfo.partTimeStaff}
                onChange={(e) =>
                  setBusinessInfo({
                    ...businessInfo,
                    partTimeStaff: Number(e.target.value),
                  })
                }
                placeholder="例: 2"
              />
            </Box>

            <Box sx={{ marginTop: '24px' }}>
              <Button
                variant="contained"
                onClick={handleSaveBusinessInfo}
                sx={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '16px',
                  backgroundColor: '#FF6B35',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#E55A2B',
                  },
                }}
              >
                <SaveIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
                保存する
              </Button>
            </Box>
          </Paper>
        </>
      )}

      {/* スタッフ管理タブ */}
      {tabValue === 1 && (
        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              スタッフ一覧
            </Typography>
            <Button
              variant="contained"
              onClick={handleInviteStaff}
              sx={{
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '16px',
                backgroundColor: '#FF6B35',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#E55A2B',
                },
              }}
            >
              <AddIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
              スタッフを招待
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                    名前
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                    メールアドレス
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                    権限
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                    登録日
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffList.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell sx={{ fontSize: '14px' }}>{staff.name}</TableCell>
                    <TableCell sx={{ fontSize: '14px' }}>{staff.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(staff.role)}
                        sx={{
                          ...getRoleColor(staff.role),
                          fontSize: '12px',
                          fontWeight: 600,
                          height: '24px',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '14px' }}>{staff.registeredAt}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditStaff(staff.id)}
                        disabled={staff.role === 'owner'}
                        sx={{
                          color: '#616161',
                          '&:hover': {
                            color: '#FF6B35',
                          },
                          '&.Mui-disabled': {
                            opacity: 0.3,
                          },
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteStaff(staff.id)}
                        disabled={staff.role === 'owner'}
                        sx={{
                          color: '#616161',
                          '&:hover': {
                            color: '#FF6B35',
                          },
                          '&.Mui-disabled': {
                            opacity: 0.3,
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert
            icon={<InfoIcon />}
            severity="warning"
            sx={{
              marginTop: '24px',
              backgroundColor: '#FFF3E0',
              color: '#424242',
              '& .MuiAlert-icon': {
                color: '#FF6B35',
              },
            }}
          >
            <Typography sx={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              権限について
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '24px', lineHeight: 1.6 }}>
              <li>
                <strong>オーナー:</strong> 全ての操作が可能（スタッフ管理含む）
              </li>
              <li>
                <strong>編集者:</strong> データの閲覧・編集が可能
              </li>
              <li>
                <strong>閲覧者:</strong> データの閲覧のみ可能
              </li>
            </ul>
          </Alert>
        </Paper>
      )}
    </MainLayout>
  );
};
