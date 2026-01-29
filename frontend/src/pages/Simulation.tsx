import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import { PlayArrow as PlayArrowIcon, ShowChart as ShowChartIcon } from '@mui/icons-material';
import { useLayout } from '../hooks/useLayout';
import { simulationService, authService } from '../services/api';
import type { Simulation as SimulationType } from '../types';

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
  const { Layout } = useLayout();
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
  const [, setLoading] = useState(false);

  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.clinicId) return;

      const data = await simulationService.getSimulations(user.clinicId);
      setSimulations(data);
    } catch (error) {
      console.error('Failed to load simulations:', error);
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
      if (!user?.clinicId) return;

      const simulation = await simulationService.createSimulation(
        user.clinicId,
        `${params.period}ヶ月後のシミュレーション`,
        {
          targetRevenue: 0,
          targetProfit: 0,
          assumedAverageRevenuePerPatient: 0,
          assumedPersonnelCostRate: 0,
          assumedMaterialCostRate: 0,
          assumedFixedCost: 0
        }
      );

      setResult({
        projectedRevenue: simulation.result.estimatedRevenue,
        projectedProfit: simulation.result.estimatedProfit,
        projectedProfitRate: simulation.result.profitMargin,
        revenueChange: 0,
        profitChange: 0,
        profitRateChange: 0
      });

      await loadSimulations();
    } catch (error) {
      console.error('Failed to create simulation:', error);
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
    <Layout>
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
          <PlayArrowIcon sx={{ fontSize: '20px' }} />
          シミュレーション実行
        </Button>
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
    </Layout>
  );
};
