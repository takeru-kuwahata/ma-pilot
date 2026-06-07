import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { supabase } from '../lib/supabase';

export const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // ハッシュ形式（#token_hash=...）とクエリパラメータ形式（?token_hash=...）の両方に対応
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const tokenHash = hashParams.get('token_hash') || queryParams.get('token_hash');
    const type = hashParams.get('type') || queryParams.get('type');

    if (tokenHash && type === 'invite') {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' }).then(({ error: verifyError }) => {
        if (verifyError) {
          setError('招待リンクが無効または期限切れです。管理者に再送を依頼してください。');
        } else {
          setReady(true);
        }
      });
    } else {
      setError('招待リンクが不正です。メール内のリンクから再度アクセスしてください。');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError('パスワードが一致しません');
      return;
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);

      // セッション取得してバックエンドのuser情報をlocalStorageに保存
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        localStorage.setItem('access_token', session.access_token);
        // user情報はバックエンドから取得
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('user', JSON.stringify(data.user ?? data));
        }
      }

      navigate('/clinic/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パスワードの設定に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 400, width: '100%' }}>
        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <Typography
            sx={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 500, color: '#424242', mb: 1 }}
          >
            MA-Pilot
          </Typography>
          <Typography
            sx={{ textAlign: 'center', fontSize: '0.95rem', color: '#555555', mb: 3 }}
          >
            招待を承認しました。
            <br />
            パスワードを設定してください。
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!ready ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={32} sx={{ color: '#FF6B35' }} />
              <Typography sx={{ mt: 2, fontSize: '0.875rem', color: '#555555' }}>
                認証情報を確認中...
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="新しいパスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                placeholder="8文字以上"
                helperText="8文字以上で入力してください"
                inputProps={{ minLength: 8, autoComplete: 'new-password' }}
                sx={{
                  '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#FF6B35' } },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' },
                }}
              />
              <TextField
                fullWidth
                label="パスワード（確認）"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                margin="normal"
                required
                placeholder="パスワードを再入力"
                inputProps={{ minLength: 8, autoComplete: 'new-password' }}
                sx={{
                  '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#FF6B35' } },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' },
                }}
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{
                  mt: 3,
                  py: 1.5,
                  fontWeight: 500,
                  fontSize: '1rem',
                  backgroundColor: '#FF6B35',
                  '&:hover': { backgroundColor: '#E55A28' },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'パスワードを設定する'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};
