import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { announce } from '../utils/announcer';

export const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: Phase 4で認証機能実装
    // モックログイン: ダッシュボードに遷移
    announce(t('auth.login_success'), 'polite');
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
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }} component="h1">
            MA-Lstep
          </Typography>
          <Typography variant="body2" color="text.secondary">
            歯科医院経営分析システム
          </Typography>
        </Box>

        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }} aria-label={t('auth.login_title')}>
          <TextField
            fullWidth
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            inputProps={{
              'aria-label': t('auth.email'),
              'aria-required': 'true',
            }}
          />
          <TextField
            fullWidth
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            inputProps={{
              'aria-label': t('auth.password'),
              'aria-required': 'true',
            }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            sx={{ mt: 3, mb: 2 }}
            aria-label={t('auth.login_button')}
          >
            {t('auth.login_button')}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => alert('パスワードリセット機能（Phase 4で実装）')}
              aria-label={t('auth.forgot_password')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '0.875rem',
                color: '#1976d2',
                textDecoration: 'underline',
                cursor: 'pointer',
                marginRight: '16px',
              }}
            >
              {t('auth.forgot_password')}
            </button>
          </Box>

          <Divider sx={{ my: 3 }}>または</Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => alert('アカウント作成機能（Phase 4で実装）')}
            aria-label="アカウント作成"
          >
            アカウント作成
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
