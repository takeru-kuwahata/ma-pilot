import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Switch,
  Alert,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  DeleteForever as DeleteForeverIcon,
  CleaningServices as CleaningServicesIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { AdminLayout } from '../../layouts/AdminLayout';

// @MOCK_TO_API: API設定の型定義
interface ApiSettings {
  eStatKey: string;
  resasKey: string;
  googleMapsKey: string;
  supabaseUrl: string;
}

// @MOCK_TO_API: メール設定の型定義
interface EmailSettings {
  smtpServer: string;
  smtpPort: number;
  fromEmail: string;
  fromName: string;
}

// @MOCK_TO_API: システム設定の型定義
interface SystemSettings {
  requireApproval: boolean;
  trialPeriod: number;
  dataRetention: number;
  autoBackup: boolean;
  maintenanceMode: boolean;
}

export const AdminSettings = () => {
  // @MOCK_TO_API: モックデータ
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    eStatKey: '********************************',
    resasKey: '********************************',
    googleMapsKey: '********************************',
    supabaseUrl: 'https://your-project.supabase.co',
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpServer: 'smtp.example.com',
    smtpPort: 587,
    fromEmail: 'noreply@ma-pilot.com',
    fromName: 'MA-Pilot System',
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    requireApproval: true,
    trialPeriod: 30,
    dataRetention: 36,
    autoBackup: true,
    maintenanceMode: false,
  });

  const handleSaveApiSettings = () => {
    // TODO: Phase 4でAPI呼び出し実装
    console.log('Save API settings:', apiSettings);
  };

  const handleTestConnection = () => {
    // TODO: Phase 4でAPI接続テスト実装
    console.log('Test API connection');
  };

  const handleSaveEmailSettings = () => {
    // TODO: Phase 4でAPI呼び出し実装
    console.log('Save email settings:', emailSettings);
  };

  const handleSendTestEmail = () => {
    // TODO: Phase 4でテストメール送信実装
    console.log('Send test email');
  };

  const handleSaveSystemSettings = () => {
    // TODO: Phase 4でAPI呼び出し実装
    console.log('Save system settings:', systemSettings);
  };

  const handleExportData = (dataType: string) => {
    // TODO: Phase 4でデータエクスポート実装
    console.log('Export data:', dataType);
  };

  const handleDeleteInactiveClinics = () => {
    // TODO: Phase 4で削除処理実装（確認ダイアログ付き）
    console.log('Delete inactive clinics');
  };

  const handleDeleteOldLogs = () => {
    // TODO: Phase 4で削除処理実装（確認ダイアログ付き）
    console.log('Delete old logs');
  };

  return (
    <AdminLayout>
      {/* ページヘッダー */}
      <Box sx={{ marginBottom: '24px' }}>
        <Typography
          variant="h4"
          sx={{
            fontSize: '32px',
            fontWeight: 500,
            marginBottom: '8px',
          }}
        >
          システム設定
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#616161',
            fontSize: '14px',
          }}
        >
          外部API設定、メール設定、システム全般の設定
        </Typography>
      </Box>

      {/* 外部API設定 */}
      <Paper
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          marginBottom: '24px',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          外部API設定
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
          }}
        >
          <TextField
            label="e-Stat APIキー"
            fullWidth
            value={apiSettings.eStatKey}
            onChange={(e) => setApiSettings({ ...apiSettings, eStatKey: e.target.value })}
            helperText="人口統計データ取得に使用"
          />
          <TextField
            label="RESAS APIキー"
            fullWidth
            value={apiSettings.resasKey}
            onChange={(e) => setApiSettings({ ...apiSettings, resasKey: e.target.value })}
            helperText="地域経済データ取得に使用"
          />
          <TextField
            label="Google Maps APIキー"
            fullWidth
            value={apiSettings.googleMapsKey}
            onChange={(e) =>
              setApiSettings({ ...apiSettings, googleMapsKey: e.target.value })
            }
            helperText="地図表示・位置情報検索に使用"
          />
          <TextField
            label="Supabase URL"
            fullWidth
            value={apiSettings.supabaseUrl}
            onChange={(e) =>
              setApiSettings({ ...apiSettings, supabaseUrl: e.target.value })
            }
            helperText="データベース接続に使用"
          />
        </Box>
        <Box sx={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
          <Button
            variant="contained"
            onClick={handleSaveApiSettings}
            sx={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
              backgroundColor: '#FF6B35',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#E55A2B',
              },
            }}
          >
            <SaveIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
            保存する
          </Button>
          <Button
            variant="outlined"
            onClick={handleTestConnection}
            sx={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
            }}
          >
            <RefreshIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
            接続テスト
          </Button>
        </Box>
      </Paper>

      {/* メール設定 */}
      <Paper
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          marginBottom: '24px',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          メール設定
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
          }}
        >
          <TextField
            label="SMTPサーバー"
            fullWidth
            value={emailSettings.smtpServer}
            onChange={(e) =>
              setEmailSettings({ ...emailSettings, smtpServer: e.target.value })
            }
          />
          <TextField
            label="SMTPポート"
            type="number"
            fullWidth
            value={emailSettings.smtpPort}
            onChange={(e) =>
              setEmailSettings({ ...emailSettings, smtpPort: Number(e.target.value) })
            }
            placeholder="587"
          />
          <TextField
            label="送信元メールアドレス"
            type="email"
            fullWidth
            value={emailSettings.fromEmail}
            onChange={(e) =>
              setEmailSettings({ ...emailSettings, fromEmail: e.target.value })
            }
            placeholder="example@example.com"
          />
          <TextField
            label="送信元名"
            fullWidth
            value={emailSettings.fromName}
            onChange={(e) =>
              setEmailSettings({ ...emailSettings, fromName: e.target.value })
            }
          />
        </Box>
        <Box sx={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
          <Button
            variant="contained"
            onClick={handleSaveEmailSettings}
            sx={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
              backgroundColor: '#FF6B35',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#E55A2B',
              },
            }}
          >
            <SaveIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
            保存する
          </Button>
          <Button
            variant="outlined"
            onClick={handleSendTestEmail}
            sx={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
            }}
          >
            <SendIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
            テストメール送信
          </Button>
        </Box>
      </Paper>

      {/* システム全般設定 */}
      <Paper
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          marginBottom: '24px',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          システム全般設定
        </Typography>

        <Box sx={{ paddingY: '16px', borderBottom: '1px solid #e0e0e0' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                新規医院登録の承認
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#616161' }}>
                新規医院登録時に管理者承認を必須にする
              </Typography>
            </Box>
            <Switch
              checked={systemSettings.requireApproval}
              onChange={(e) =>
                setSystemSettings({ ...systemSettings, requireApproval: e.target.checked })
              }
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#4CAF50',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#4CAF50',
                },
              }}
            />
          </Box>
        </Box>

        <Box sx={{ paddingY: '16px', borderBottom: '1px solid #e0e0e0' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                トライアル期間
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#616161' }}>
                新規登録時のトライアル期間を設定（日数）
              </Typography>
            </Box>
            <TextField
              type="number"
              value={systemSettings.trialPeriod}
              onChange={(e) =>
                setSystemSettings({ ...systemSettings, trialPeriod: Number(e.target.value) })
              }
              sx={{ width: '100px' }}
            />
          </Box>
        </Box>

        <Box sx={{ paddingY: '16px', borderBottom: '1px solid #e0e0e0' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                データ保持期間
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#616161' }}>
                月次データの保持期間を設定（月数）
              </Typography>
            </Box>
            <TextField
              type="number"
              value={systemSettings.dataRetention}
              onChange={(e) =>
                setSystemSettings({
                  ...systemSettings,
                  dataRetention: Number(e.target.value),
                })
              }
              sx={{ width: '100px' }}
            />
          </Box>
        </Box>

        <Box sx={{ paddingY: '16px', borderBottom: '1px solid #e0e0e0' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                自動バックアップ
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#616161' }}>
                毎日午前2時にデータベースの自動バックアップを実行
              </Typography>
            </Box>
            <Switch
              checked={systemSettings.autoBackup}
              onChange={(e) =>
                setSystemSettings({ ...systemSettings, autoBackup: e.target.checked })
              }
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#4CAF50',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#4CAF50',
                },
              }}
            />
          </Box>
        </Box>

        <Box sx={{ paddingY: '16px' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                メンテナンスモード
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#616161' }}>
                システムメンテナンス中は一般ユーザーのアクセスを制限
              </Typography>
            </Box>
            <Switch
              checked={systemSettings.maintenanceMode}
              onChange={(e) =>
                setSystemSettings({
                  ...systemSettings,
                  maintenanceMode: e.target.checked,
                })
              }
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#4CAF50',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#4CAF50',
                },
              }}
            />
          </Box>
        </Box>

        <Box sx={{ marginTop: '24px' }}>
          <Button
            variant="contained"
            onClick={handleSaveSystemSettings}
            sx={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
              backgroundColor: '#FF6B35',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#E55A2B',
              },
            }}
          >
            <SaveIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
            設定を保存
          </Button>
        </Box>
      </Paper>

      {/* データ管理 */}
      <Paper
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          データ管理
        </Typography>

        <Alert
          icon={<WarningIcon />}
          severity="warning"
          sx={{
            marginBottom: '24px',
            backgroundColor: '#FFF3E0',
            color: '#424242',
            '& .MuiAlert-icon': {
              color: '#FF6B35',
            },
          }}
        >
          <Typography sx={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            データエクスポート
          </Typography>
          <Typography sx={{ fontSize: '14px' }}>
            全医院のデータをCSV形式でエクスポートできます。機密情報を含むため、取り扱いには十分注意してください。
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <Button
            variant="outlined"
            onClick={() => handleExportData('clinics')}
            sx={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
            }}
          >
            <DownloadIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
            全医院データをエクスポート
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleExportData('monthly')}
            sx={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
            }}
          >
            <DownloadIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
            月次データをエクスポート
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleExportData('users')}
            sx={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
            }}
          >
            <DownloadIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
            ユーザーデータをエクスポート
          </Button>
        </Box>

        <Divider sx={{ marginY: '24px' }} />

        <Alert
          icon={<ErrorIcon />}
          severity="error"
          sx={{
            marginBottom: '24px',
            backgroundColor: '#FFEBEE',
            color: '#424242',
            '& .MuiAlert-icon': {
              color: '#F44336',
            },
          }}
        >
          <Typography sx={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            危険な操作
          </Typography>
          <Typography sx={{ fontSize: '14px' }}>
            以下の操作は取り消しができません。実行前に必ずバックアップを取得してください。
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: '16px' }}>
          <Button
            variant="contained"
            onClick={handleDeleteInactiveClinics}
            sx={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
              backgroundColor: '#F44336',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#D32F2F',
              },
            }}
          >
            <DeleteForeverIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
            停止中医院のデータを削除
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteOldLogs}
            sx={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
              backgroundColor: '#F44336',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#D32F2F',
              },
            }}
          >
            <CleaningServicesIcon sx={{ fontSize: '20px', marginRight: '8px' }} />
            古いログを削除（90日以上前）
          </Button>
        </Box>

        <Divider sx={{ marginY: '24px' }} />

        {/* システム情報 */}
        <Typography
          variant="h6"
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          システム情報
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '14px', color: '#616161', marginBottom: '4px' }}>
              システムバージョン
            </Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>v1.0.0</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '14px', color: '#616161', marginBottom: '4px' }}>
              最終アップデート
            </Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>
              2025-11-15 10:00
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '14px', color: '#616161', marginBottom: '4px' }}>
              データベース容量
            </Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>
              234 MB / 500 MB
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '14px', color: '#616161', marginBottom: '4px' }}>
              アクティブ接続数
            </Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>12 / 100</Typography>
          </Box>
        </Box>
      </Paper>
    </AdminLayout>
  );
};
