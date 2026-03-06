import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import type { PrintOrder } from '../types';
import * as printOrderService from '../services/printOrderService';
import { useCurrentClinic } from '../hooks/useCurrentClinic';

const STATUS_LABELS: Record<string, string> = {
  submitted: '受付済',
  approved: '承認済',
  shipped: '発送済',
  completed: '完了',
  cancelled: 'キャンセル',
};

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'> = {
  submitted: 'info',
  approved: 'primary',
  shipped: 'secondary',
  completed: 'success',
  cancelled: 'error',
};

export default function PrintOrderHistory() {
  const { clinicId } = useCurrentClinic();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PrintOrder | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // 注文履歴取得
  const fetchOrders = useCallback(async () => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: { clinic_id: string; status?: string } = {
        clinic_id: clinicId,
      };

      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const data = await printOrderService.getPrintOrders(params);
      setOrders(data);
    } catch (err) {
      console.error('注文履歴取得エラー:', err);
      setError('注文履歴の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [clinicId, filterStatus]);

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

  // 再注文
  const handleReorder = (order: PrintOrder) => {
    // 注文フォームに遷移し、注文データをstate経由で渡す
    navigate(`/clinic/${clinicId}/print-order`, {
      state: { reorderData: order },
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          印刷物注文履歴
        </Typography>

        {/* フィルター */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={filterStatus}
                  label="ステータス"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="submitted">受付済</MenuItem>
                  <MenuItem value="approved">承認済</MenuItem>
                  <MenuItem value="shipped">発送済</MenuItem>
                  <MenuItem value="completed">完了</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                onClick={fetchOrders}
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
                    <TableCell colSpan={6} align="center">
                      注文履歴がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        {order.items && order.items.length > 0
                          ? `${order.items.length}点の商品`
                          : '相談フォーム'}
                      </TableCell>
                      <TableCell align="right">
                        {order.items && order.items.length > 0
                          ? order.items.map((item) => item.quantity).reduce((a, b) => a + b, 0).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {order.total_amount
                          ? `¥${order.total_amount.toLocaleString()}`
                          : order.estimated_price
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
                          title="詳細を見る"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        {order.items && order.items.length > 0 && (
                          <IconButton
                            color="success"
                            onClick={() => handleReorder(order)}
                            title="再注文"
                          >
                            <RefreshIcon />
                          </IconButton>
                        )}
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
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    注文ID
                  </Typography>
                  <Typography variant="body1">{selectedOrder.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    注文日時
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedOrder.created_at).toLocaleString('ja-JP')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    ステータス
                  </Typography>
                  <Chip
                    label={STATUS_LABELS[selectedOrder.order_status]}
                    color={STATUS_COLORS[selectedOrder.order_status]}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    パターン
                  </Typography>
                  <Typography variant="body1">
                    {selectedOrder.pattern === 'consultation' ? '相談' : '再注文'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    メールアドレス
                  </Typography>
                  <Typography variant="body1">{selectedOrder.email}</Typography>
                </Grid>
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      注文商品
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>商品種類</TableCell>
                            <TableCell align="right">数量</TableCell>
                            <TableCell align="right">単価</TableCell>
                            <TableCell align="right">小計</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedOrder.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.product_type}</TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right">
                                ¥{item.unit_price.toLocaleString()}
                              </TableCell>
                              <TableCell align="right">
                                ¥{item.subtotal.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="h6" align="right">
                    合計金額: ¥
                    {(selectedOrder.total_amount || selectedOrder.estimated_price || 0).toLocaleString()}
                  </Typography>
                </Grid>
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
