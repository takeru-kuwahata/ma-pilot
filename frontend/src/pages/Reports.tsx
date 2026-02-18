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
import { reportService, authService } from '../services/api';
import type { Report } from '../types';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  format: string;
}

export const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const reportTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: '月次経営レポート',
      description: '売上、利益、患者数などの月次データを包括的にまとめたレポート',
      icon: <AssessmentIcon sx={{ fontSize: 48, color: '#FF6B35' }} />,
      format: 'PDF形式',
    },
    {
      id: '2',
      name: '診療圏分析レポート',
      description: '診療圏内の人口統計、競合分析、市場ポテンシャル評価',
      icon: <PieChartIcon sx={{ fontSize: 48, color: '#FF6B35' }} />,
      format: 'PDF形式',
    },
    {
      id: '3',
      name: 'シミュレーション結果レポート',
      description: '経営シミュレーションの結果と推移予測グラフ',
      icon: <TimelineIcon sx={{ fontSize: 48, color: '#FF6B35' }} />,
      format: 'PDF形式',
    },
  ];

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.clinic_id) {
        setLoading(false);
        return;
      }

      const data = await reportService.getReports(user.clinic_id);
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      const fileUrl = await reportService.downloadReport(reportId);
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const handleGenerateReport = async (templateId: string) => {
    try {
      setGenerating(true);
      const user = authService.getCurrentUser();
      if (!user?.clinic_id) {
        setSnackbarMessage('ユーザー情報が取得できませんでした');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // テンプレートIDに応じてレポートタイプを決定
      let reportType: 'monthly' | 'market_analysis' | 'simulation';
      let title: string;

      if (templateId === '1') {
        reportType = 'monthly';
        title = '月次経営レポート';
      } else if (templateId === '2') {
        reportType = 'market_analysis';
        title = '診療圏分析レポート';
      } else if (templateId === '3') {
        reportType = 'simulation';
        title = 'シミュレーション結果レポート';
      } else {
        setSnackbarMessage('不明なテンプレートです');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // レポート生成
      const report = await reportService.generateReport({
        clinic_id: user.clinic_id,
        type: reportType,
        format: 'pdf',
        title: title,
      });

      setSnackbarMessage('レポートを生成しました');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // レポート履歴を更新
      await loadReports();

      // 生成したレポートを自動ダウンロード
      await handleDownload(report.id);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setSnackbarMessage('レポート生成に失敗しました。月次データが登録されているか確認してください。');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = () => {
    // TODO: Phase 4でAPI呼び出し実装
  };

  const handleCreateCustomReport = () => {
    // TODO: Phase 4でカスタムレポート作成ダイアログ実装
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
          gridTemplateColumns: 'repeat(3, 1fr)',
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
                disabled={generating}
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
        <TableContainer>
          <Table>
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
                        onClick={() => handleDownload(report.id)}
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
                        onClick={handleDelete}
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
