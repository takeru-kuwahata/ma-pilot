import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Layout } from '../components/Layout';

export const Settings = () => {
  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          医院設定・スタッフ管理
        </Typography>
        <Typography variant="body2" color="text.secondary">
          医院情報編集、スタッフ招待・権限管理
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, minHeight: 250 }}>
            <BusinessIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              医院情報
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              医院名、住所、電話番号などの基本情報を管理
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>医院名:</strong> サンプル歯科クリニック
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>住所:</strong> 東京都渋谷区...
              </Typography>
              <Typography variant="body2">
                <strong>電話番号:</strong> 03-XXXX-XXXX
              </Typography>
            </Box>
            <Button variant="outlined" sx={{ mt: 2 }}>
              編集
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, minHeight: 250 }}>
            <PeopleIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              スタッフ管理
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              スタッフの招待、権限設定、削除
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              現在のスタッフ: 5名
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              • オーナー: 1名<br />
              • 編集者: 2名<br />
              • 閲覧者: 2名
            </Typography>
            <Button variant="contained" startIcon={<PersonAddIcon />}>
              スタッフ招待
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              スタッフ一覧
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phase 4でスタッフ一覧表示・権限変更・削除機能を実装予定
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};
