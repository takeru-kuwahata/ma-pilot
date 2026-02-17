import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, getAuthHeaders } from '../../services/api/config';
import { useAuthStore } from '../../stores/authStore';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { adminService } from '../../services/api';
import { clinicService } from '../../services/api';
import type { Clinic } from '../../types';

// APIレスポンスはスネークケースで返るため、型アサーションで取得するヘルパー
const getRaw = (clinic: Clinic) => clinic as unknown as Record<string, unknown>;
const getIsActive = (clinic: Clinic): boolean =>
  (getRaw(clinic).is_active ?? clinic.isActive) as boolean;
const getPostalCode = (clinic: Clinic): string =>
  ((getRaw(clinic).postal_code ?? clinic.postalCode) as string) || '';
const getPhoneNumber = (clinic: Clinic): string =>
  ((getRaw(clinic).phone_number ?? clinic.phoneNumber) as string) || '';
const getCreatedAt = (clinic: Clinic): string =>
  ((getRaw(clinic).created_at ?? clinic.createdAt) as string) || '';

export const AdminClinics = () => {
  const navigate = useNavigate();
  const { setSelectedClinic } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [, setLoading] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // 新規登録ダイアログ
  const [openDialog, setOpenDialog] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [newClinic, setNewClinic] = useState({
    name: '',
    postal_code: '',
    address: '',
    phone_number: '',
    owner_id: '',
    latitude: 35.6762,
    longitude: 139.6503,
  });

  // 編集ダイアログ
  const [editClinic, setEditClinic] = useState<Clinic | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    postal_code: '',
    address: '',
    phone_number: '',
  });

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
    setPage(1);
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.preventDefault();
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // 詳細表示（その医院のダッシュボードへ遷移）
  const handleView = (clinic: Clinic) => {
    setSelectedClinic(clinic.id);
    navigate('/clinic/dashboard');
  };

  // 編集ダイアログを開く
  const handleEdit = (clinic: Clinic) => {
    setEditClinic(clinic);
    setEditForm({
      name: clinic.name || '',
      postal_code: getPostalCode(clinic),
      address: clinic.address || '',
      phone_number: getPhoneNumber(clinic),
    });
  };

  // 編集保存
  const handleSaveEdit = async () => {
    if (!editClinic) return;
    setSavingEdit(true);
    try {
      await clinicService.updateClinic(editClinic.id, {
        name: editForm.name,
        postalCode: editForm.postal_code,
        address: editForm.address,
        phoneNumber: editForm.phone_number,
      });
      await loadClinics();
      setEditClinic(null);
    } catch (error) {
      console.error('Failed to update clinic:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`編集の保存に失敗しました。\n${msg}`);
    } finally {
      setSavingEdit(false);
    }
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
      const msg = error instanceof Error ? error.message : String(error);
      alert(`ステータス変更に失敗しました。\n${msg}`);
    }
  };

  const handleAddClinic = () => {
    setOpenDialog(true);
  };

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

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/geocode?address=${encodeURIComponent(address)}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setNewClinic((prev) => ({ ...prev, latitude: data.latitude, longitude: data.longitude }));
      }
    } catch {
      // 失敗時はデフォルト値のまま
    } finally {
      setGeocoding(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewClinic({ name: '', postal_code: '', address: '', phone_number: '', owner_id: '', latitude: 35.6762, longitude: 139.6503 });
  };

  const isValidUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

  const handleCreateClinic = async () => {
    if (newClinic.owner_id.length > 0 && !isValidUuid(newClinic.owner_id)) {
      alert('オーナーIDを入力する場合はUUID形式で入力してください。\n空白のままにすると現在ログイン中のアカウントがオーナーになります。');
      return;
    }
    try {
      await adminService.createClinic(newClinic);
      await loadClinics();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to create clinic:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`医院の登録に失敗しました。\n${msg}`);
    }
  };

  // フィルタリングとページネーション
  const filteredClinics = clinics.filter((clinic) => {
    const isActive = getIsActive(clinic);
    const statusMatch =
      filterStatus === 'all' ||
      (filterStatus === 'active' && isActive) ||
      (filterStatus === 'inactive' && !isActive) ||
      (filterStatus === 'trial' && false);
    const searchMatch =
      !searchQuery ||
      clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getPhoneNumber(clinic).includes(searchQuery);
    return statusMatch && searchMatch;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredClinics.length / itemsPerPage);
  const paginatedClinics = filteredClinics.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getStatusLabel = (isActive: boolean) => isActive ? 'アクティブ' : '停止中';
  const getStatusColor = (isActive: boolean) =>
    isActive
      ? { backgroundColor: '#E8F5E9', color: '#2E7D32' }
      : { backgroundColor: '#FFEBEE', color: '#C62828' };

  const filterButtonSx = (active: boolean) => ({
    fontSize: '14px',
    fontWeight: 500,
    textTransform: 'none' as const,
    ...(active
      ? { backgroundColor: '#FF6B35', color: '#ffffff', '&:hover': { backgroundColor: '#E55A2B' } }
      : { borderColor: '#e0e0e0', color: '#616161', '&:hover': { borderColor: '#FF6B35' } }),
  });

  return (
    <>
      {/* ページヘッダー */}
      <Box sx={{ marginBottom: '24px' }}>
        <Typography variant="h4" sx={{ fontSize: '32px', fontWeight: 500, marginBottom: '8px' }}>
          医院アカウント管理
        </Typography>
        <Typography variant="body2" sx={{ color: '#616161', fontSize: '14px' }}>
          登録医院の閲覧・編集・ステータス管理
        </Typography>
      </Box>

      {/* アクションバー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <TextField
            placeholder="医院名、住所、電話番号で検索"
            value={searchQuery}
            onChange={handleSearch}
            onKeyPress={handleSearchKeyPress}
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
            {[
              { key: 'all', label: 'すべて' },
              { key: 'active', label: 'アクティブ' },
              { key: 'trial', label: 'トライアル' },
              { key: 'inactive', label: '停止中' },
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={filterStatus === key ? 'contained' : 'outlined'}
                onClick={() => handleFilterChange(key)}
                sx={filterButtonSx(filterStatus === key)}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={handleAddClinic}
          sx={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 600, fontSize: '16px', backgroundColor: '#FF6B35', color: '#ffffff', '&:hover': { backgroundColor: '#E55A2B' } }}
        >
          <AddIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
          新規医院を登録
        </Button>
      </Box>

      {/* 医院一覧テーブル */}
      <Paper sx={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['医院名', '住所', '登録日', 'プラン', 'ステータス', '操作'].map((label) => (
                  <TableCell key={label} sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedClinics.map((clinic) => {
                const isActive = getIsActive(clinic);
                const createdAtStr = getCreatedAt(clinic);
                const displayDate = createdAtStr ? new Date(createdAtStr).toLocaleDateString('ja-JP') : 'N/A';
                return (
                  <TableRow key={clinic.id}>
                    <TableCell sx={{ fontSize: '14px' }}>{clinic.name}</TableCell>
                    <TableCell sx={{ fontSize: '14px' }}>{clinic.address}</TableCell>
                    <TableCell sx={{ fontSize: '14px' }}>{displayDate}</TableCell>
                    <TableCell>
                      <Chip label="無料プラン" sx={{ backgroundColor: '#E3F2FD', color: '#1976D2', fontSize: '12px', fontWeight: 600, height: '24px' }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(isActive)}
                        sx={{ ...getStatusColor(isActive), fontSize: '12px', fontWeight: 600, height: '24px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleView(clinic)} title="この医院として操作する" sx={{ color: '#FF6B35', '&:hover': { color: '#E55A2B' } }}>
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEdit(clinic)} title="編集" sx={{ color: '#616161', '&:hover': { color: '#FF6B35' } }}>
                        <EditIcon />
                      </IconButton>
                      {!isActive ? (
                        <IconButton size="small" onClick={() => handleToggleStatus(clinic.id, isActive)} title="再開" sx={{ color: '#4CAF50', '&:hover': { color: '#2E7D32' } }}>
                          <PlayArrowIcon />
                        </IconButton>
                      ) : (
                        <IconButton size="small" onClick={() => handleToggleStatus(clinic.id, isActive)} title="停止" sx={{ color: '#616161', '&:hover': { color: '#FF6B35' } }}>
                          <BlockIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            sx={{
              '& .MuiPaginationItem-root': { fontSize: '14px' },
              '& .Mui-selected': { backgroundColor: '#FF6B35', color: '#ffffff', '&:hover': { backgroundColor: '#E55A2B' } },
            }}
          />
        </Box>
      </Paper>

      {/* 編集ダイアログ */}
      <Dialog open={editClinic !== null} onClose={() => setEditClinic(null)} maxWidth="sm" fullWidth>
        <DialogTitle>医院情報を編集</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="医院名"
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="郵便番号"
              value={editForm.postal_code}
              onChange={(e) => setEditForm((prev) => ({ ...prev, postal_code: formatPostalCode(e.target.value) }))}
              fullWidth
              inputProps={{ maxLength: 8 }}
              helperText="数字を入力するとハイフンを自動入力します"
            />
            <TextField
              label="住所"
              value={editForm.address}
              onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="電話番号"
              value={editForm.phone_number}
              onChange={(e) => setEditForm((prev) => ({ ...prev, phone_number: formatPhoneNumber(e.target.value) }))}
              fullWidth
              inputProps={{ maxLength: 13 }}
              helperText="数字を入力するとハイフンを自動入力します"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditClinic(null)} sx={{ color: '#616161' }} disabled={savingEdit}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={savingEdit}
            sx={{ backgroundColor: '#FF6B35', '&:hover': { backgroundColor: '#E55A2B' } }}
            startIcon={savingEdit ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
          >
            {savingEdit ? '保存中...' : '保存する'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 新規医院登録ダイアログ */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>新規医院を登録</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="医院名"
              value={newClinic.name}
              onChange={(e) => setNewClinic((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="郵便番号"
              value={newClinic.postal_code}
              onChange={(e) => setNewClinic((prev) => ({ ...prev, postal_code: formatPostalCode(e.target.value) }))}
              placeholder="1500001"
              fullWidth
              required
              helperText="数字を入力するとハイフンを自動入力します"
              inputProps={{ maxLength: 8 }}
            />
            <TextField
              label="住所"
              value={newClinic.address}
              onChange={(e) => setNewClinic((prev) => ({ ...prev, address: e.target.value }))}
              onBlur={(e) => geocodeAddress(e.target.value)}
              fullWidth
              required
              helperText={geocoding ? '位置情報を取得中...' : ''}
            />
            <TextField
              label="電話番号"
              value={newClinic.phone_number}
              onChange={(e) => setNewClinic((prev) => ({ ...prev, phone_number: formatPhoneNumber(e.target.value) }))}
              placeholder="0312345678"
              fullWidth
              required
              helperText="数字を入力するとハイフンを自動入力します"
              inputProps={{ maxLength: 13 }}
            />
            <TextField
              label="オーナーID（UUID）※任意"
              value={newClinic.owner_id}
              onChange={(e) => setNewClinic((prev) => ({ ...prev, owner_id: e.target.value }))}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              fullWidth
              error={newClinic.owner_id.length > 0 && !isValidUuid(newClinic.owner_id)}
              helperText={
                newClinic.owner_id.length > 0 && !isValidUuid(newClinic.owner_id)
                  ? 'UUID形式で入力してください'
                  : '空白の場合は現在ログイン中のアカウントがオーナーになります'
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: '#616161' }}>キャンセル</Button>
          <Button
            onClick={handleCreateClinic}
            variant="contained"
            sx={{ backgroundColor: '#FF6B35', '&:hover': { backgroundColor: '#E55A2B' } }}
          >
            登録
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
