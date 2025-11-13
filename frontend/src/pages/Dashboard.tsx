import { Grid, Typography, Box, Paper, Button, Alert } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import { Layout } from '../components/Layout';
import { KPICard } from '../components/KPICard';
import { RevenueChart } from '../components/RevenueChart';
import {
  mockMonthlyData,
  getLatestMonthData,
  getPreviousMonthData,
  calculateKPIs,
  calculateGrowthRate,
} from '../utils/mockData';

export const Dashboard = () => {
  const latestData = getLatestMonthData();
  const previousData = getPreviousMonthData();

  const latestKPIs = calculateKPIs(latestData);
  const previousKPIs = calculateKPIs(previousData);

  // 前月比成長率を計算
  const revenueGrowth = calculateGrowthRate(latestData.totalRevenue, previousData.totalRevenue);
  const profitGrowth = calculateGrowthRate(latestKPIs.profit, previousKPIs.profit);
  const patientGrowth = calculateGrowthRate(latestData.totalPatients, previousData.totalPatients);

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          経営ダッシュボード
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {latestData.yearMonth} のデータ
        </Typography>
      </Box>

      {/* アラート */}
      <Alert severity="info" sx={{ mb: 3 }}>
        売上が前月比{revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%で推移しています
        {profitGrowth < 0 && '。利益率が低下しているため、コスト管理を見直してください。'}
      </Alert>

      {/* KPIカード */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="月次売上"
            value={latestData.totalRevenue}
            unit="円"
            growthRate={revenueGrowth}
            icon={<AttachMoneyIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="月次利益"
            value={latestKPIs.profit}
            unit="円"
            growthRate={profitGrowth}
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="総患者数"
            value={latestData.totalPatients}
            unit="人"
            growthRate={patientGrowth}
            icon={<PeopleIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="診療回数"
            value={latestData.treatmentCount}
            unit="回"
            icon={<MedicalServicesIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* グラフ */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <RevenueChart data={mockMonthlyData} />
        </Grid>
      </Grid>

      {/* 収益構成 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              収益構成
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">保険診療</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {latestData.insuranceRevenue.toLocaleString()}円
                  ({((latestData.insuranceRevenue / latestData.totalRevenue) * 100).toFixed(1)}%)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">自由診療</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {latestData.selfPayRevenue.toLocaleString()}円
                  ({((latestData.selfPayRevenue / latestData.totalRevenue) * 100).toFixed(1)}%)
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              コスト構成
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">人件費</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {latestData.personnelCost.toLocaleString()}円
                  ({((latestData.personnelCost / latestData.totalRevenue) * 100).toFixed(1)}%)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">材料費</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {latestData.materialCost.toLocaleString()}円
                  ({((latestData.materialCost / latestData.totalRevenue) * 100).toFixed(1)}%)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">固定費</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {latestData.fixedCost.toLocaleString()}円
                  ({((latestData.fixedCost / latestData.totalRevenue) * 100).toFixed(1)}%)
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* クイックアクション */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          クイックアクション
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => alert('データ入力画面（Phase 4で実装）')}
          >
            月次データ入力
          </Button>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() => alert('レポート生成画面（Phase 4で実装）')}
          >
            レポート生成
          </Button>
          <Button
            variant="outlined"
            startIcon={<TrendingUpIcon />}
            onClick={() => alert('シミュレーション画面（Phase 4で実装）')}
          >
            経営シミュレーション
          </Button>
        </Box>
      </Paper>
    </Layout>
  );
};
