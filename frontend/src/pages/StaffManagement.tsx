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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { staffService, authService } from '../services/api';
import type { User, UserRole } from '../types';

export const StaffManagement = () => {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'clinic_viewer' as 'clinic_owner' | 'clinic_editor' | 'clinic_viewer'
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<{
    userId: string;
    email: string;
    role: 'clinic_owner' | 'clinic_editor' | 'clinic_viewer';
  } | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadStaffList();
  }, []);

  const loadStaffList = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = authService.getCurrentUser();
      if (!user?.clinic_id) {
        setError('クリニック情報が見つかりません');
        setLoading(false);
        return;
      }
      const staff = await staffService.getStaff(user.clinic_id);
      setStaffList(staff);
    } catch (err) {
      console.error('Failed to load staff:', err);
      setError('スタッフ一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteStaff = async () => {
    // メールアドレスのバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!inviteForm.email || !emailRegex.test(inviteForm.email)) {
      setSnackbarMessage('有効なメールアドレスを入力してください');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setInviteLoading(true);
      const user = authService.getCurrentUser();
      if (!user?.clinic_id) {
        setSnackbarMessage('クリニック情報が見つかりません');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      await staffService.inviteStaff({
        email: inviteForm.email,
        role: inviteForm.role,
        clinic_id: user.clinic_id
      });

      setSnackbarMessage('招待メールを送信しました');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setInviteDialogOpen(false);
      setInviteForm({ email: '', role: 'clinic_viewer' });

      // スタッフ一覧を再取得
      await loadStaffList();
    } catch (error) {
      console.error('Failed to invite staff:', error);
      setSnackbarMessage('招待に失敗しました');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEditStaff = (staff: User) => {
    setEditingStaff({
      userId: staff.id,
      email: staff.email,
      role: staff.role as 'clinic_owner' | 'clinic_editor' | 'clinic_viewer'
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setEditLoading(true);
      if (!editingStaff) return;

      await staffService.updateStaffRole(editingStaff.userId, editingStaff.role);

      setSnackbarMessage('権限を更新しました');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setEditDialogOpen(false);
      setEditingStaff(null);

      // スタッフ一覧を再取得
      await loadStaffList();
    } catch (error) {
      console.error('Failed to update staff role:', error);
      setSnackbarMessage('更新に失敗しました');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteStaff = async (userId: string) => {
    if (!window.confirm('このスタッフを削除してもよろしいですか?')) {
      return;
    }
    try {
      await staffService.deleteStaff(userId);
      setSnackbarMessage('スタッフを削除しました');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await loadStaffList();
    } catch (err) {
      console.error('Failed to delete staff:', err);
      setSnackbarMessage('スタッフの削除に失敗しました');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  return (
    <>
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
            onClick={() => setInviteDialogOpen(true)}
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
                    {new Date(staff.created_at).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell sx={{ fontSize: '14px' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditStaff(staff)}
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

      {/* スタッフ招待ダイアログ */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => !inviteLoading && setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography sx={{ fontSize: '20px', fontWeight: 600 }}>
            スタッフを招待
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2 }}>
            <TextField
              label="メールアドレス"
              type="email"
              required
              fullWidth
              value={inviteForm.email}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
              disabled={inviteLoading}
              placeholder="example@clinic.jp"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#FF6B35',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF6B35',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#FF6B35',
                },
              }}
            />
            <FormControl
              fullWidth
              required
              disabled={inviteLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#FF6B35',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF6B35',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#FF6B35',
                },
              }}
            >
              <InputLabel>権限</InputLabel>
              <Select
                value={inviteForm.role}
                label="権限"
                onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value as 'clinic_owner' | 'clinic_editor' | 'clinic_viewer' }))}
              >
                <MenuItem value="clinic_owner">医院オーナー</MenuItem>
                <MenuItem value="clinic_editor">医院編集者</MenuItem>
                <MenuItem value="clinic_viewer">医院閲覧者</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography sx={{ fontSize: '13px' }}>
                招待メールが送信されます。受信者はメール内のリンクからアカウントを作成できます。
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button
            onClick={() => setInviteDialogOpen(false)}
            disabled={inviteLoading}
            sx={{
              color: '#616161',
              '&:hover': {
                backgroundColor: '#F5F5F5',
              },
            }}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleInviteStaff}
            disabled={inviteLoading || !inviteForm.email}
            sx={{
              backgroundColor: '#FF6B35',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#E55A2B',
              },
              '&:disabled': {
                backgroundColor: '#E0E0E0',
                color: '#9E9E9E',
              },
            }}
          >
            {inviteLoading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : '招待する'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !editLoading && setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography sx={{ fontSize: '20px', fontWeight: 600 }}>
            スタッフ権限の編集
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2 }}>
            <TextField
              label="メールアドレス"
              type="email"
              fullWidth
              value={editingStaff?.email || ''}
              disabled
              InputProps={{
                readOnly: true,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F5F5F5',
                },
              }}
            />
            <FormControl
              fullWidth
              required
              disabled={editLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#FF6B35',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF6B35',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#FF6B35',
                },
              }}
            >
              <InputLabel>権限</InputLabel>
              <Select
                value={editingStaff?.role || 'clinic_viewer'}
                label="権限"
                onChange={(e) => {
                  if (editingStaff) {
                    setEditingStaff({
                      ...editingStaff,
                      role: e.target.value as 'clinic_owner' | 'clinic_editor' | 'clinic_viewer'
                    });
                  }
                }}
              >
                <MenuItem value="clinic_owner">医院オーナー</MenuItem>
                <MenuItem value="clinic_editor">医院編集者</MenuItem>
                <MenuItem value="clinic_viewer">医院閲覧者</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography sx={{ fontSize: '13px' }}>
                権限を変更すると、このスタッフのアクセス範囲が即座に更新されます。
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditingStaff(null);
            }}
            disabled={editLoading}
            sx={{
              color: '#616161',
              '&:hover': {
                backgroundColor: '#F5F5F5',
              },
            }}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={editLoading}
            sx={{
              backgroundColor: '#FF6B35',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#E55A2B',
              },
              '&:disabled': {
                backgroundColor: '#E0E0E0',
                color: '#9E9E9E',
              },
            }}
          >
            {editLoading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
