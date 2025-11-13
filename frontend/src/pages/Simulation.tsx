import { Box, Typography, Paper, Button } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Layout } from '../components/Layout';

export const Simulation = () => {
  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          経営シミュレーション
        </Typography>
        <Typography variant="body2" color="text.secondary">
          目標設定、逆算計算、戦略提案、履歴管理
        </Typography>
      </Box>

      <Paper sx={{ p: 3, textAlign: 'center', minHeight: 400 }}>
        <TrendingUpIcon sx={{ fontSize: 100, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          経営シミュレーション機能
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Phase 4で以下の機能を実装予定:
        </Typography>
        <Box sx={{ textAlign: 'left', maxWidth: 600, mx: 'auto', mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • 目標売上・利益の設定
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • 必要患者数・診療回数の逆算計算
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • 実現可能性の自動評価
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • 戦略提案（患者単価向上、新患獲得など）
          </Typography>
          <Typography variant="body2">
            • シミュレーション履歴の保存・比較
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<TrendingUpIcon />}>
          新規シミュレーション作成
        </Button>
      </Paper>
    </Layout>
  );
};
