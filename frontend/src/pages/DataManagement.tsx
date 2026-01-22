import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  AddCircle as AddCircleIcon,
  Add as AddIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import Papa from 'papaparse';
import { MainLayout } from '../layouts/MainLayout';
import { monthlyDataService, authService } from '../services/api';
import type { MonthlyData } from '../types';

interface MonthlyDataRow {
  id: string;
  yearMonth: string;
  totalRevenue: number;
  operatingProfit: number;
  totalPatients: number;
  dataSource: '手動入力' | 'CSV取込';
}

const formatCurrency = (value: number): string => {
  return `¥${value.toLocaleString()}`;
};

export const DataManagement = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyDataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMonthlyData();
  }, []);

  const loadMonthlyData = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.clinicId) {
        setLoading(false);
        return;
      }

      const data = await monthlyDataService.getMonthlyData(user.clinicId);
      const rows: MonthlyDataRow[] = data.map((item: MonthlyData) => ({
        id: item.id,
        yearMonth: item.yearMonth,
        totalRevenue: item.totalRevenue,
        operatingProfit: item.totalRevenue - (item.personnelCost + item.materialCost + item.fixedCost + item.otherCost),
        totalPatients: item.totalPatients,
        dataSource: '手動入力'
      }));
      setMonthlyData(rows);
    } catch (error) {
      console.error('Failed to load monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewDataEntry = () => {
    // TODO: モーダルダイアログで月次データ入力フォームを表示
    setSnackbarMessage('月次データ入力機能は開発中です');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  };

  const handleCsvUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // CSVファイルかチェック
    if (!file.name.endsWith('.csv')) {
      setSnackbarMessage('CSVファイルを選択してください');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const user = authService.getCurrentUser();
      if (!user?.clinicId) {
        setSnackbarMessage('ログインしていません');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      const clinicId = user.clinicId;

      // PapaParseでCSVをパース
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            // CSVデータをバックエンドに送信
            const response = await monthlyDataService.importCsv(clinicId, results.data);

            setSnackbarMessage(`${response.success}件のデータを取り込みました（失敗: ${response.failed}件）`);
            setSnackbarSeverity(response.failed > 0 ? 'error' : 'success');
            setSnackbarOpen(true);

            // データを再読み込み
            await loadMonthlyData();
          } catch (error) {
            console.error('CSV import failed:', error);
            setSnackbarMessage('CSV取込に失敗しました');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
        },
        error: (error) => {
          console.error('CSV parse error:', error);
          setSnackbarMessage('CSVファイルの読み込みに失敗しました');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      });
    } catch (error) {
      console.error('File handling error:', error);
      setSnackbarMessage('ファイル処理中にエラーが発生しました');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }

    // ファイル入力をリセット（同じファイルを再選択可能にする）
    event.target.value = '';
  };

  const handleEdit = () => {
    // TODO: モーダルダイアログで編集フォームを表示
    setSnackbarMessage('データ編集機能は開発中です');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <MainLayout>
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
          基礎データ管理
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#616161',
            fontSize: '14px',
          }}
        >
          月次データの入力・編集、CSVインポート
        </Typography>
      </Box>

      {/* カードグリッド */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {/* 月次データ入力カード */}
        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            textAlign: 'center',
          }}
        >
          <AddCircleIcon
            sx={{
              fontSize: '60px',
              color: '#FF6B35',
              marginBottom: '16px',
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            月次データ入力
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#616161',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            売上、コスト、患者数などの月次データを手動で入力
          </Typography>
          <Button
            variant="contained"
            onClick={handleNewDataEntry}
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AddIcon sx={{ fontSize: '20px' }} />
            新規データ入力
          </Button>
        </Paper>

        {/* CSV一括取込カード */}
        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            textAlign: 'center',
          }}
        >
          <UploadFileIcon
            sx={{
              fontSize: '60px',
              color: '#1976D2',
              marginBottom: '16px',
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            CSV一括取込
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#616161',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            Lステップなどから出力したCSVファイルを一括取込
          </Typography>
          <Button
            variant="outlined"
            onClick={handleCsvUpload}
            sx={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
              backgroundColor: 'transparent',
              border: '1px solid #e0e0e0',
              color: '#424242',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
              },
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <UploadFileIcon sx={{ fontSize: '20px' }} />
            CSVファイル選択
          </Button>
        </Paper>
      </Box>

      {/* データ一覧テーブル */}
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
          登録済みデータ一覧
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    padding: '12px',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#616161',
                    borderBottom: '1px solid #e0e0e0',
                  }}
                >
                  年月
                </TableCell>
                <TableCell
                  sx={{
                    padding: '12px',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#616161',
                    borderBottom: '1px solid #e0e0e0',
                  }}
                >
                  総売上
                </TableCell>
                <TableCell
                  sx={{
                    padding: '12px',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#616161',
                    borderBottom: '1px solid #e0e0e0',
                  }}
                >
                  営業利益
                </TableCell>
                <TableCell
                  sx={{
                    padding: '12px',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#616161',
                    borderBottom: '1px solid #e0e0e0',
                  }}
                >
                  総患者数
                </TableCell>
                <TableCell
                  sx={{
                    padding: '12px',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#616161',
                    borderBottom: '1px solid #e0e0e0',
                  }}
                >
                  データソース
                </TableCell>
                <TableCell
                  sx={{
                    padding: '12px',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#616161',
                    borderBottom: '1px solid #e0e0e0',
                  }}
                >
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', padding: '24px' }}>
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : monthlyData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', padding: '24px' }}>
                    データがありません
                  </TableCell>
                </TableRow>
              ) : (
                monthlyData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell
                      sx={{
                        padding: '12px',
                        fontSize: '14px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      {row.yearMonth}
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: '12px',
                        fontSize: '14px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      {formatCurrency(row.totalRevenue)}
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: '12px',
                        fontSize: '14px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      {formatCurrency(row.operatingProfit)}
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: '12px',
                        fontSize: '14px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      {row.totalPatients}人
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: '12px',
                        fontSize: '14px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      {row.dataSource}
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: '12px',
                        fontSize: '14px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      <Button
                        variant="outlined"
                        onClick={handleEdit}
                        sx={{
                          padding: '6px 16px',
                          fontSize: '14px',
                          backgroundColor: 'transparent',
                          border: '1px solid #e0e0e0',
                          color: '#424242',
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                            border: '1px solid #e0e0e0',
                          },
                        }}
                      >
                        編集
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 非表示のファイル入力 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        style={{ display: 'none' }}
      />

      {/* スナックバー通知 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
};
