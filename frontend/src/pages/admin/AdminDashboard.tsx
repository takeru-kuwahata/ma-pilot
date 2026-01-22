import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ShowChart as ShowChartIcon,
  ArrowUpward as ArrowUpwardIcon,
} from '@mui/icons-material';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminService } from '../../services/api';
import type { Clinic } from '../../types';

interface SystemStats {
  totalClinics: number;
  activeClinics: number;
  monthlyActiveUsers: number;
  monthlyReports: number;
  clinicsChange: number;
  activeClinicsChange: number;
  usersChange: number;
  reportsChange: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalClinics: 0,
    activeClinics: 0,
    monthlyActiveUsers: 0,
    monthlyReports: 0,
    clinicsChange: 0,
    activeClinicsChange: 0,
    usersChange: 0,
    reportsChange: 0,
  });
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashboardData, clinicsData] = await Promise.all([
        adminService.getDashboard(),
        adminService.getClinics()
      ]);

      setStats({
        totalClinics: dashboardData.total_clinics,
        activeClinics: dashboardData.active_clinics,
        monthlyActiveUsers: dashboardData.total_users,
        monthlyReports: dashboardData.recent_data_entries,
        clinicsChange: 0,
        activeClinicsChange: 0,
        usersChange: 0,
        reportsChange: 0,
      });

      setClinics(clinicsData.slice(0, 5));
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentClinics = clinics.slice(0, 5).map(clinic => ({
    id: clinic.id,
    name: clinic.name,
    registeredAt: new Date(clinic.createdAt).toLocaleDateString('ja-JP'),
    plan: clinic.isActive ? 'アクティブ' : '非アクティブ',
    status: clinic.isActive ? ('active' as const) : ('inactive' as const)
  }));

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
          管理ダッシュボード
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#616161',
            fontSize: '14px',
          }}
        >
          システム全体の利用状況とパフォーマンス
        </Typography>
      </Box>

      {/* 統計カード */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <BusinessIcon sx={{ fontSize: 18, marginRight: 1, color: '#9e9e9e' }} />
            <Typography sx={{ fontSize: '14px', color: '#616161' }}>登録医院数</Typography>
          </Box>
          <Typography sx={{ fontSize: '32px', fontWeight: 600, color: '#424242' }}>
            {stats.totalClinics}
          </Typography>
          <Typography
            sx={{
              fontSize: '12px',
              color: '#4CAF50',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
            前月比 +{stats.clinicsChange}医院
          </Typography>
        </Paper>

        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <CheckCircleIcon sx={{ fontSize: 18, marginRight: 1, color: '#9e9e9e' }} />
            <Typography sx={{ fontSize: '14px', color: '#616161' }}>
              アクティブ医院数
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '32px', fontWeight: 600, color: '#424242' }}>
            {stats.activeClinics}
          </Typography>
          <Typography
            sx={{
              fontSize: '12px',
              color: '#4CAF50',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
            前月比 +{stats.activeClinicsChange}医院
          </Typography>
        </Paper>

        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <PeopleIcon sx={{ fontSize: 18, marginRight: 1, color: '#9e9e9e' }} />
            <Typography sx={{ fontSize: '14px', color: '#616161' }}>
              月間アクティブユーザー
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '32px', fontWeight: 600, color: '#424242' }}>
            {stats.monthlyActiveUsers}
          </Typography>
          <Typography
            sx={{
              fontSize: '12px',
              color: '#4CAF50',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
            前月比 +{stats.usersChange}人
          </Typography>
        </Paper>

        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <DescriptionIcon sx={{ fontSize: 18, marginRight: 1, color: '#9e9e9e' }} />
            <Typography sx={{ fontSize: '14px', color: '#616161' }}>
              月間レポート生成数
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '32px', fontWeight: 600, color: '#424242' }}>
            {stats.monthlyReports.toLocaleString()}
          </Typography>
          <Typography
            sx={{
              fontSize: '12px',
              color: '#4CAF50',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
            前月比 +{stats.reportsChange}件
          </Typography>
        </Paper>
      </Box>

      {/* グラフエリア */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
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
            登録医院数推移
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: '300px',
              backgroundColor: '#e0e0e0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <ShowChartIcon sx={{ fontSize: '48px', color: '#9e9e9e' }} />
            <Typography sx={{ fontSize: '16px', color: '#616161' }}>
              Rechartsでグラフ表示（Phase 4で実装）
            </Typography>
          </Box>
        </Paper>

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
            月間アクティブユーザー推移
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: '300px',
              backgroundColor: '#e0e0e0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <ShowChartIcon sx={{ fontSize: '48px', color: '#9e9e9e' }} />
            <Typography sx={{ fontSize: '16px', color: '#616161' }}>
              Rechartsでグラフ表示（Phase 4で実装）
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* 最近の登録医院 */}
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
          最近の登録医院
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                  医院名
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
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentClinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell sx={{ fontSize: '14px' }}>{clinic.name}</TableCell>
                  <TableCell sx={{ fontSize: '14px' }}>{clinic.registeredAt}</TableCell>
                  <TableCell sx={{ fontSize: '14px' }}>{clinic.plan}</TableCell>
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
                  <TableCell>
                    <IconButton
                      size="small"
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
                      sx={{
                        color: '#616161',
                        '&:hover': {
                          color: '#FF6B35',
                        },
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* システムステータス */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
        }}
      >
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
            データベース使用状況
          </Typography>
          <Box sx={{ marginBottom: '16px' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <Typography sx={{ fontSize: '14px', color: '#616161' }}>使用容量</Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                234 MB / 500 MB
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={46.8}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#4CAF50',
                },
              }}
            />
          </Box>
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <Typography sx={{ fontSize: '14px', color: '#616161' }}>
                アクティブ接続数
              </Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>12 / 100</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={12}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#2196F3',
                },
              }}
            />
          </Box>
        </Paper>

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
            API使用状況（今月）
          </Typography>
          <Box sx={{ marginBottom: '16px' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <Typography sx={{ fontSize: '14px', color: '#616161' }}>e-Stat API</Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                3,420 / 10,000
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={34.2}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#4CAF50',
                },
              }}
            />
          </Box>
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <Typography sx={{ fontSize: '14px', color: '#616161' }}>
                Google Maps API
              </Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                7,842 / 10,000
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={78.42}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#FF9800',
                },
              }}
            />
          </Box>
        </Paper>
      </Box>
    </AdminLayout>
  );
};
