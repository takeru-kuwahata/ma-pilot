import React from 'react';
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
} from '@mui/material';
import {
  AddCircle as AddCircleIcon,
  Add as AddIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { MainLayout } from '../layouts/MainLayout';

// @MOCK_TO_API: 月次データのモック
interface MonthlyDataRow {
  id: string;
  yearMonth: string;
  totalRevenue: number;
  operatingProfit: number;
  totalPatients: number;
  dataSource: '手動入力' | 'CSV取込';
}

const mockMonthlyData: MonthlyDataRow[] = [
  {
    id: '1',
    yearMonth: '2025-10',
    totalRevenue: 8500000,
    operatingProfit: 2100000,
    totalPatients: 420,
    dataSource: '手動入力',
  },
  {
    id: '2',
    yearMonth: '2025-09',
    totalRevenue: 8900000,
    operatingProfit: 1980000,
    totalPatients: 389,
    dataSource: '手動入力',
  },
  {
    id: '3',
    yearMonth: '2025-08',
    totalRevenue: 7500000,
    operatingProfit: 1560000,
    totalPatients: 320,
    dataSource: 'CSV取込',
  },
];

const formatCurrency = (value: number): string => {
  return `¥${value.toLocaleString()}`;
};

export const DataManagement = () => {
  const handleNewDataEntry = () => {
    // TODO: Phase 4で実装
    console.log('新規データ入力');
  };

  const handleCsvUpload = () => {
    // TODO: Phase 4で実装
    console.log('CSVファイル選択');
  };

  const handleEdit = (id: string) => {
    // TODO: Phase 4で実装
    console.log('編集:', id);
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
              {mockMonthlyData.map((row) => (
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </MainLayout>
  );
};
