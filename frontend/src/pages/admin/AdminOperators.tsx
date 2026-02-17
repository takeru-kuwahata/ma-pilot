import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { API_BASE_URL, getAuthHeaders, handleResponse } from '../../services/api/config';

interface Operator {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export const AdminOperators = () => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 追加ダイアログ
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({ display_name: '', email: '', password: 'advance2026' });
  const [formError, setFormError] = useState('');

  // 削除確認ダイアログ
  const [deleteTarget, setDeleteTarget] = useState<Operator | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadOperators();
  }, []);

  const loadOperators = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/operators`, { headers: getAuthHeaders() });
      const data = await handleResponse<Operator[]>(res);
      setOperators(data);
    } catch (error) {
      console.error('Failed to load operators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.display_name.trim() || !form.email.trim()) {
      setFormError('名前とメールアドレスは必須です');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/operators`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          display_name: form.display_name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });
      await handleResponse(res);
      await loadOperators();
      setOpenAdd(false);
      setForm({ display_name: '', email: '', password: 'advance2026' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setFormError(`作成に失敗しました: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/operators/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      await handleResponse(res);
      await loadOperators();
      setDeleteTarget(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      alert(`削除に失敗しました。\n${msg}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Box sx={{ marginBottom: '24px' }}>
        <Typography variant="h4" sx={{ fontSize: '32px', fontWeight: 500, marginBottom: '8px' }}>
          運営者アカウント管理
        </Typography>
        <Typography variant="body2" sx={{ color: '#616161', fontSize: '14px' }}>
          MA-Pilotの運営者アカウントの管理
        </Typography>
      </Box>

      <Paper sx={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>
            運営者一覧（{operators.length}名）
          </Typography>
          <Button
            variant="contained"
            onClick={() => { setOpenAdd(true); setFormError(''); }}
            sx={{ backgroundColor: '#FF6B35', '&:hover': { backgroundColor: '#E55A2B' }, fontWeight: 600 }}
          >
            <AddIcon sx={{ mr: 1 }} />
            運営者を追加
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#FF6B35' }} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {['氏名', 'メールアドレス', 'ロール', '登録日', '操作'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 600, fontSize: '14px', color: '#616161' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {operators.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell sx={{ fontSize: '14px', fontWeight: 500 }}>{op.display_name || '（未設定）'}</TableCell>
                    <TableCell sx={{ fontSize: '14px' }}>{op.email}</TableCell>
                    <TableCell>
                      <Chip
                        label="運営者"
                        sx={{ backgroundColor: '#FFF3E0', color: '#E65100', fontSize: '12px', fontWeight: 600, height: '24px' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '14px' }}>
                      {op.created_at ? new Date(op.created_at).toLocaleDateString('ja-JP') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(op)}
                        title="削除"
                        sx={{ color: '#bdbdbd', '&:hover': { color: '#F44336' } }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {operators.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', color: '#9e9e9e', py: 4 }}>
                      運営者が登録されていません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 追加ダイアログ */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="xs" fullWidth>
        <DialogTitle>運営者を追加</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="氏名"
              value={form.display_name}
              onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
              fullWidth
              required
              placeholder="例：本多裕樹"
            />
            <TextField
              label="メールアドレス"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              fullWidth
              required
              type="email"
              placeholder="例：honda_hiroki@medical-advance.com"
            />
            <TextField
              label="初期パスワード"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              fullWidth
              required
              helperText="ログイン後、本人がマイページで変更できます"
            />
            {formError && (
              <Typography sx={{ fontSize: '13px', color: '#F44336' }}>{formError}</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)} sx={{ color: '#616161' }} disabled={saving}>キャンセル</Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={saving}
            sx={{ backgroundColor: '#FF6B35', '&:hover': { backgroundColor: '#E55A2B' } }}
            startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
          >
            {saving ? '作成中...' : '追加する'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: '#F44336' }}>運営者を削除しますか？</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '14px' }}>
            <strong>「{deleteTarget?.display_name || deleteTarget?.email}」</strong>を削除します。<br />
            この操作は取り消せません。本当に削除しますか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} sx={{ color: '#616161' }} disabled={deleting}>キャンセル</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleting}
            sx={{ backgroundColor: '#F44336', '&:hover': { backgroundColor: '#C62828' } }}
            startIcon={deleting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <DeleteIcon />}
          >
            {deleting ? '削除中...' : '削除する'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
