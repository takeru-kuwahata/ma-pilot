import React from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { MainLayout } from '../layouts/MainLayout';

// @MOCK_TO_API: レポートテンプレートの型定義
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  format: string;
}

// @MOCK_TO_API: レポート履歴の型定義
interface ReportHistory {
  id: string;
  name: string;
  generatedAt: string;
  period: string;
  status: 'completed' | 'pending';
}

export const Reports = () => {
  // @MOCK_TO_API: モックデータ
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

  const reportHistory: ReportHistory[] = [
    {
      id: '1',
      name: '月次経営レポート',
      generatedAt: '2025-11-10 14:30',
      period: '2025年10月',
      status: 'completed',
    },
    {
      id: '2',
      name: '診療圏分析レポート',
      generatedAt: '2025-11-08 10:15',
      period: '2025年11月時点',
      status: 'completed',
    },
    {
      id: '3',
      name: 'シミュレーション結果レポート',
      generatedAt: '2025-11-05 16:45',
      period: '6ヶ月後予測',
      status: 'completed',
    },
    {
      id: '4',
      name: 'カスタムレポート',
      generatedAt: '2025-11-01 09:20',
      period: '2025年Q3',
      status: 'pending',
    },
  ];

  const handleDownload = (reportId: string) => {
    // TODO: Phase 4でAPI呼び出し実装
    console.log('Download report:', reportId);
  };

  const handleDelete = (reportId: string) => {
    // TODO: Phase 4でAPI呼び出し実装
    console.log('Delete report:', reportId);
  };

  const handleCreateCustomReport = () => {
    // TODO: Phase 4でカスタムレポート作成ダイアログ実装
    console.log('Create custom report');
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
                sx={{
                  color: '#616161',
                  '&:hover': {
                    color: '#FF6B35',
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
              {reportHistory.map((report) => (
                <TableRow key={report.id}>
                  <TableCell sx={{ fontSize: '14px' }}>{report.name}</TableCell>
                  <TableCell sx={{ fontSize: '14px' }}>{report.generatedAt}</TableCell>
                  <TableCell sx={{ fontSize: '14px' }}>{report.period}</TableCell>
                  <TableCell>
                    <Chip
                      label={report.status === 'completed' ? '完了' : '生成中'}
                      sx={{
                        backgroundColor:
                          report.status === 'completed' ? '#E8F5E9' : '#FFF3E0',
                        color: report.status === 'completed' ? '#2E7D32' : '#EF6C00',
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
                      disabled={report.status === 'pending'}
                      sx={{
                        color: '#616161',
                        '&:hover': {
                          color: '#FF6B35',
                        },
                        '&.Mui-disabled': {
                          opacity: 0.3,
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </MainLayout>
  );
};
