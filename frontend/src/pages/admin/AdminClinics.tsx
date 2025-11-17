import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { AdminLayout } from '../../layouts/AdminLayout';

// @MOCK_TO_API: 医院データの型定義
interface Clinic {
  id: string;
  name: string;
  address: string;
  registeredAt: string;
  plan: string;
  status: 'active' | 'trial' | 'inactive';
  owner: string;
}

export const AdminClinics = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  // @MOCK_TO_API: モックデータ
  const clinics: Clinic[] = [
    {
      id: '1',
      name: 'さくら歯科クリニック',
      address: '東京都渋谷区神宮前1-2-3',
      registeredAt: '2025-11-10',
      plan: 'スタンダード',
      status: 'active',
      owner: '田中太郎',
    },
    {
      id: '2',
      name: 'ひまわり歯科医院',
      address: '神奈川県横浜市中区本町3-4-5',
      registeredAt: '2025-11-08',
      plan: 'スタンダード',
      status: 'trial',
      owner: '佐藤花子',
    },
    {
      id: '3',
      name: '青空デンタルクリニック',
      address: '大阪府大阪市北区梅田2-1-1',
      registeredAt: '2025-11-05',
      plan: 'スタンダード',
      status: 'active',
      owner: '鈴木一郎',
    },
    {
      id: '4',
      name: 'みどり歯科',
      address: '愛知県名古屋市中村区名駅1-1-1',
      registeredAt: '2025-11-03',
      plan: 'スタンダード',
      status: 'inactive',
      owner: '高橋美咲',
    },
    {
      id: '5',
      name: 'オレンジ歯科クリニック',
      address: '福岡県福岡市博多区博多駅前2-3-4',
      registeredAt: '2025-11-01',
      plan: 'スタンダード',
      status: 'trial',
      owner: '伊藤健太',
    },
    {
      id: '6',
      name: 'スマイル歯科',
      address: '北海道札幌市中央区大通西3-6',
      registeredAt: '2025-10-28',
      plan: 'スタンダード',
      status: 'active',
      owner: '山田次郎',
    },
    {
      id: '7',
      name: 'たんぽぽ歯科医院',
      address: '宮城県仙台市青葉区中央1-2-3',
      registeredAt: '2025-10-25',
      plan: 'スタンダード',
      status: 'active',
      owner: '渡辺さくら',
    },
    {
      id: '8',
      name: 'もみじ歯科クリニック',
      address: '広島県広島市中区紙屋町2-2-2',
      registeredAt: '2025-10-22',
      plan: 'スタンダード',
      status: 'active',
      owner: '中村修',
    },
    {
      id: '9',
      name: 'すみれ歯科',
      address: '京都府京都市下京区四条通河原町',
      registeredAt: '2025-10-20',
      plan: 'スタンダード',
      status: 'trial',
      owner: '小林真理子',
    },
    {
      id: '10',
      name: 'つばき歯科医院',
      address: '静岡県静岡市葵区呉服町1-1-1',
      registeredAt: '2025-10-18',
      plan: 'スタンダード',
      status: 'active',
      owner: '加藤大輔',
    },
  ];

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleView = (clinicId: string) => {
    // TODO: Phase 4で詳細表示ダイアログ実装
    console.log('View clinic:', clinicId);
  };

  const handleEdit = (clinicId: string) => {
    // TODO: Phase 4で編集ダイアログ実装
    console.log('Edit clinic:', clinicId);
  };

  const handleToggleStatus = (clinicId: string, currentStatus: string) => {
    // TODO: Phase 4でAPI呼び出し実装
    console.log('Toggle status:', clinicId, currentStatus);
  };

  const handleAddClinic = () => {
    // TODO: Phase 4で新規登録ダイアログ実装
    console.log('Add new clinic');
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active':
        return 'アクティブ';
      case 'trial':
        return 'トライアル中';
      case 'inactive':
        return '停止中';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '#E8F5E9', color: '#2E7D32' };
      case 'trial':
        return { backgroundColor: '#FFF3E0', color: '#EF6C00' };
      case 'inactive':
        return { backgroundColor: '#FFEBEE', color: '#C62828' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#616161' };
    }
  };

  return (
    <AdminLayout>
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
          医院アカウント管理
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#616161',
            fontSize: '14px',
          }}
        >
          登録医院の閲覧・編集・ステータス管理
        </Typography>
      </Box>

      {/* アクションバー */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <TextField
            placeholder="医院名、住所、電話番号で検索"
            value={searchQuery}
            onChange={handleSearch}
            sx={{ width: '300px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9e9e9e' }} />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Button
              variant={filterStatus === 'all' ? 'contained' : 'outlined'}
              onClick={() => handleFilterChange('all')}
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                textTransform: 'none',
                ...(filterStatus === 'all'
                  ? {
                      backgroundColor: '#FF6B35',
                      color: '#ffffff',
                      '&:hover': { backgroundColor: '#E55A2B' },
                    }
                  : {
                      borderColor: '#e0e0e0',
                      color: '#616161',
                      '&:hover': { borderColor: '#FF6B35' },
                    }),
              }}
            >
              すべて
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'contained' : 'outlined'}
              onClick={() => handleFilterChange('active')}
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                textTransform: 'none',
                ...(filterStatus === 'active'
                  ? {
                      backgroundColor: '#FF6B35',
                      color: '#ffffff',
                      '&:hover': { backgroundColor: '#E55A2B' },
                    }
                  : {
                      borderColor: '#e0e0e0',
                      color: '#616161',
                      '&:hover': { borderColor: '#FF6B35' },
                    }),
              }}
            >
              アクティブ
            </Button>
            <Button
              variant={filterStatus === 'trial' ? 'contained' : 'outlined'}
              onClick={() => handleFilterChange('trial')}
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                textTransform: 'none',
                ...(filterStatus === 'trial'
                  ? {
                      backgroundColor: '#FF6B35',
                      color: '#ffffff',
                      '&:hover': { backgroundColor: '#E55A2B' },
                    }
                  : {
                      borderColor: '#e0e0e0',
                      color: '#616161',
                      '&:hover': { borderColor: '#FF6B35' },
                    }),
              }}
            >
              トライアル
            </Button>
            <Button
              variant={filterStatus === 'inactive' ? 'contained' : 'outlined'}
              onClick={() => handleFilterChange('inactive')}
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                textTransform: 'none',
                ...(filterStatus === 'inactive'
                  ? {
                      backgroundColor: '#FF6B35',
                      color: '#ffffff',
                      '&:hover': { backgroundColor: '#E55A2B' },
                    }
                  : {
                      borderColor: '#e0e0e0',
                      color: '#616161',
                      '&:hover': { borderColor: '#FF6B35' },
                    }),
              }}
            >
              停止中
            </Button>
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={handleAddClinic}
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
          新規医院を登録
        </Button>
      </Box>

      {/* 医院一覧テーブル */}
      <Paper
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                  医院名
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                  住所
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                  登録日
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                  プラン
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                  ステータス
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                  オーナー
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell sx={{ fontSize: '14px' }}>{clinic.name}</TableCell>
                  <TableCell sx={{ fontSize: '14px' }}>{clinic.address}</TableCell>
                  <TableCell sx={{ fontSize: '14px' }}>{clinic.registeredAt}</TableCell>
                  <TableCell>
                    <Chip
                      label={clinic.plan}
                      sx={{
                        backgroundColor: '#E3F2FD',
                        color: '#1976D2',
                        fontSize: '12px',
                        fontWeight: 600,
                        height: '24px',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(clinic.status)}
                      sx={{
                        ...getStatusColor(clinic.status),
                        fontSize: '12px',
                        fontWeight: 600,
                        height: '24px',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '14px' }}>{clinic.owner}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleView(clinic.id)}
                      title="詳細表示"
                      sx={{
                        color: '#616161',
                        '&:hover': {
                          color: '#FF6B35',
                        },
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(clinic.id)}
                      title="編集"
                      sx={{
                        color: '#616161',
                        '&:hover': {
                          color: '#FF6B35',
                        },
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    {clinic.status === 'inactive' ? (
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(clinic.id, clinic.status)}
                        title="再開"
                        sx={{
                          color: '#4CAF50',
                          '&:hover': {
                            color: '#2E7D32',
                          },
                        }}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(clinic.id, clinic.status)}
                        title="停止"
                        sx={{
                          color: '#616161',
                          '&:hover': {
                            color: '#FF6B35',
                          },
                        }}
                      >
                        <BlockIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ページネーション */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '24px',
          }}
        >
          <Pagination
            count={5}
            page={page}
            onChange={handlePageChange}
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: '14px',
              },
              '& .Mui-selected': {
                backgroundColor: '#FF6B35',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#E55A2B',
                },
              },
            }}
          />
        </Box>
      </Paper>
    </AdminLayout>
  );
};
