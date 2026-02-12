import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import BlockIcon from '@mui/icons-material/Block';

/**
 * 403 Forbidden エラーページ
 * 権限不足でアクセスできないページを表示
 */
export const Forbidden = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleGoHome = () => {
    // ユーザーのロールに応じたホームページへ遷移
    const homePath = user?.role === 'system_admin'
      ? '/admin/dashboard'
      : '/clinic/dashboard';
    navigate(homePath);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
        textAlign: 'center',
      }}
    >
      <BlockIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
      <Typography variant="h3" gutterBottom>
        403 - アクセス権限がありません
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
        このページにアクセスする権限がありません。
        必要な権限については、管理者にお問い合わせください。
      </Typography>
      <Button variant="contained" onClick={handleGoHome} size="large">
        ホームに戻る
      </Button>
    </Box>
  );
};
