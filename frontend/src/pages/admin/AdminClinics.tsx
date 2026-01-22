import { useState, useEffect } from 'react';
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
import { adminService } from '../../services/api';
import type { Clinic } from '../../types';

export const AdminClinics = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      const data = await adminService.getClinics();
      setClinics(data);
    } catch (error) {
      console.error('Failed to load clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleView = () => {
    // TODO: Phase 4で詳細表示ダイアログ実装
  };

  const handleEdit = () => {
    // TODO: Phase 4で編集ダイアログ実装
  };

  const handleToggleStatus = async (clinicId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await adminService.deactivateClinic(clinicId);
      } else {
        await adminService.activateClinic(clinicId);
      }
      await loadClinics();
    } catch (error) {
      console.error('Failed to toggle clinic status:', error);
    }
  };

  const handleAddClinic = () => {
    // TODO: Phase 4で新規登録ダイアログ実装
  };

  const getStatusLabel = (isActive: boolean): string => {
    return isActive ? 'アクティブ' : '停止中';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? { backgroundColor: '#E8F5E9', color: '#2E7D32' }
      : { backgroundColor: '#FFEBEE', color: '#C62828' };
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
                  <TableCell sx={{ fontSize: '14px' }}>{new Date(clinic.createdAt).toLocaleDateString('ja-JP')}</TableCell>
                  <TableCell>
                    <Chip
                      label="無料プラン"
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
                      label={getStatusLabel(clinic.isActive)}
                      sx={{
                        ...getStatusColor(clinic.isActive),
                        fontSize: '12px',
                        fontWeight: 600,
                        height: '24px',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '14px' }}>{clinic.ownerId}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleView()}
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
                      onClick={() => handleEdit()}
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
                    {!clinic.isActive ? (
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(clinic.id, clinic.isActive)}
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
                        onClick={() => handleToggleStatus(clinic.id, clinic.isActive)}
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
