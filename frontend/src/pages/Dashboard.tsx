import { useState, useEffect, useMemo } from 'react';
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
import { MainLayout } from '../layouts/MainLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { useDashboardData } from '../hooks/useDashboardData';
import { adminService } from '../services/api';
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
          {isPositive ? '+' : ''}{kpi.comparison.monthOverMonth}%
        </Typography>
        <Typography variant="caption" color="text.secondary">
          前月比
        </Typography>
      </Box>
    </Paper>
  );
};

export const Dashboard = () => {
  const [firstClinicId, setFirstClinicId] = useState<string | null>(null);

  // TODO: 認証コンテキストから取得（Phase 5以降）
  const user = useMemo(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }, []);

  const isSystemAdmin = user?.role === 'system_admin';
  const userClinicId = user?.clinic_id || null;
  const clinicId = userClinicId || firstClinicId;

  // システム管理者の場合、最初の医院を取得（1回のみ実行）
  useEffect(() => {
    if (isSystemAdmin && !userClinicId && !firstClinicId) {
      adminService.getClinics()
        .then(clinics => {
          if (clinics.length > 0) {
            setFirstClinicId(clinics[0].id);
          }
        })
        .catch(err => console.error('Failed to fetch first clinic:', err));
    }
  }, []); // 空の依存配列で1回のみ実行

  const { data, loading, error } = useDashboardData(clinicId);

  const Layout = isSystemAdmin ? AdminLayout : MainLayout;

  // clinic_idが取得できない場合（医院がまだ登録されていない）
  if (!clinicId && !loading) {
    return (
      <Layout>
        <Alert severity="warning">
          表示する医院データがありません。医院アカウント管理から医院を登録してください。
        </Alert>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <Alert severity="error">
          データの取得に失敗しました。しばらくしてから再度お試しください。
        </Alert>
      </Layout>
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
  const chartData = data.trends
    .filter((trend) => trend && (trend.yearMonth || (trend as any).year_month))
    .map((trend) => {
      const yearMonth = trend.yearMonth || (trend as any).year_month;
      const totalRevenue = trend.totalRevenue ?? (trend as any).total_revenue ?? 0;
      const operatingProfit = trend.operatingProfit ?? (trend as any).operating_profit ?? 0;
      return {
        month: yearMonth.substring(5, 7) + '月',
        総売上: Math.round(totalRevenue / 10000),
        営業利益: Math.round(operatingProfit / 10000),
      };
    });

  // 患者数推移データ
  const patientChartData = data.trends
    .filter((trend) => trend && (trend.yearMonth || (trend as any).year_month))
    .map((trend) => {
      const yearMonth = trend.yearMonth || (trend as any).year_month;
      const newPatients = trend.newPatients ?? (trend as any).new_patients ?? 0;
      const returningPatients = trend.returningPatients ?? (trend as any).returning_patients ?? 0;
      return {
        month: yearMonth.substring(5, 7) + '月',
        新患: newPatients,
        既存患者: returningPatients,
      };
    });

  return (
    <Layout>
      <>
        {/* ページヘッダー */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 500, mb: 1 }}>
            経営ダッシュボード
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.lastUpdated} のデータ（データソース: {data.dataSource}）
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
                  data={data.trends.map((t) => ({
                    month: t.yearMonth.substring(5, 7) + '月',
                    稼働率: t.unitUtilization,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[60, 85]} />
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
                  data={data.trends.map((t) => ({
                    month: t.yearMonth.substring(5, 7) + '月',
                    自費率: t.selfPayRate,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[15, 22]} />
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
    </Layout>
  );
};
