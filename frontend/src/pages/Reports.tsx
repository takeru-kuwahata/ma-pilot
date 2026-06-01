import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { reportService, clinicService, monthlyDataService } from '../services/api';
import type { Report, Clinic } from '../types';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  format: string;
}

export const Reports = () => {
  const { clinicId: clinicIdParam } = useParams<{ clinicId: string }>();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const reportTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: '月次経営レポート',
      description: '基礎データ管理に登録された直近月のデータをもとに、売上・利益・患者数を前月と比較してまとめたレポート',
      icon: <AssessmentIcon sx={{ fontSize: 48, color: '#FF6B35' }} />,
      format: 'PDF形式',
    },
    {
      id: '2',
      name: '診療圏分析レポート',
      description: '直近に実施した診療圏分析の結果（人口統計・競合医院数・市場ポテンシャル）をまとめたレポート',
      icon: <PieChartIcon sx={{ fontSize: 48, color: '#FF6B35' }} />,
      format: 'PDF形式',
    },
    {
      id: '3',
      name: 'シミュレーション結果レポート',
      description: '直近に実施した経営シミュレーションの想定パラメータと予測結果をまとめたレポート',
      icon: <TimelineIcon sx={{ fontSize: 48, color: '#FF6B35' }} />,
      format: 'PDF形式',
    },
  ];

  // Fetch clinic to get UUID from slug
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
      loadReports();
      loadAvailableMonths(clinic.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinic?.id]);

  const loadAvailableMonths = async (clinicId: string) => {
    try {
      const data = await monthlyDataService.getMonthlyData(clinicId);
      const months = data
        .map((d) => d.year_month)
        .filter((ym): ym is string => !!ym)
        .sort((a, b) => b.localeCompare(a));
      setAvailableMonths(months);
      if (months.length > 0) setSelectedMonth(months[0]);
    } catch (error) {
      console.error('Failed to load available months:', error);
    }
  };

  const loadReports = async () => {
    if (!clinic?.id) {
      setLoading(false);
      return;
    }

    try {
      const data = await reportService.getReports(clinic.id);
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: string, title?: string) => {
    try {
      const fileUrl = await reportService.downloadReport(reportId);
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = title ? `${title}.pdf` : 'report.pdf';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const handleGenerateReport = async (templateId: string) => {
    if (!clinic?.id) {
      setSnackbarMessage('医院IDが取得できませんでした');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setGenerating(true);

      // テンプレートIDに応じてレポートタイプを決定
      let reportType: 'monthly' | 'market_analysis' | 'simulation';
      let title: string;
      let parameters: Record<string, string> | undefined;

      // JST現在日時で年月を生成（診療圏・シミュレーション用）
      const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const ym = `${now.getUTCFullYear()}年${now.getUTCMonth() + 1}月`;

      if (templateId === '1') {
        if (!selectedMonth) {
          setSnackbarMessage('対象月を選択してください');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }
        reportType = 'monthly';
        const [y, m] = selectedMonth.split('-');
        title = `月次経営レポート（${y}年${parseInt(m)}月）`;
        parameters = { year_month: selectedMonth };
      } else if (templateId === '2') {
        reportType = 'market_analysis';
        title = `診療圏分析レポート（${ym}）`;
      } else if (templateId === '3') {
        reportType = 'simulation';
        title = `シミュレーション結果レポート（${ym}）`;
      } else {
        setSnackbarMessage('不明なテンプレートです');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // レポート生成
      const report = await reportService.generateReport({
        clinic_id: clinic.id,
        type: reportType,
        format: 'pdf',
        title: title,
        parameters,
      });

      setSnackbarMessage('レポートを生成しました');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // レポート履歴を更新
      await loadReports();

      // 生成したレポートを自動ダウンロード
      await handleDownload(report.id, report.title);
    } catch (error) {
      console.error('Failed to generate report:', error);
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      let errorMsg = 'レポート生成に失敗しました。';
      if (isTimeout) {
        errorMsg = 'レポート生成がタイムアウトしました。しばらく待ってから再度お試しください。';
      } else if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('no monthly data') || msg.includes('monthly_data')) {
          errorMsg = 'レポート生成に失敗しました。基礎データ管理から月次データを登録してください。';
        } else if (msg.includes('no simulation') || msg.includes('simulation')) {
          errorMsg = 'レポート生成に失敗しました。先にシミュレーションを実行してください。';
        } else if (msg.includes('no market analysis') || msg.includes('market_analy')) {
          errorMsg = 'レポート生成に失敗しました。先に診療圏分析を実行してください。';
        } else {
          errorMsg = `レポート生成に失敗しました。${error.message}`;
        }
      }
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!window.confirm('このレポートを削除してもよろしいですか？')) {
      return;
    }

    try {
      await reportService.deleteReport(reportId);
      setSnackbarMessage('レポートを削除しました');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      await loadReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
      setSnackbarMessage('レポート削除に失敗しました');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCreateCustomReport = () => {
    setSnackbarMessage('カスタムレポート作成機能は今後のアップデートで実装予定です');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
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
          レポート管理
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#616161',
            fontSize: '14px',
          }}
        >
          経営レポートの作成・ダウンロード・履歴管理
        </Typography>
      </Box>

      {/* アクションバー */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '20px',
            fontWeight: 600,
          }}
        >
          レポートテンプレート
        </Typography>
        <Button
          variant="contained"
          onClick={handleCreateCustomReport}
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
          カスタムレポート作成
        </Button>
      </Box>

      {/* レポートテンプレートグリッド */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {reportTemplates.map((template) => (
          <Paper
            key={template.id}
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          >
            <Box sx={{ marginBottom: '16px' }}>{template.icon}</Box>
            <Typography
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              {template.name}
            </Typography>
            <Typography
              sx={{
                color: '#616161',
                fontSize: '14px',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              {template.description}
            </Typography>
            {template.id === '1' && (
              <FormControl fullWidth size="small" sx={{ marginBottom: '12px' }}>
                <InputLabel>対象月</InputLabel>
                <Select
                  value={selectedMonth}
                  label="対象月"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  disabled={availableMonths.length === 0}
                >
                  {availableMonths.map((ym) => {
                    const [y, m] = ym.split('-');
                    return (
                      <MenuItem key={ym} value={ym}>
                        {y}年{parseInt(m)}月
                      </MenuItem>
                    );
                  })}
                  {availableMonths.length === 0 && (
                    <MenuItem value="" disabled>月次データがありません</MenuItem>
                  )}
                </Select>
              </FormControl>
            )}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid #e0e0e0',
              }}
            >
              <Typography
                sx={{
                  fontSize: '12px',
                  color: '#9e9e9e',
                }}
              >
                {template.format}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleGenerateReport(template.id)}
                disabled={generating || (template.id === '1' && !selectedMonth)}
                sx={{
                  color: '#616161',
                  '&:hover': {
                    color: '#FF6B35',
                  },
                  '&:disabled': {
                    color: '#e0e0e0',
                  },
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* レポート生成履歴 */}
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
          レポート生成履歴
        </Typography>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#616161',
                  }}
                >
                  レポート名
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#616161',
                  }}
                >
                  生成日時
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#616161',
                  }}
                >
                  対象期間
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#616161',
                  }}
                >
                  ステータス
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#616161',
                  }}
                >
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', padding: '24px' }}>
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', padding: '24px' }}>
                    レポートがありません
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell sx={{ fontSize: '14px' }}>{report.title}</TableCell>
                    <TableCell sx={{ fontSize: '14px' }}>
                      {new Date(report.generated_at).toLocaleString('ja-JP')}
                    </TableCell>
                    <TableCell sx={{ fontSize: '14px' }}>
                      {report.type === 'monthly' ? '月次' :
                       report.type === 'quarterly' ? '四半期' :
                       report.type === 'annual' ? '年次' :
                       report.type === 'simulation' ? 'シミュレーション' :
                       '診療圏分析'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label="完了"
                        sx={{
                          backgroundColor: '#E8F5E9',
                          color: '#2E7D32',
                          fontSize: '12px',
                          fontWeight: 600,
                          height: '24px',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(report.id, report.title)}
                        sx={{
                          color: '#616161',
                          '&:hover': {
                            color: '#FF6B35',
                          },
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(report.id)}
                        sx={{
                          color: '#616161',
                          '&:hover': {
                            color: '#FF6B35',
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Snackbar - Toast通知 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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
