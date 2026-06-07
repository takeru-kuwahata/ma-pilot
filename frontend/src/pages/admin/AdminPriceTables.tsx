import { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  Chip,
  Tooltip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  getPriceTables,
  createPriceTable,
  updatePriceTable,
  deletePriceTable,
} from '../../services/printOrderService';
import type { PriceTableFormData } from '../../services/printOrderService';
import type { PriceTable } from '../../types';

// 商品種類の選択肢（表示順）
const PRODUCT_TYPE_OPTIONS = [
  '診察券（通常）',
  '診察券（特急）',
  'ネームプレート',
  'パンフレット（三つ折り）',
  'リコールはがき（ポストカード）',
  'リコールはがき（官製）',
  '名刺（片面・カラー）',
  '名刺（片面・モノクロ）',
  '名刺（両面・カラー）',
  '名刺（両面・モノクロ）',
  '薬袋',
];

const EMPTY_FORM: PriceTableFormData = {
  product_type: '',
  quantity: 0,
  price: 0,
  design_fee: 0,
  design_fee_included: true,
  delivery_days: 6,
  specifications: '',
};

// 商品ごとに色分けするカラーマップ
const PRODUCT_COLORS: Record<string, string> = {
  '診察券（通常）': '#1565C0',
  '診察券（特急）': '#6A1B9A',
  'ネームプレート': '#00695C',
  'パンフレット（三つ折り）': '#E65100',
  'リコールはがき（ポストカード）': '#558B2F',
  'リコールはがき（官製）': '#2E7D32',
  '名刺（片面・カラー）': '#AD1457',
  '名刺（片面・モノクロ）': '#78909C',
  '名刺（両面・カラー）': '#C62828',
  '名刺（両面・モノクロ）': '#546E7A',
  '薬袋': '#F57F17',
};

