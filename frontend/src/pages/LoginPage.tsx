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
import { PublicLayout } from '../layouts/PublicLayout';
import { useAuth } from '../hooks/useAuth';
import {
  LoginFormData,
  SignupFormData,
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
  const [signupData, setSignupData] = useState<SignupFormData>({
    inviteToken: '',
    password: '',
    passwordConfirm: '',
  });

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
    await signup();
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetPassword(resetData);
  };

  return (
    <PublicLayout>
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
            <Box component="form" onSubmit={handleLoginSubmit}>
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                margin="normal"
                required
                placeholder="your@email.com"
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
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                margin="normal"
                required
                placeholder="パスワードを入力"
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
            <Box>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: '#666',
                  mb: 2,
                  lineHeight: 1.5,
                }}
              >
                招待メールに記載されているリンクからアカウント作成を行ってください。
              </Typography>

              <Box component="form" onSubmit={handleSignupSubmit}>
                <TextField
                  fullWidth
                  label="招待トークン"
                  type="text"
                  value={signupData.inviteToken}
                  onChange={(e) =>
                    setSignupData({ ...signupData, inviteToken: e.target.value })
                  }
                  margin="normal"
                  required
                  placeholder="招待メールのトークンを入力"
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
                  value={signupData.password}
                  onChange={(e) =>
                    setSignupData({ ...signupData, password: e.target.value })
                  }
                  margin="normal"
                  required
                  inputProps={{ minLength: 8 }}
                  placeholder="8文字以上のパスワード"
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
                  label="パスワード（確認）"
                  type="password"
                  value={signupData.passwordConfirm}
                  onChange={(e) =>
                    setSignupData({
                      ...signupData,
                      passwordConfirm: e.target.value,
                    })
                  }
                  margin="normal"
                  required
                  inputProps={{ minLength: 8 }}
                  placeholder="パスワードを再入力"
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
                    'アカウント作成'
                  )}
                </Button>
              </Box>
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
    </PublicLayout>
  );
};

export default LoginPage;
