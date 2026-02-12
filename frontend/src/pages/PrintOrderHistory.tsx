import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import type { PrintOrder } from '../types';
import * as printOrderService from '../services/printOrderService';

const STATUS_LABELS: Record<string, string> = {
  submitted: '受付済み',
  approved: '承認済み',
  in_production: '制作中',
  shipped: '発送済み',
  completed: '完了',
  cancelled: 'キャンセル',
};

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'> = {
  submitted: 'info',
  approved: 'primary',
  in_production: 'warning',
  shipped: 'secondary',
  completed: 'success',
  cancelled: 'error',
};

export default function PrintOrderHistory() {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PrintOrder | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClinicName, setFilterClinicName] = useState<string>('');

  // 注文履歴取得
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      if (filterClinicName) {
        params.clinicName = filterClinicName;
      }

      const data = await printOrderService.getPrintOrders(params);
      setOrders(data);
    } catch (err) {
      console.error('注文履歴取得エラー:', err);
      setError('注文履歴の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterClinicName]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 詳細表示
  const handleViewDetail = async (orderId: string) => {
    try {
      const order = await printOrderService.getPrintOrder(orderId);
      setSelectedOrder(order);
      setDetailDialogOpen(true);
    } catch (err) {
      console.error('注文詳細取得エラー:', err);
      setError('注文詳細の取得に失敗しました。');
    }
  };

  // 詳細ダイアログを閉じる
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedOrder(null);
  };

  // フィルター検索
  const handleSearch = () => {
    fetchOrders();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          印刷物注文履歴
        </Typography>

        {/* フィルター */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={filterStatus}
                  label="ステータス"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="submitted">受付済み</MenuItem>
                  <MenuItem value="approved">承認済み</MenuItem>
                  <MenuItem value="in_production">制作中</MenuItem>
                  <MenuItem value="shipped">発送済み</MenuItem>
                  <MenuItem value="completed">完了</MenuItem>
                  <MenuItem value="cancelled">キャンセル</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="クリニック名"
                value={filterClinicName}
                onChange={(e) => setFilterClinicName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{ height: '56px' }}
                fullWidth
              >
                検索
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* ローディング */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          /* 注文テーブル */
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>注文日</TableCell>
                  <TableCell>クリニック名</TableCell>
                  <TableCell>商品種類</TableCell>
                  <TableCell align="right">数量</TableCell>
                  <TableCell align="right">見積金額</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      注文履歴がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString('ja-JP')}
                      </TableCell>
                      <TableCell>{order.clinic_name}</TableCell>
                      <TableCell>{order.product_type || '未定'}</TableCell>
                      <TableCell align="right">
                        {order.quantity ? order.quantity.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {order.estimated_price
                          ? `¥${order.estimated_price.toLocaleString()}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={STATUS_LABELS[order.order_status]}
                          color={STATUS_COLORS[order.order_status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleViewDetail(order.id)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        </Paper>

      {/* 詳細モーダル */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>注文詳細</DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    注文ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.id}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    注文日時
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(selectedOrder.created_at).toLocaleString('ja-JP')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    クリニック名
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.clinic_name}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    メールアドレス
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.email}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    注文パターン
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.pattern === 'reorder' ? '再注文' : '相談フォーム'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    商品種類
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.product_type || '未定'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    数量
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.quantity ? selectedOrder.quantity.toLocaleString() : '未定'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    納期希望日
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.delivery_date || '未定'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    デザイン作成
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.design_required ? '必要' : '不要'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    見積金額
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.estimated_price
                      ? `¥${selectedOrder.estimated_price.toLocaleString()}`
                      : '未算出'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ステータス
                  </Typography>
                  <Chip
                    label={STATUS_LABELS[selectedOrder.order_status]}
                    color={STATUS_COLORS[selectedOrder.order_status]}
                    size="small"
                  />
                </Grid>

                {selectedOrder.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      備考
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedOrder.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>閉じる</Button>
        </DialogActions>
      </Dialog>
      </Container>
  );
}