export default function AdminPriceTables() {
  const [priceTables, setPriceTables] = useState<PriceTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ダイアログ状態
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<PriceTable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PriceTable | null>(null);
  const [formData, setFormData] = useState<PriceTableFormData>(EMPTY_FORM);
  const [isNew, setIsNew] = useState(false);

  // スナックバー
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPriceTables();
      // 商品種類の定義順 → 枚数昇順でソート
      const sorted = [...data].sort((a, b) => {
        const ai = PRODUCT_TYPE_OPTIONS.indexOf(a.product_type);
        const bi = PRODUCT_TYPE_OPTIONS.indexOf(b.product_type);
        const aOrder = ai === -1 ? 999 : ai;
        const bOrder = bi === -1 ? 999 : bi;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.quantity - b.quantity;
      });
      setPriceTables(sorted);
    } catch {
      showSnackbar('価格マスタの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 新規追加ダイアログを開く
  const handleOpenNew = () => {
    setIsNew(true);
    setEditTarget(null);
    setFormData(EMPTY_FORM);
    setEditDialog(true);
  };

  // 編集ダイアログを開く
  const handleOpenEdit = (row: PriceTable) => {
    setIsNew(false);
    setEditTarget(row);
    setFormData({
      product_type: row.product_type,
      quantity: row.quantity,
      price: row.price,
      design_fee: row.design_fee,
      design_fee_included: row.design_fee_included,
      delivery_days: row.delivery_days,
      specifications: typeof row.specifications === 'object' && row.specifications !== null
        ? JSON.stringify(row.specifications)
        : (row.specifications || ''),
    });
    setEditDialog(true);
  };

  // 保存（新規 or 更新）
  const handleSave = async () => {
    if (!formData.product_type || formData.quantity <= 0 || formData.price < 0) {
      showSnackbar('商品種類・数量・価格は必須です', 'error');
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createPriceTable(formData);
        showSnackbar('価格マスタを追加しました');
      } else if (editTarget) {
        await updatePriceTable(editTarget.id, formData);
        showSnackbar('価格マスタを更新しました');
      }
      setEditDialog(false);
      await loadData();
    } catch (e: unknown) {
      showSnackbar(e instanceof Error ? e.message : '保存に失敗しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 削除確認ダイアログを開く
  const handleOpenDelete = (row: PriceTable) => {
    setDeleteTarget(row);
    setDeleteDialog(true);
  };

  // 削除実行
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deletePriceTable(deleteTarget.id);
      showSnackbar('削除しました');
      setDeleteDialog(false);
      await loadData();
    } catch {
      showSnackbar('削除に失敗しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 商品グループに分けてレンダリング
  const grouped = PRODUCT_TYPE_OPTIONS.reduce<Record<string, PriceTable[]>>((acc, type) => {
    const rows = priceTables.filter((r) => r.product_type === type);
    if (rows.length > 0) acc[type] = rows;
    return acc;
  }, {});
  // 未知の商品種類（選択肢にないもの）
  const unknownTypes = [...new Set(priceTables.filter((r) => !PRODUCT_TYPE_OPTIONS.includes(r.product_type)).map((r) => r.product_type))];
  unknownTypes.forEach((type) => {
    grouped[type] = priceTables.filter((r) => r.product_type === type);
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">価格マスタ管理</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            印刷物の価格・納期・校正回数を管理します。変更は即座に発注フォームに反映されます。
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="再読み込み">
            <IconButton onClick={loadData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenNew}>
            新規追加
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        Object.entries(grouped).map(([productType, rows]) => (
          <Paper key={productType} sx={{ mb: 3, overflow: 'hidden' }}>
            {/* 商品グループヘッダー */}
            <Box
              sx={{
                px: 2, py: 1,
                bgcolor: PRODUCT_COLORS[productType] || '#455A64',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" color="white">
                {productType}
              </Typography>
              <Chip label={`${rows.length}件`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', height: 20, fontSize: '13px' }} />
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                    <TableCell sx={{ fontWeight: 'bold', width: 90 }}>数量（枚）</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', width: 120 }}>価格（税抜）</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', width: 100 }}>デザイン費</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 90 }}>デザイン費</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', width: 90 }}>納期</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>仕様メモ</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 90 }} align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.quantity.toLocaleString()}枚</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ¥{row.price.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {row.design_fee > 0 ? `¥${row.design_fee.toLocaleString()}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.design_fee_included ? '込み' : '別途'}
                          size="small"
                          color={row.design_fee_included ? 'primary' : 'default'}
                          sx={{ height: 20, fontSize: '13px' }}
                        />
                      </TableCell>
                      <TableCell align="right">{row.delivery_days}営業日後</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {typeof row.specifications === 'object' && row.specifications !== null
                            ? JSON.stringify(row.specifications)
                            : row.specifications || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="編集">
                          <IconButton size="small" onClick={() => handleOpenEdit(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="削除">
                          <IconButton size="small" color="error" onClick={() => handleOpenDelete(row)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))
      )}

      {/* 編集・新規ダイアログ */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isNew ? '価格マスタを追加' : '価格マスタを編集'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth required>
              <InputLabel>商品種類</InputLabel>
              <Select
                value={formData.product_type}
                label="商品種類"
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
              >
                {PRODUCT_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
                <MenuItem value="__custom__" disabled sx={{ color: 'text.secondary', fontSize: '13px' }}>
                  ── 以下は直接入力 ──
                </MenuItem>
              </Select>
            </FormControl>

            {/* 商品種類を直接入力したい場合 */}
            {!PRODUCT_TYPE_OPTIONS.includes(formData.product_type) && formData.product_type !== '' && (
              <TextField
                label="商品種類（カスタム）"
                value={formData.product_type}
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                fullWidth
                required
              />
            )}

            <Box display="flex" gap={2}>
              <TextField
                label="数量（枚）"
                type="number"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                fullWidth
                required
                inputProps={{ min: 1 }}
              />
              <TextField
                label="納期（営業日後）"
                type="number"
                value={formData.delivery_days || ''}
                onChange={(e) => setFormData({ ...formData, delivery_days: Number(e.target.value) })}
                fullWidth
                required
                inputProps={{ min: 1 }}
              />
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                label="価格（税抜・円）"
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                fullWidth
                required
                inputProps={{ min: 0 }}
              />
              <TextField
                label="デザイン費（円）"
                type="number"
                value={formData.design_fee ?? ''}
                onChange={(e) => setFormData({ ...formData, design_fee: Number(e.target.value) })}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.design_fee_included}
                  onChange={(e) => setFormData({ ...formData, design_fee_included: e.target.checked })}
                />
              }
              label={formData.design_fee_included ? 'デザイン費込み（価格にデザイン費を含む）' : 'デザイン費別途（価格にデザイン費を含まない）'}
            />

            <TextField
              label="仕様メモ（任意）"
              value={formData.specifications || ''}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              fullWidth
              placeholder="例: 角丸あり、マットPP加工 など"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : isNew ? '追加' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>削除の確認</DialogTitle>
        <DialogContent>
          <Typography>
            「{deleteTarget?.product_type}」{deleteTarget?.quantity.toLocaleString()}枚（¥{deleteTarget?.price.toLocaleString()}）を削除しますか？
          </Typography>
          <Typography variant="body2" color="error" mt={1}>
            この操作は元に戻せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>キャンセル</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : '削除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
