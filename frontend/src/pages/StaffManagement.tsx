import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { MainLayout } from '../layouts/MainLayout';
import { staffService, authService } from '../services/api';
import type { User, UserRole } from '../types';

export const StaffManagement = () => {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStaffList();
  }, []);

  const loadStaffList = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = authService.getCurrentUser();
      if (!user?.clinicId) {
        setError('クリニック情報が見つかりません');
        setLoading(false);
        return;
      }
      const staff = await staffService.getStaff(user.clinicId);
      setStaffList(staff);
    } catch (err) {
      console.error('Failed to load staff:', err);
      setError('スタッフ一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteStaff = () => {
    // TODO: 招待ダイアログ実装
    alert('招待機能は現在開発中です');
  };

  const handleEditStaff = async (userId: string) => {
    // TODO: 編集ダイアログ実装
    alert(`スタッフ編集機能は現在開発中です（ユーザーID: ${userId}）`);
  };

  const handleDeleteStaff = async (userId: string) => {
    if (!window.confirm('このスタッフを削除してもよろしいですか?')) {
      return;
    }
    try {
      await staffService.deleteStaff(userId);
      await loadStaffList();
    } catch (err) {
      console.error('Failed to delete staff:', err);
      alert('スタッフの削除に失敗しました');
    }
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'system_admin':
        return 'システム管理者';
      case 'clinic_owner':
        return 'オーナー';
      case 'clinic_editor':
        return '編集者';
      case 'clinic_viewer':
        return '閲覧者';
      default:
        return role;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'system_admin':
        return { backgroundColor: '#FFEBEE', color: '#C62828' };
      case 'clinic_owner':
        return { backgroundColor: '#FFF3E0', color: '#EF6C00' };
      case 'clinic_editor':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case 'clinic_viewer':
        return { backgroundColor: '#F5F5F5', color: '#616161' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#616161' };
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert severity="error">{error}</Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ marginBottom: '24px' }}>
        <Typography
          variant="h4"
          sx={{
            fontSize: '32px',
            fontWeight: 500,
            marginBottom: '8px',
          }}
        >
          スタッフ管理
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#616161',
            fontSize: '14px',
          }}
        >
          スタッフアカウントの招待・権限管理
        </Typography>
      </Box>

      <Alert
        icon={<InfoIcon />}
        severity="info"
        sx={{
          marginBottom: '24px',
          backgroundColor: '#E3F2FD',
          color: '#1976D2',
        }}
      >
        <Typography sx={{ fontSize: '14px' }}>
          スタッフを招待すると、登録したメールアドレスに招待リンクが送信されます。
          権限は、オーナー（全権限）、編集者（閲覧・編集）、閲覧者（閲覧のみ）の3種類です。
        </Typography>
      </Alert>

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
            登録スタッフ一覧
          </Typography>
          <Button
            variant="contained"
            onClick={handleInviteStaff}
            sx={{
              backgroundColor: '#FF6B35',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#E55A2B',
              },
            }}
            startIcon={<AddIcon />}
          >
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
                  <TableCell sx={{ fontSize: '14px' }}>
                    {staff.email.split('@')[0]}
                  </TableCell>
                  <TableCell sx={{ fontSize: '14px' }}>
                    {staff.email}
                  </TableCell>
                  <TableCell sx={{ fontSize: '14px' }}>
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
                  <TableCell sx={{ fontSize: '14px' }}>
                    {new Date(staff.createdAt).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell sx={{ fontSize: '14px' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditStaff(staff.id)}
                      sx={{
                        color: '#616161',
                        '&:hover': {
                          color: '#FF6B35',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {staff.role !== 'clinic_owner' && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteStaff(staff.id)}
                        sx={{
                          color: '#616161',
                          '&:hover': {
                            color: '#FF6B35',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </MainLayout>
  );
};
