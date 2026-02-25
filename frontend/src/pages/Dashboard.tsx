import { useParams } from 'react-router-dom';
import { Box, Typography, Grid, Paper, Alert, CircularProgress } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  MedicalServices as MedicalServicesIcon,
  Percent as PercentIcon,
  PersonAdd as PersonAddIcon,
  EventRepeat as EventRepeatIcon,
} from '@mui/icons-material';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardKpi } from '../types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// KPIカードコンポーネント
const KpiCard = ({ kpi, icon }: { kpi: DashboardKpi; icon: React.ReactNode }) => {
  const isPositive = kpi.comparison.trend === 'positive';
  const trendColor = isPositive ? '#388E3C' : '#D32F2F';
  const TrendIcon = isPositive ? TrendingUpIcon : TrendingDownIcon;

  // 値のフォーマット
  const formatValue = () => {
    if (kpi.unit === '¥') {
      return `¥${kpi.value.toLocaleString()}`;
    } else if (kpi.unit === '%') {
      return `${kpi.value}%`;
    } else {
      return `${kpi.value.toLocaleString()}${kpi.unit}`;
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {kpi.label}
        </Typography>
        <Box sx={{ color: '#9e9e9e' }}>{icon}</Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
        {formatValue()}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TrendIcon sx={{ fontSize: 16, color: trendColor }} />
        <Typography variant="caption" sx={{ color: trendColor, fontWeight: 600 }}>
          {isPositive ? '+' : ''}{kpi.comparison.month_over_month}%
        </Typography>
        <Typography variant="caption" color="text.secondary">
          前月比
        </Typography>
      </Box>
    </Paper>
  );
};

export const Dashboard = () => {
  const { clinicId } = useParams<{ clinicId: string }>();

  const { data, loading, error } = useDashboardData(clinicId || null);

  // clinicIdが取得できない場合
  if (!clinicId && !loading) {
    return (
      <Alert severity="warning">
        表示する医院データがありません。医院を選択してください。
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Alert severity="error">
        データの取得に失敗しました。しばらくしてから再度お試しください。
      </Alert>
    );
  }

  // KPIアイコンマッピング
  const kpiIcons = [
    <AttachMoneyIcon key="icon-0" />,
    <AttachMoneyIcon key="icon-1" />,
    <PercentIcon key="icon-2" />,
    <PeopleIcon key="icon-3" />,
    <MedicalServicesIcon key="icon-4" />,
    <PercentIcon key="icon-5" />,
    <PersonAddIcon key="icon-6" />,
    <EventRepeatIcon key="icon-7" />,
  ];

  // グラフデータのフォーマット（月次推移）
  let chartData: Array<{ month: string; 総売上: number; 営業利益: number }> = [];
  let patientChartData: Array<{ month: string; 新患: number; 既存患者: number }> = [];

  try {
    chartData = (data.trends || [])
      .map((trend) => {
        if (!trend?.year_month || trend.year_month.length < 7) {
          return null;
        }
        return {
          month: trend.year_month.substring(5, 7) + '月',
          総売上: Math.round(trend.total_revenue / 10000),
          営業利益: Math.round(trend.operating_profit / 10000),
        };
      })
      .filter((item): item is { month: string; 総売上: number; 営業利益: number } => item !== null);

    // 患者数推移データ
    patientChartData = (data.trends || [])
      .map((trend) => {
        if (!trend?.year_month || trend.year_month.length < 7) {
          return null;
        }
        return {
          month: trend.year_month.substring(5, 7) + '月',
          新患: trend.new_patients,
          既存患者: trend.returning_patients,
        };
      })
      .filter((item): item is { month: string; 新患: number; 既存患者: number } => item !== null);
  } catch (error) {
    console.error('[Dashboard] Error formatting chart data:', error);
  }

  return (
    <>
      {/* ページヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 500, mb: 1 }}>
          経営ダッシュボード
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data.last_updated} のデータ（データソース: {data.data_source}）
        </Typography>
      </Box>

        {/* アラート */}
        {data.alerts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {data.alerts.map((alert) => (
              <Alert
                key={alert.id}
                severity={alert.severity}
                sx={{ mb: 1 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {alert.title}
                </Typography>
                <Typography variant="caption">
                  {alert.message}
                </Typography>
              </Alert>
            ))}
          </Box>
        )}

        {/* KPIカードグリッド */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {data.kpis.map((kpi, index) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.id}>
              <KpiCard kpi={kpi} icon={kpiIcons[index]} />
            </Grid>
          ))}
        </Grid>

        {/* グラフセクション */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* 売上・利益推移グラフ */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                売上・利益推移（直近6ヶ月）
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="総売上"
                    stroke="#FF6B35"
                    strokeWidth={2}
                    name="総売上（万円）"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="営業利益"
                    stroke="#1976D2"
                    strokeWidth={2}
                    name="営業利益（万円）"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* 患者数推移グラフ */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                患者数推移（直近6ヶ月）
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={patientChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="新患" fill="#FF6B35" name="新患（人）" />
                  <Bar dataKey="既存患者" fill="#1976D2" name="既存患者（人）" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* 稼働率・自費率推移グラフ */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                ユニット稼働率推移（直近6ヶ月）
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={(data.trends || []).map((t) => ({
                    month: (t?.year_month || '0000-00').substring(5, 7) + '月',
                    稼働率: t?.unit_utilization ?? 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="稼働率"
                    stroke="#388E3C"
                    strokeWidth={2}
                    name="稼働率（%）"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                自費率推移（直近6ヶ月）
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={(data.trends || []).map((t) => ({
                    month: (t?.year_month || '0000-00').substring(5, 7) + '月',
                    自費率: t?.self_pay_rate ?? 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="自費率"
                    stroke="#F57C00"
                    strokeWidth={2}
                    name="自費率（%）"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
    </>
  );
};
