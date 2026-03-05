import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import {
  AddCircle as AddCircleIcon,
  Add as AddIcon,
  UploadFile as UploadFileIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import Papa from 'papaparse';
import { monthlyDataService, clinicService } from '../services/api';
import { MonthlyDataForm } from '../components/MonthlyDataForm';
import type { MonthlyData, MonthlyDataFormData, Clinic } from '../types';

interface MonthlyDataRow {
  id: string;
  year_month: string;
  total_revenue: number;
  operating_profit: number;
  total_patients: number;
  dataSource: '手動入力' | 'CSV取込';
}

const formatCurrency = (value: number): string => {
  return `¥${value.toLocaleString()}`;
};

export const DataManagement = () => {
  const { clinicId: clinicIdParam } = useParams<{ clinicId: string }>();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataRow[]>([]);
  const [rawMonthlyData, setRawMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; data: MonthlyDataFormData } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 医院情報を取得（slugまたはUUIDからUUID IDを取得）
  useEffect(() => {
    const fetchClinic = async () => {
      if (!clinicIdParam) return;
      try {
        const clinicData = await clinicService.getClinic(clinicIdParam);
        setClinic(clinicData);
      } catch (error) {
        console.error('Failed to fetch clinic:', error);
      }
    };
    fetchClinic();
  }, [clinicIdParam]);

  useEffect(() => {
    if (clinic?.id) {
      loadMonthlyData();
    }
  }, [clinic?.id]);

  const loadMonthlyData = async () => {
    if (!clinic?.id) return;

    try {
      const data = await monthlyDataService.getMonthlyData(clinic.id);
      setRawMonthlyData(data);
      const rows: MonthlyDataRow[] = data.map((item: MonthlyData) => ({
        id: item.id,
        year_month: item.year_month,
        total_revenue: item.total_revenue,
        operating_profit: item.total_revenue - (item.personnel_cost + item.material_cost + item.fixed_cost + item.other_cost),
        total_patients: item.total_patients,
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
    setEditTarget(null);
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (data: MonthlyDataFormData) => {
    if (!clinic?.id) return;

    try {
      if (editTarget) {
        await monthlyDataService.updateMonthlyData(editTarget.id, data);
        setSnackbarMessage('データを更新しました');
      } else {
        await monthlyDataService.createMonthlyData({ ...data, clinic_id: clinic.id });
        setSnackbarMessage('データを保存しました');
      }
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setFormDialogOpen(false);
      setEditTarget(null);
      await loadMonthlyData();
    } catch (error) {
      console.error('Failed to save monthly data:', error);
      setSnackbarMessage('保存に失敗しました');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
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

    if (!clinic?.id) {
      setSnackbarMessage('医院IDが取得できませんでした');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {

      // PapaParseでCSVをパース
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            // CSVデータをバックエンドに送信
            const response = await monthlyDataService.importCsv(clinic.id, results.data);

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

  const handleEdit = (id: string) => {
    const raw = rawMonthlyData.find((item) => item.id === id);
    if (!raw) return;
    setEditTarget({
      id,
      data: {
        year_month: raw.year_month,
        total_revenue: raw.total_revenue,
        insurance_revenue: raw.insurance_revenue,
        self_pay_revenue: raw.self_pay_revenue,
        retail_revenue: 0,
        variable_cost: raw.personnel_cost,
        fixed_cost: raw.fixed_cost,
        new_patients: raw.new_patients,
        returning_patients: raw.returning_patients,
        total_patients: raw.total_patients,
      }
    });
    setFormDialogOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // CSVテンプレートダウンロード
  const handleDownloadTemplate = () => {
    // CSVヘッダー（フォームの順番に合わせる）
    const headers = [
      '対象年月',
      '保険診療収入',
      '自由診療収入',
      '物販（その他）',
      '変動費',
      '固定費',
      '新患数',
      '再診患者数'
    ];

    // サンプル行（1行だけ）
    const sampleRow = [
      '2026-01',
      '2500000',
      '1500000',
      '300000',
      '800000',
      '2000000',
      '45',
      '380'
    ];

    // CSV形式に変換（UTF-8 BOM付き）
    const csvContent = [
      headers.join(','),
      sampleRow.join(',')
    ].join('\n');

    // BOM付きでダウンロード（Excel互換）
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', '月次データ入力テンプレート.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
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
              border: '2px solid #1976D2',
              color: '#1976D2',
              '&:hover': {
                backgroundColor: '#E3F2FD',
                border: '2px solid #1565C0',
              },
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <UploadFileIcon sx={{ fontSize: '20px' }} />
            CSVファイル選択
          </Button>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="text"
              onClick={handleDownloadTemplate}
              sx={{
                fontSize: '14px',
                color: '#1976D2',
                textDecoration: 'underline',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
            >
              📄 CSVテンプレートをダウンロード
            </Button>
          </Box>
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
                      {row.year_month}
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: '12px',
                        fontSize: '14px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      {formatCurrency(row.total_revenue)}
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: '12px',
                        fontSize: '14px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      {formatCurrency(row.operating_profit)}
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: '12px',
                        fontSize: '14px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      {row.total_patients}人
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
                        onClick={() => handleEdit(row.id)}
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

      {/* 月次データ入力ダイアログ */}
      <Dialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editTarget ? '月次データ編集' : '月次データ新規入力'}
          <IconButton onClick={() => setFormDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <MonthlyDataForm
            onSubmit={handleFormSubmit}
            onCancel={() => setFormDialogOpen(false)}
            initialData={editTarget?.data}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
