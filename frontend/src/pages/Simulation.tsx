import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { PlayArrow as PlayArrowIcon, ShowChart as ShowChartIcon } from '@mui/icons-material';
import { simulationService, authService, monthlyDataService } from '../services/api';
import type { Simulation as SimulationType, MonthlyData } from '../types';

interface SimulationParams {
  period: string;
  insuranceRevenueChange: number;
  selfPayRevenueChange: number;
  retailRevenueChange: number;
  variableCostChange: number;
  fixedCostChange: number;
  newPatientChange: number;
  returningPatientChange: number;
}

interface SimulationResultDisplay {
  projectedRevenue: number;
  projectedProfit: number;
  projectedProfitRate: number;
  revenueChange: number;
  profitChange: number;
  profitRateChange: number;
}

const periodOptions = [
  { value: '3', label: '3ヶ月後' },
  { value: '6', label: '6ヶ月後' },
  { value: '12', label: '12ヶ月後' },
  { value: '24', label: '24ヶ月後' },
];

export const Simulation = () => {
  const [params, setParams] = useState<SimulationParams>({
    period: '6',
    insuranceRevenueChange: 0,
    selfPayRevenueChange: 15,
    retailRevenueChange: 0,
    variableCostChange: 0,
    fixedCostChange: 0,
    newPatientChange: 20,
    returningPatientChange: 0,
  });

  const [result, setResult] = useState<SimulationResultDisplay | null>(null);
  const [, setSimulations] = useState<SimulationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [latestData, setLatestData] = useState<MonthlyData | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadSimulations();
    loadLatestMonthlyData();
  }, []);

  const loadSimulations = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.clinic_id) return;

      const data = await simulationService.getSimulations(user.clinic_id);
      setSimulations(data);
    } catch (error) {
      console.error('Failed to load simulations:', error);
    }
  };

  const loadLatestMonthlyData = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.clinic_id) return;

      const data = await monthlyDataService.getMonthlyData(user.clinic_id);
      if (data.length > 0) {
        // 最新のデータを取得（year_monthでソート）
        const sorted = [...data].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
        setLatestData(sorted[0]);
      }
    } catch (error) {
      console.error('Failed to load monthly data:', error);
    }
  };

  const handleParamChange = (field: keyof SimulationParams, value: string | number) => {
    setParams((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSimulate = async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      if (!user?.clinic_id) {
        setSnackbarMessage('ユーザー情報が取得できませんでした');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      if (!latestData) {
        setSnackbarMessage('月次データが登録されていません。基礎データ管理から月次データを登録してください。');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // 現在の値を基に変動率を適用
      const currentRevenue = latestData.totalRevenue;
      const currentInsuranceRevenue = latestData.insuranceRevenue;
      const currentSelfPayRevenue = latestData.selfPayRevenue;
      const currentPersonnelCost = latestData.personnelCost || 0;
      const currentMaterialCost = latestData.materialCost || 0;
      const currentFixedCost = latestData.fixedCost || 0;

      // 変動率を適用して目標値を計算
      const targetInsuranceRevenue = currentInsuranceRevenue * (1 + params.insuranceRevenueChange / 100);
      const targetSelfPayRevenue = currentSelfPayRevenue * (1 + params.selfPayRevenueChange / 100);
      const targetRetailRevenue = 0; // 物販収入は現在未対応
      const targetRevenue = targetInsuranceRevenue + targetSelfPayRevenue + targetRetailRevenue;

      const targetVariableCost = (currentPersonnelCost + currentMaterialCost) * (1 + params.variableCostChange / 100);
      const targetFixedCost = currentFixedCost * (1 + params.fixedCostChange / 100);
      const targetProfit = targetRevenue - targetVariableCost - targetFixedCost;

      const targetNewPatients = (latestData.newPatients || 0) * (1 + params.newPatientChange / 100);
      const targetReturningPatients = (latestData.returningPatients || 0) * (1 + params.returningPatientChange / 100);
      const targetTotalPatients = targetNewPatients + targetReturningPatients;

      const targetAverageRevenuePerPatient = targetTotalPatients > 0 ? targetRevenue / targetTotalPatients : 0;
      const targetPersonnelCostRate = targetRevenue > 0 ? (currentPersonnelCost * (1 + params.variableCostChange / 100)) / targetRevenue * 100 : 0;
      const targetMaterialCostRate = targetRevenue > 0 ? (currentMaterialCost * (1 + params.variableCostChange / 100)) / targetRevenue * 100 : 0;

      const simulation = await simulationService.createSimulation(
        user.clinic_id,
        `${params.period}ヶ月後のシミュレーション`,
        {
          targetRevenue: Math.round(targetRevenue),
          targetProfit: Math.round(targetProfit),
          assumedAverageRevenuePerPatient: Math.round(targetAverageRevenuePerPatient),
          assumedPersonnelCostRate: Math.round(targetPersonnelCostRate * 10) / 10,
          assumedMaterialCostRate: Math.round(targetMaterialCostRate * 10) / 10,
          assumedFixedCost: Math.round(targetFixedCost)
        }
      );

      // 現在値との変動額を計算
      const revenueChange = simulation.result.estimatedRevenue - currentRevenue;
      const currentProfit = currentRevenue - (currentPersonnelCost + currentMaterialCost + currentFixedCost);
      const profitChange = simulation.result.estimatedProfit - currentProfit;
      const currentProfitRate = currentRevenue > 0 ? (currentProfit / currentRevenue * 100) : 0;
      const profitRateChange = simulation.result.profitMargin - currentProfitRate;

      setResult({
        projectedRevenue: simulation.result.estimatedRevenue,
        projectedProfit: simulation.result.estimatedProfit,
        projectedProfitRate: simulation.result.profitMargin,
        revenueChange: Math.round(revenueChange),
        profitChange: Math.round(profitChange),
        profitRateChange: Math.round(profitRateChange * 10) / 10
      });

      setSnackbarMessage('シミュレーションが完了しました');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      await loadSimulations();
    } catch (error) {
      console.error('Failed to create simulation:', error);
      setSnackbarMessage('シミュレーションの実行に失敗しました。もう一度お試しください。');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return `¥${value.toLocaleString()}`;
  };

  const formatChange = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${formatCurrency(value)}`;
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
          経営シミュレーション
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#616161',
            fontSize: '14px',
          }}
        >
          売上・コスト・患者数の変動をシミュレーション
        </Typography>
      </Box>

      {/* シミュレーション入力フォーム */}
      <Paper
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          marginBottom: '24px',
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
          シミュレーション条件設定
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          {/* 左列 */}
          <Box>
            <Box sx={{ marginBottom: '16px' }}>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: '#424242',
                }}
              >
                シミュレーション期間
              </Typography>
              <TextField
                select
                fullWidth
                value={params.period}
                onChange={(e) => handleParamChange('period', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              >
                {periodOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ marginBottom: '16px' }}>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: '#424242',
                }}
              >
                保険診療収入の変動 (%)
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={params.insuranceRevenueChange}
                onChange={(e) =>
                  handleParamChange('insuranceRevenueChange', Number(e.target.value))
                }
                placeholder="例: +10 または -5"
                inputProps={{ step: 5, min: -50, max: 50 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Box>

            <Box sx={{ marginBottom: '16px' }}>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: '#424242',
                }}
              >
                自費診療収入の変動 (%)
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={params.selfPayRevenueChange}
                onChange={(e) =>
                  handleParamChange('selfPayRevenueChange', Number(e.target.value))
                }
                placeholder="例: +20 または -10"
                inputProps={{ step: 5, min: -50, max: 100 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Box>

            <Box sx={{ marginBottom: '16px' }}>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: '#424242',
                }}
              >
                物販収入の変動 (%)
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={params.retailRevenueChange}
                onChange={(e) =>
                  handleParamChange('retailRevenueChange', Number(e.target.value))
                }
                placeholder="例: +5 または -3"
                inputProps={{ step: 5, min: -50, max: 50 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Box>
          </Box>

          {/* 右列 */}
          <Box>
            <Box sx={{ marginBottom: '16px' }}>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: '#424242',
                }}
              >
                変動費の変動 (%)
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={params.variableCostChange}
                onChange={(e) =>
                  handleParamChange('variableCostChange', Number(e.target.value))
                }
                placeholder="例: +8 または -2"
                inputProps={{ step: 5, min: -50, max: 50 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Box>

            <Box sx={{ marginBottom: '16px' }}>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: '#424242',
                }}
              >
                固定費の変動 (%)
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={params.fixedCostChange}
                onChange={(e) =>
                  handleParamChange('fixedCostChange', Number(e.target.value))
                }
                placeholder="例: +5 または -5"
                inputProps={{ step: 5, min: -50, max: 50 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Box>

            <Box sx={{ marginBottom: '16px' }}>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: '#424242',
                }}
              >
                新患数の変動 (%)
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={params.newPatientChange}
                onChange={(e) =>
                  handleParamChange('newPatientChange', Number(e.target.value))
                }
                placeholder="例: +15 または -10"
                inputProps={{ step: 5, min: -50, max: 100 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Box>

            <Box sx={{ marginBottom: '16px' }}>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: '#424242',
                }}
              >
                再診患者数の変動 (%)
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={params.returningPatientChange}
                onChange={(e) =>
                  handleParamChange('returningPatientChange', Number(e.target.value))
                }
                placeholder="例: +10 または -5"
                inputProps={{ step: 5, min: -50, max: 50 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        <Button
          variant="contained"
          onClick={handleSimulate}
          disabled={loading || !latestData}
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
          {loading ? (
            <CircularProgress size={20} sx={{ color: '#ffffff' }} />
          ) : (
            <PlayArrowIcon sx={{ fontSize: '20px' }} />
          )}
          {loading ? '実行中...' : 'シミュレーション実行'}
        </Button>
        {!latestData && (
          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 1, color: '#f57c00' }}
          >
            ※ 月次データが登録されていません。基礎データ管理から登録してください。
          </Typography>
        )}
      </Paper>

      {/* シミュレーション結果 */}
      {result && (
        <Paper
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            marginBottom: '24px',
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
            シミュレーション結果
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <Paper
              sx={{
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                boxShadow: 'none',
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#616161',
                  marginBottom: '8px',
                }}
              >
                予測総売上
              </Typography>
              <Typography
                sx={{
                  fontSize: '28px',
                  fontWeight: 600,
                  color: '#424242',
                }}
              >
                {formatCurrency(result.projectedRevenue)}
            </Typography>
          </Paper>

          <Paper
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: 'none',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                color: '#616161',
                marginBottom: '8px',
              }}
            >
              予測営業利益
            </Typography>
            <Typography
              sx={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#4CAF50',
              }}
            >
              {formatCurrency(result.projectedProfit)}
            </Typography>
          </Paper>

          <Paper
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: 'none',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                color: '#616161',
                marginBottom: '8px',
              }}
            >
              予測利益率
            </Typography>
            <Typography
              sx={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#4CAF50',
              }}
            >
              {result.projectedProfitRate}
              <Typography
                component="span"
                sx={{
                  fontSize: '14px',
                  color: '#616161',
                  marginLeft: '4px',
                }}
              >
                %
              </Typography>
            </Typography>
          </Paper>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          <Paper
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: 'none',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                color: '#616161',
                marginBottom: '8px',
              }}
            >
              売上変動額
            </Typography>
            <Typography
              sx={{
                fontSize: '28px',
                fontWeight: 600,
                color: result.revenueChange >= 0 ? '#4CAF50' : '#F44336',
              }}
            >
              {formatChange(result.revenueChange)}
            </Typography>
          </Paper>

          <Paper
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: 'none',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                color: '#616161',
                marginBottom: '8px',
              }}
            >
              利益変動額
            </Typography>
            <Typography
              sx={{
                fontSize: '28px',
                fontWeight: 600,
                color: result.profitChange >= 0 ? '#4CAF50' : '#F44336',
              }}
            >
              {formatChange(result.profitChange)}
            </Typography>
          </Paper>

          <Paper
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: 'none',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                color: '#616161',
                marginBottom: '8px',
              }}
            >
              利益率変動
            </Typography>
            <Typography
              sx={{
                fontSize: '28px',
                fontWeight: 600,
                color: result.profitRateChange >= 0 ? '#4CAF50' : '#F44336',
              }}
            >
              {result.profitRateChange >= 0 ? '+' : ''}
              {result.profitRateChange}
              <Typography
                component="span"
                sx={{
                  fontSize: '14px',
                  color: '#616161',
                  marginLeft: '4px',
                }}
              >
                pt
              </Typography>
            </Typography>
          </Paper>
        </Box>
      </Paper>
      )}

      {/* グラフエリア */}
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
          推移予測グラフ
        </Typography>
        <Box
          sx={{
            width: '100%',
            height: '300px',
            backgroundColor: '#e0e0e0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#616161',
            fontSize: '16px',
            gap: '16px',
          }}
        >
          <ShowChartIcon sx={{ fontSize: '48px', color: '#9e9e9e' }} />
          <Typography sx={{ fontSize: '16px', color: '#616161' }}>
            Rechartsでグラフ表示（Phase 4で実装）
          </Typography>
        </Box>
      </Paper>

      {/* トースト通知 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
