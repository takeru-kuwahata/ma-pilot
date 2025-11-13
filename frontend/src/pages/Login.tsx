import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Divider,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: Phase 4で認証機能実装
    // モックログイン: ダッシュボードに遷移
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FF6B35 0%, #FF9800 100%)',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 3,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            MA-Lstep
          </Typography>
          <Typography variant="body2" color="text.secondary">
            歯科医院経営分析システム
          </Typography>
        </Box>

        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <TextField
            fullWidth
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            sx={{ mt: 3, mb: 2 }}
          >
            ログイン
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Link href="#" variant="body2" sx={{ mr: 2 }}>
              パスワードを忘れた方
            </Link>
          </Box>

          <Divider sx={{ my: 3 }}>または</Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => alert('アカウント作成機能（Phase 4で実装）')}
          >
            アカウント作成
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
