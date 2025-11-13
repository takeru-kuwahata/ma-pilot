import { Box, Typography } from '@mui/material';

export const Dashboard = () => {
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
        経営ダッシュボード
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Phase 4で実装予定
      </Typography>
    </Box>
  );
};
