import { Box, Typography, Paper, Button, Grid } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import { Layout } from '../components/Layout';

export const Reports = () => {
  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          レポート生成・管理
        </Typography>
        <Typography variant="body2" color="text.secondary">
          テンプレート選択、PDF/CSV生成、履歴管理
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', minHeight: 250 }}>
            <DescriptionIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              月次レポート
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              月次経営データのサマリーレポート
            </Typography>
            <Button variant="contained" fullWidth>
              生成
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', minHeight: 250 }}>
            <PictureAsPdfIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              年次レポート
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              年間の経営分析レポート
            </Typography>
            <Button variant="contained" fullWidth>
              生成
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', minHeight: 250 }}>
            <TableChartIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              診療圏分析レポート
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              商圏分析結果のレポート
            </Typography>
            <Button variant="contained" fullWidth>
              生成
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              レポート履歴
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phase 4で生成済みレポートの一覧表示・ダウンロード機能を実装予定
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};
