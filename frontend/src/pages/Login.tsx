import { Box, Typography } from '@mui/material';

export const Login = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Typography variant="h4" gutterBottom>
        ログインページ
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Phase 4で実装予定
      </Typography>
    </Box>
  );
};
