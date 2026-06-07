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
  TextField,
} from '@mui/material';
import {
  AddCircle as AddCircleIcon,
  Add as AddIcon,
  UploadFile as UploadFileIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { monthlyDataService, clinicService } from '../services/api';
import { consultingService } from '../services/api/consultingService';
import { MonthlyDataForm } from '../components/MonthlyDataForm';
import type { MonthlyData, MonthlyDataFormData, Clinic } from '../types';

interface MonthlyDataRow {
  id: string;
  year_month: string;
  total_revenue: number;
  operating_profit: number;
  first_visit_patients: number;
  re_first_visit_patients: number;
  returning_patients: number;
  other_patients: number;
  total_patients: number;
  dataSource: '手動入力' | 'CSV取込';
}

const formatCurrency = (value: number): string => {
  return `¥${value.toLocaleString()}`;
};

const MONTH_MAP: Record<string, string> = {
  jan: '1', feb: '2', mar: '3', apr: '4', may: '5', jun: '6',
  jul: '7', aug: '8', sep: '9', oct: '10', nov: '11', dec: '12',
};

const formatYearMonth = (yearMonth: string): string => {
  // YYYY-MM format
  const isoMatch = yearMonth.match(/^(\d{4})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}年${parseInt(isoMatch[2])}月`;
  }
  // Jan-26 or 26-Jan format (Excel-style)
  const excelMatch = yearMonth.match(/^([A-Za-z]{3})-(\d{2})$/) || yearMonth.match(/^(\d{2})-([A-Za-z]{3})$/);
  if (excelMatch) {
    const [, part1, part2] = excelMatch;
    const monthStr = isNaN(Number(part1)) ? part1 : part2;
    const yearStr = isNaN(Number(part1)) ? part2 : part1;
    const month = MONTH_MAP[monthStr.toLowerCase()];
    if (month) {
      const year = parseInt(yearStr) + 2000;
      return `${year}年${month}月`;
    }
  }
  return yearMonth;
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
  const [clinicMemo, setClinicMemo] = useState<string>('');
  const [memoSaving, setMemoSaving] = useState(false);
  const [memoSaved, setMemoSaved] = useState(false);

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
      consultingService.getMemo(clinic.id).then((memo) => {
        if (memo !== null && memo !== undefined) setClinicMemo(memo);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        first_visit_patients: item.first_visit_patients,
        re_first_visit_patients: item.re_first_visit_patients,
        returning_patients: item.returning_patients,
        other_patients: item.other_patients,
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
      const response = await monthlyDataService.importCsvFile(clinic.id, file);
      setSnackbarMessage(`${response.success}件のデータを取り込みました（失敗: ${response.failed}件）`);
      setSnackbarSeverity(response.failed > 0 ? 'error' : 'success');
      setSnackbarOpen(true);
      await loadMonthlyData();
    } catch (error) {
      console.error('CSV import failed:', error);
      setSnackbarMessage('CSV取込に失敗しました');
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
        first_visit_patients: raw.first_visit_patients,
        re_first_visit_patients: raw.re_first_visit_patients,
        returning_patients: raw.returning_patients,
        other_patients: raw.other_patients,
        total_patients: raw.total_patients,
      }
    });
    setFormDialogOpen(true);
  };

  const handleDelete = async (id: string, yearMonth: string) => {
    if (!window.confirm(`${yearMonth} のデータを削除してもよろしいですか？`)) return;
    try {
      await monthlyDataService.deleteMonthlyData(id);
      setSnackbarMessage('削除しました');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await loadMonthlyData();
    } catch (error) {
      console.error('Delete failed:', error);
      setSnackbarMessage('削除に失敗しました');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // CSVエクスポート
  const handleCsvExport = () => {
    if (rawMonthlyData.length === 0) {
      setSnackbarMessage('エクスポートするデータがありません');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const headers = [
      '年月(YYYY-MM)',
      '保険診療収入',
      '自費診療収入',
      '物販（その他）',
      '変動費',
      '固定費',
      '初診患者数',
      '再初診患者数',
      '再診患者数',
      'その他患者数',
    ];

    const rows = rawMonthlyData.map((item) => [
      formatYearMonth(item.year_month),
      item.insurance_revenue,
      item.self_pay_revenue,
      item.other_cost,
      item.material_cost,
      item.fixed_cost,
      item.first_visit_patients,
      item.re_first_visit_patients,
      item.returning_patients,
      item.other_patients,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const clinicName = clinic?.name || 'clinic';
    link.setAttribute('href', url);
    link.setAttribute('download', `月次データ_${clinicName}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSVテンプレートダウンロード
  const handleDownloadTemplate = () => {
    // CSVヘッダー（新テンプレート形式）
    const headers = [
      '年月(YYYY-MM)',
      '保険診療収入',
      '自費診療収入',
      '物販（その他）',
      '変動費',
      '固定費',
      '初診患者数',
      '再初診患者数',
      '再診患者数',
      'その他患者数',
    ];

    // サンプル行（1行だけ）
    const sampleRow = [
      '2026年1月',
      '2500000',
      '1500000',
      '100000',
      '200000',
      '1500000',
      '45',
      '10',
      '380',
      '5',
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
            color: '#555555',
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
              color: '#555555',
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
              color: '#555555',
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

      {/* 院長メモ */}
      <Paper
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          marginBottom: '24px',
          border: '1.5px solid #FF6B35',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '16px' }}>
          📝 院長メモ（現在感じている課題・相談事項）
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '13px' }}>
          スタッフ離職率が高い、ユニット数に対して患者が少ないなど、現在感じている問題や課題を自由に記入できます。ここに入力された内容に基づき、ダッシュボード側で最適な改善策をおすすめします。
        </Typography>
        <TextField
          multiline
          minRows={3}
          fullWidth
          placeholder="例：ユニット数は十分だが、スタッフの定着率が悪く、新人教育が追いついていない。求人や教育の自動化・仕組み化を検討したい。"
          value={clinicMemo}
          onChange={(e) => { setClinicMemo(e.target.value); setMemoSaved(false); }}
          variant="outlined"
          sx={{ mb: 1.5 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="contained"
            size="small"
            disabled={memoSaving}
            onClick={async () => {
              if (!clinic?.id) return;
              setMemoSaving(true);
              try {
                await consultingService.saveMemo(clinic.id, clinicMemo);
                setMemoSaved(true);
              } finally {
                setMemoSaving(false);
              }
            }}
            sx={{ backgroundColor: '#FF6B35', '&:hover': { backgroundColor: '#E55A2B' } }}
          >
            {memoSaving ? '保存中...' : '保存する → 経営ダッシュボードへ反映'}
          </Button>
          {memoSaved && (
            <Typography variant="caption" color="success.main">保存しました</Typography>
          )}
        </Box>
      </Paper>

      {/* データ一覧テーブル */}
      <Paper
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            登録済みデータ一覧
          </Typography>
          <Button
            variant="outlined"
            onClick={handleCsvExport}
            disabled={rawMonthlyData.length === 0}
            startIcon={<DownloadIcon />}
            sx={{ fontSize: '14px' }}
          >
            CSVエクスポート
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    padding: '12px',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#555555',
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
                    color: '#555555',
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
                    color: '#555555',
                    borderBottom: '1px solid #e0e0e0',
                  }}
                >
                  営業利益
                </TableCell>
                <TableCell sx={{ padding: '12px', fontWeight: 600, fontSize: '14px', color: '#555555', borderBottom: '1px solid #e0e0e0' }}>
                  初診
                </TableCell>
                <TableCell sx={{ padding: '12px', fontWeight: 600, fontSize: '14px', color: '#555555', borderBottom: '1px solid #e0e0e0' }}>
                  再初診
                </TableCell>
                <TableCell sx={{ padding: '12px', fontWeight: 600, fontSize: '14px', color: '#555555', borderBottom: '1px solid #e0e0e0' }}>
                  再診
                </TableCell>
                <TableCell sx={{ padding: '12px', fontWeight: 600, fontSize: '14px', color: '#555555', borderBottom: '1px solid #e0e0e0' }}>
                  他
                </TableCell>
                <TableCell sx={{ padding: '12px', fontWeight: 600, fontSize: '14px', color: '#555555', borderBottom: '1px solid #e0e0e0' }}>
                  総患者数
                </TableCell>
                <TableCell sx={{ padding: '12px', fontWeight: 600, fontSize: '14px', color: '#555555', borderBottom: '1px solid #e0e0e0' }}>
                  データソース
                </TableCell>
                <TableCell
                  sx={{
                    padding: '12px',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#555555',
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
                  <TableCell colSpan={9} sx={{ textAlign: 'center', padding: '24px' }}>
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : monthlyData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', padding: '24px' }}>
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
                      {formatYearMonth(row.year_month)}
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
                    <TableCell sx={{ padding: '12px', fontSize: '14px', borderBottom: '1px solid #e0e0e0' }}>
                      {row.first_visit_patients}人
                    </TableCell>
                    <TableCell sx={{ padding: '12px', fontSize: '14px', borderBottom: '1px solid #e0e0e0' }}>
                      {row.re_first_visit_patients}人
                    </TableCell>
                    <TableCell sx={{ padding: '12px', fontSize: '14px', borderBottom: '1px solid #e0e0e0' }}>
                      {row.returning_patients}人
                    </TableCell>
                    <TableCell sx={{ padding: '12px', fontSize: '14px', borderBottom: '1px solid #e0e0e0' }}>
                      {row.other_patients}人
                    </TableCell>
                    <TableCell sx={{ padding: '12px', fontSize: '14px', borderBottom: '1px solid #e0e0e0' }}>
                      {row.total_patients}人
                    </TableCell>
                    <TableCell sx={{ padding: '12px', fontSize: '14px', borderBottom: '1px solid #e0e0e0' }}>
                      {row.dataSource}
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: '12px',
                        fontSize: '14px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: '8px' }}>
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
                        <IconButton
                          onClick={() => handleDelete(row.id, row.year_month)}
                          size="small"
                          sx={{ color: '#F44336' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
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
