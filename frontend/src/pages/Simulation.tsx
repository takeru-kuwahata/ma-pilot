import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { simulationService, monthlyDataService, clinicService } from '../services/api';
import type { Simulation as SimulationType, MonthlyData, Clinic } from '../types';
import { buildActualPoints, buildForecastPoints, buildChartRows, type ForecastPoint } from '../utils/simulationForecast';

interface SimulationParams {
  period: string;
  insuranceRevenueChange: string;
  selfPayRevenueChange: string;
  retailRevenueChange: string;
  variableCostChange: string;
  fixedCostChange: string;
  newPatientChange: string;
  returningPatientChange: string;
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
  const { clinicId: clinicIdParam } = useParams<{ clinicId: string }>();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [params, setParams] = useState<SimulationParams>({
    period: '6',
    insuranceRevenueChange: '',
    selfPayRevenueChange: '',
    retailRevenueChange: '',
    variableCostChange: '',
    fixedCostChange: '',
    newPatientChange: '',
    returningPatientChange: '',
  });

  const [result, setResult] = useState<SimulationResultDisplay | null>(null);
  const [, setSimulations] = useState<SimulationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [latestData, setLatestData] = useState<MonthlyData | null>(null);
  const [monthlyDataList, setMonthlyDataList] = useState<MonthlyData[]>([]);
  const [forecastPoints, setForecastPoints] = useState<ForecastPoint[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

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
      loadSimulations();
      loadLatestMonthlyData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinic?.id]);

  const loadSimulations = async () => {
    if (!clinic?.id) return;

    try {
      const data = await simulationService.getSimulations(clinic.id);
      setSimulations(data);
    } catch (error) {
      console.error('Failed to load simulations:', error);
    }
  };

  const loadLatestMonthlyData = async () => {
    if (!clinic?.id) return;

    try {
      const data = await monthlyDataService.getMonthlyData(clinic.id);
      setMonthlyDataList(data);
      if (data.length > 0) {
        // 最新のデータを取得（year_monthでソート）
        const sorted = [...data].sort((a, b) => b.year_month.localeCompare(a.year_month));
        setLatestData(sorted[0]);
      }
    } catch (error) {
      console.error('Failed to load monthly data:', error);
    }
  };

  const handleParamChange = (field: keyof SimulationParams, value: string) => {
    setParams((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getNumericParam = (value: string): number => {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  };

  const handleSimulate = async () => {
    if (!clinic?.id) {
      setSnackbarMessage('医院IDが取得できませんでした');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);

      if (!latestData) {
        setSnackbarMessage('月次データが登録されていません。基礎データ管理から月次データを登録してください。');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // 現在値
      const currentRevenue = latestData.total_revenue || 0;
      const currentInsuranceRevenue = latestData.insurance_revenue || 0;
      const currentSelfPayRevenue = latestData.self_pay_revenue || 0;
      const currentVariableCost = latestData.variable_cost || 0;
      const currentFixedCost = latestData.fixed_cost || 0;
      const currentTotalPatients = latestData.total_patients || 0;

      if (currentRevenue <= 0) {
        setSnackbarMessage('月次データに売上が入力されていません。基礎データ管理から入力してください。');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // 変動率を適用して目標値を計算（フロントエンドで完結）
      const insuranceChange = getNumericParam(params.insuranceRevenueChange);
      const selfPayChange = getNumericParam(params.selfPayRevenueChange);
      const variableCostChange = getNumericParam(params.variableCostChange);
      const fixedCostChange = getNumericParam(params.fixedCostChange);
      const newPatientChange = getNumericParam(params.newPatientChange);
      const returningPatientChange = getNumericParam(params.returningPatientChange);

      const targetInsuranceRevenue = currentInsuranceRevenue * (1 + insuranceChange / 100);
      const targetSelfPayRevenue = currentSelfPayRevenue * (1 + selfPayChange / 100);
      const targetRevenue = targetInsuranceRevenue + targetSelfPayRevenue;

      const targetVariableCost = currentVariableCost * (1 + variableCostChange / 100);
      const targetFixedCost = currentFixedCost * (1 + fixedCostChange / 100);
      const targetTotalCost = targetVariableCost + targetFixedCost;
      const targetProfit = targetRevenue - targetTotalCost;
      const targetProfitMargin = targetRevenue > 0 ? (targetProfit / targetRevenue * 100) : 0;

      // 患者数（total_patientsベースで計算。4区分の合計が0の場合はtotal_patientsを使用）
      const baseTotalPatients = (
        (latestData.first_visit_patients || 0) +
        (latestData.re_first_visit_patients || 0) +
        (latestData.returning_patients || 0) +
        (latestData.other_patients || 0)
      ) || currentTotalPatients;

      const targetNewPatients = (latestData.first_visit_patients || 0) * (1 + newPatientChange / 100);
      const targetReturningPatients = (latestData.returning_patients || 0) * (1 + returningPatientChange / 100);
      const targetTotalPatients = baseTotalPatients > 0
        ? Math.ceil(baseTotalPatients * (targetRevenue / (currentRevenue || 1)))
        : 0;

      const targetAverageRevenuePerPatient = targetTotalPatients > 0
        ? targetRevenue / targetTotalPatients
        : (currentRevenue > 0 && currentTotalPatients > 0 ? currentRevenue / currentTotalPatients : 0);

      const targetVariableCostRate = targetRevenue > 0 ? targetVariableCost / targetRevenue * 100 : 0;

      // フロントエンドで計算した結果をそのままバックエンドに渡す
      const simulationInput = {
        target_revenue: Math.round(targetRevenue),
        target_profit: Math.round(targetProfit),
        assumed_average_revenue_per_patient: Math.round(targetAverageRevenuePerPatient),
        assumed_variable_cost_rate: Math.round(targetVariableCostRate * 10) / 10,
        assumed_fixed_cost: Math.round(targetFixedCost),
      };

      const simulationResult = {
        required_patients: Math.ceil(targetNewPatients + targetReturningPatients) || targetTotalPatients,
        required_treatments: Math.ceil((Math.ceil(targetNewPatients + targetReturningPatients) || targetTotalPatients) * 1.2),
        estimated_revenue: Math.round(targetRevenue),
        estimated_profit: Math.round(targetProfit),
        profit_margin: Math.round(targetProfitMargin * 10) / 10,
        strategies: [],
      };

      const simulation = await simulationService.createSimulation(
        clinic.id,
        `${params.period}ヶ月後のシミュレーション`,
        simulationInput,
        simulationResult
      );

      // 現在値との変動額を計算
      const currentProfit = currentRevenue - (currentVariableCost + currentFixedCost);
      const currentProfitRate = currentRevenue > 0 ? (currentProfit / currentRevenue * 100) : 0;

      setResult({
        projectedRevenue: Math.round(simulation.result.estimated_revenue),
        projectedProfit: Math.round(simulation.result.estimated_profit),
        projectedProfitRate: Math.round(simulation.result.profit_margin * 10) / 10,
        revenueChange: Math.round(simulation.result.estimated_revenue - currentRevenue),
        profitChange: Math.round(simulation.result.estimated_profit - currentProfit),
        profitRateChange: Math.round((simulation.result.profit_margin - currentProfitRate) * 10) / 10,
      });

      setForecastPoints(
        buildForecastPoints(
          latestData,
          Number(params.period),
          simulation.result.estimated_revenue,
          simulation.result.estimated_profit,
          targetTotalPatients
        )
      );

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
    return `¥${Math.round(value).toLocaleString()}`;
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
            color: '#555555',
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
                  handleParamChange('insuranceRevenueChange', e.target.value)
                }
                placeholder="例: +10 または -5"
                inputProps={{ step: 1, min: -50, max: 50 }}
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
                  handleParamChange('selfPayRevenueChange', e.target.value)
                }
                placeholder="例: +20 または -10"
                inputProps={{ step: 1, min: -50, max: 100 }}
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
                  handleParamChange('retailRevenueChange', e.target.value)
                }
                placeholder="例: +5 または -3"
                inputProps={{ step: 1, min: -50, max: 50 }}
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
                  handleParamChange('variableCostChange', e.target.value)
                }
                placeholder="例: +8 または -2"
                inputProps={{ step: 1, min: -50, max: 50 }}
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
                  handleParamChange('fixedCostChange', e.target.value)
                }
                placeholder="例: +5 または -5"
                inputProps={{ step: 1, min: -50, max: 50 }}
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
                  handleParamChange('newPatientChange', e.target.value)
                }
                placeholder="例: +15 または -10"
                inputProps={{ step: 1, min: -50, max: 100 }}
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
                  handleParamChange('returningPatientChange', e.target.value)
                }
                placeholder="例: +10 または -5"
                inputProps={{ step: 1, min: -50, max: 50 }}
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
                  color: '#555555',
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
                color: '#555555',
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
                color: '#555555',
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
              {result.projectedProfitRate.toFixed(1)}
              <Typography
                component="span"
                sx={{
                  fontSize: '14px',
                  color: '#555555',
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
                color: '#555555',
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
                color: '#555555',
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
                color: '#555555',
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
                  color: '#555555',
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
            marginBottom: '4px',
          }}
        >
          推移予測グラフ
        </Typography>
        {forecastPoints.length === 0 ? (
          <>
            <Typography sx={{ fontSize: '13px', color: '#757575', marginBottom: '16px' }}>
              過去の実績（直近12ヶ月）
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
                color: '#555555',
                fontSize: '16px',
              }}
            >
              <Typography sx={{ fontSize: '14px', color: '#555555' }}>
                シミュレーションを実行すると、実績と予測の推移が表示されます
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Typography sx={{ fontSize: '13px', color: '#757575', marginBottom: '16px' }}>
              実線: 過去の実績（直近12ヶ月） / 点線: 今回の設定での予測
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={buildChartRows(buildActualPoints(monthlyDataList), forecastPoints)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" tick={{ fontSize: '13px' }} />
                <YAxis
                  yAxisId="money"
                  tick={{ fontSize: '13px' }}
                  tickFormatter={(v: number) => `${Math.round(v / 10000).toLocaleString()}万`}
                />
                <YAxis
                  yAxisId="patients"
                  orientation="right"
                  tick={{ fontSize: '13px' }}
                  unit="人"
                />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name.includes('患者数')
                      ? [`${value.toLocaleString()}人`, name]
                      : [`¥${value.toLocaleString()}`, name]
                  }
                />
                <Legend />
                <Line yAxisId="money" type="monotone" dataKey="actualRevenue" stroke="#FF6B35" strokeWidth={2} name="総売上" dot={{ r: 3 }} connectNulls />
                <Line yAxisId="money" type="monotone" dataKey="forecastRevenue" stroke="#FF6B35" strokeWidth={2} strokeDasharray="6 4" name="総売上（予測）" dot={{ r: 3 }} connectNulls />
                <Line yAxisId="money" type="monotone" dataKey="actualProfit" stroke="#1976D2" strokeWidth={2} name="営業利益" dot={{ r: 3 }} connectNulls />
                <Line yAxisId="money" type="monotone" dataKey="forecastProfit" stroke="#1976D2" strokeWidth={2} strokeDasharray="6 4" name="営業利益（予測）" dot={{ r: 3 }} connectNulls />
                <Line yAxisId="patients" type="monotone" dataKey="actualPatients" stroke="#4CAF50" strokeWidth={2} name="患者数" dot={{ r: 3 }} connectNulls />
                <Line yAxisId="patients" type="monotone" dataKey="forecastPatients" stroke="#4CAF50" strokeWidth={2} strokeDasharray="6 4" name="患者数（予測）" dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
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
