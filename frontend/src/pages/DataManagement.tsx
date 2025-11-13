import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Layout } from '../components/Layout';

export const DataManagement = () => {
  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          基礎データ管理
        </Typography>
        <Typography variant="body2" color="text.secondary">
          月次データの入力・編集、CSVインポート
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, textAlign: 'center', minHeight: 200 }}>
            <AddIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              月次データ入力
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              売上、コスト、患者数などの月次データを手動で入力
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              新規データ入力
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, textAlign: 'center', minHeight: 200 }}>
            <UploadFileIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              CSV一括取込
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Lステップなどから出力したCSVファイルを一括取込
            </Typography>
            <Button variant="outlined" startIcon={<UploadFileIcon />}>
              CSVファイル選択
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              登録済みデータ一覧
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phase 4で月次データの一覧表示・編集機能を実装予定
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};
