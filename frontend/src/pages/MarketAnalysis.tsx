import { Box, Typography, Paper } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import { Layout } from '../components/Layout';

export const MarketAnalysis = () => {
  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          診療圏分析
        </Typography>
        <Typography variant="body2" color="text.secondary">
          地図表示、人口統計、競合歯科医院検索、商圏レポート
        </Typography>
      </Box>

      <Paper sx={{ p: 3, textAlign: 'center', minHeight: 400 }}>
        <MapIcon sx={{ fontSize: 100, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          診療圏分析機能
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Phase 4で以下の機能を実装予定:
        </Typography>
        <Box sx={{ mt: 2, textAlign: 'left', maxWidth: 600, mx: 'auto' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Google Maps連携による地図表示
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • 診療圏（半径1km/3km/5km）の可視化
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • e-Stat APIによる人口統計取得
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • 競合歯科医院の検索・表示
          </Typography>
          <Typography variant="body2">
            • 潜在患者数・市場シェアの推定
          </Typography>
        </Box>
      </Paper>
    </Layout>
  );
};
