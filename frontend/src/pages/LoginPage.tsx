import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { useAuth, RegisterFormData } from '../hooks/useAuth';
import {
  LoginFormData,
  PasswordResetFormData,
} from '../types';

type TabType = 'login' | 'signup' | 'reset';

export const LoginPage = () => {
  const { login, signup, resetPassword, loading, error, successMessage, clearMessages } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('login');

  // ログインフォーム
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  // アカウント作成フォーム
  const [signupData, setSignupData] = useState<RegisterFormData>({
    email: '',
    password: '',
    passwordConfirm: '',
    clinic_name: '',
    slug: '',
    postal_code: '',
    address: '',
    phone_number: '',
  });
  const [loadingAddress, setLoadingAddress] = useState(false);

  const formatPostalCode = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
  };

  const handlePostalCodeChange = async (value: string) => {
    const formatted = formatPostalCode(value);
    setSignupData((prev) => ({ ...prev, postal_code: formatted }));
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 7) {
      setLoadingAddress(true);
      try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`);
        const json = await res.json();
        if (json.status === 200 && json.results?.length > 0) {
          const r = json.results[0];
          setSignupData((prev) => ({ ...prev, address: `${r.address1}${r.address2}${r.address3}` }));
        }
      } catch {
        // 住所取得失敗は無視
      } finally {
        setLoadingAddress(false);
      }
    }
  };

  // パスワードリセットフォーム
  const [resetData, setResetData] = useState<PasswordResetFormData>({
    email: '',
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabType) => {
    setActiveTab(newValue);
    clearMessages();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginData);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup(signupData);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetPassword(resetData);
  };

  return (
    <Box sx={{ maxWidth: 400, width: '100%', px: 3 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Typography
            sx={{
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 500,
              color: '#424242',
              mb: 3,
            }}
          >
            MA-Pilot
          </Typography>

          {/* エラー・成功メッセージ */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearMessages}>
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={clearMessages}>
              {successMessage}
            </Alert>
          )}

          {/* タブ切り替え（ログインとアカウント作成のみ表示） */}
          <Tabs
            value={activeTab === 'reset' ? 'login' : activeTab}
            onChange={handleTabChange}
            sx={{
              mb: 3,
              borderBottom: 1,
              borderColor: '#e0e0e0',
              '& .MuiTab-root': {
                fontSize: '1rem',
                fontWeight: 500,
                color: '#757575',
                textTransform: 'none',
                '&.Mui-selected': {
                  color: '#FF6B35',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#FF6B35',
                height: 2,
              },
            }}
            variant="fullWidth"
          >
            <Tab label="ログイン" value="login" />
            <Tab label="アカウント作成" value="signup" />
          </Tabs>

          {/* ログインタブ */}
          {activeTab === 'login' && (
            <Box
              component="form"
              onSubmit={handleLoginSubmit}
              id="login-form"
              autoComplete="on"
              method="post"
              action="#"
            >
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                name="email"
                id="email"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                margin="normal"
                required
                placeholder="your@email.com"
                autoComplete="email"
                inputProps={{ autoComplete: 'email' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF6B35',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FF6B35',
                  },
                }}
              />
              <TextField
                fullWidth
                label="パスワード"
                type="password"
                name="password"
                id="password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                margin="normal"
                required
                placeholder="パスワードを入力"
                autoComplete="current-password"
                inputProps={{ autoComplete: 'current-password' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF6B35',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FF6B35',
                  },
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
                  '&:hover': {
                    backgroundColor: '#E55A28',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'ログイン'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('reset')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '0.875rem',
                    color: '#FF6B35',
                    textDecoration: 'none',
                    fontWeight: 400,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  パスワードを忘れた場合
                </button>
              </Box>
            </Box>
          )}

          {/* アカウント作成タブ */}
          {activeTab === 'signup' && (
            <Box component="form" onSubmit={handleSignupSubmit}>
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                margin="normal"
                required
                placeholder="your@email.com"
                autoComplete="email"
                inputProps={{ autoComplete: 'email' }}
                sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#FF6B35' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' } }}
              />
              <TextField
                fullWidth
                label="パスワード"
                type="password"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                margin="normal"
                required
                placeholder="8文字以上"
                inputProps={{ minLength: 8, autoComplete: 'new-password' }}
                sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#FF6B35' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' } }}
              />
              <TextField
                fullWidth
                label="パスワード（確認）"
                type="password"
                value={signupData.passwordConfirm}
                onChange={(e) => setSignupData({ ...signupData, passwordConfirm: e.target.value })}
                margin="normal"
                required
                placeholder="パスワードを再入力"
                inputProps={{ minLength: 8, autoComplete: 'new-password' }}
                sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#FF6B35' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' } }}
              />
              <Box sx={{ mt: 2, mb: 1, borderTop: '1px solid #e0e0e0', pt: 2 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 1 }}>医院情報</Typography>
              </Box>
              <TextField
                fullWidth
                label="医院名"
                value={signupData.clinic_name}
                onChange={(e) => setSignupData({ ...signupData, clinic_name: e.target.value })}
                margin="normal"
                required
                placeholder="〇〇歯科クリニック"
                sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#FF6B35' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' } }}
              />
              <TextField
                fullWidth
                label="スラッグ（URL識別子）"
                value={signupData.slug}
                onChange={(e) => setSignupData({ ...signupData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                margin="normal"
                placeholder="例: yamada-dental（半角英小文字・数字・ハイフン）"
                helperText="後から医院設定で変更できます"
                sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#FF6B35' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' } }}
              />
              <TextField
                fullWidth
                label="郵便番号"
                value={signupData.postal_code}
                onChange={(e) => handlePostalCodeChange(e.target.value)}
                margin="normal"
                required
                placeholder="000-0000"
                inputProps={{ maxLength: 8 }}
                helperText="7桁入力すると住所を自動取得します"
                sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#FF6B35' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' } }}
              />
              <TextField
                fullWidth
                label="住所"
                value={signupData.address}
                onChange={(e) => setSignupData({ ...signupData, address: e.target.value })}
                margin="normal"
                required
                placeholder="郵便番号から自動入力後、番地以降を追記してください"
                disabled={loadingAddress}
                helperText={loadingAddress ? '住所を取得中...' : ''}
                sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#FF6B35' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' } }}
              />
              <TextField
                fullWidth
                label="電話番号"
                value={signupData.phone_number}
                onChange={(e) => setSignupData({ ...signupData, phone_number: e.target.value })}
                margin="normal"
                required
                placeholder="03-1234-5678"
                sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#FF6B35' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' } }}
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{ mt: 3, py: 1.5, fontWeight: 500, fontSize: '1rem', backgroundColor: '#FF6B35', '&:hover': { backgroundColor: '#E55A28' } }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'アカウント作成'}
              </Button>
            </Box>
          )}

          {/* パスワードリセットタブ */}
          {activeTab === 'reset' && (
            <Box>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: '#666',
                  mb: 2,
                  lineHeight: 1.5,
                }}
              >
                ご登録のメールアドレスにパスワードリセット用のリンクを送信します。
              </Typography>

              <Box component="form" onSubmit={handleResetSubmit}>
                <TextField
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  value={resetData.email}
                  onChange={(e) =>
                    setResetData({ ...resetData, email: e.target.value })
                  }
                  margin="normal"
                  required
                  placeholder="your@email.com"
                  inputProps={{ autoComplete: 'email' }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF6B35',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#FF6B35',
                    },
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
                    '&:hover': {
                      backgroundColor: '#E55A28',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'リセットメールを送信'
                  )}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '0.875rem',
                      color: '#FF6B35',
                      textDecoration: 'none',
                      fontWeight: 400,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    ログインに戻る
                  </button>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
    </Box>
  );
};

export default LoginPage;
