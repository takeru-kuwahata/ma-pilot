import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Alert,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { API_BASE_URL, getAuthHeaders, handleResponse } from '../../services/api/config';

export const AdminSettings = () => {
  // 印刷物注文メール受信先
  const [printOrderEmail, setPrintOrderEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response) as { settings: Record<string, string> };
      setPrintOrderEmail(data.settings.print_order_email || 'dr@medical-advance.com');
    } catch (error) {
      console.error('Failed to load settings:', error);
      setPrintOrderEmail('dr@medical-advance.com');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!printOrderEmail.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ print_order_email: printOrderEmail.trim() }),
      }).then(handleResponse);
      setMessage('設定を保存しました');
    } catch (e) {
      setMessage(`エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
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
          システム全体に関する設定を管理
        </Typography>
      </Box>

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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="印刷物注文メール受信先"
            type="email"
            value={printOrderEmail}
            onChange={(e) => setPrintOrderEmail(e.target.value)}
            fullWidth
            placeholder="例：dr@medical-advance.com"
            helperText="印刷物注文時にこのアドレスへ通知メールが送信されます（システム全体で共通）"
          />

          {message && (
            <Alert severity={message.startsWith('エラー') ? 'error' : 'success'}>
              {message}
            </Alert>
          )}

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !printOrderEmail.trim()}
            sx={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
              backgroundColor: '#FF6B35',
              color: '#ffffff',
              alignSelf: 'flex-start',
              '&:hover': {
                backgroundColor: '#E55A2B',
              },
            }}
            startIcon={saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <SaveIcon />}
          >
            {saving ? '保存中...' : '保存する'}
          </Button>
        </Box>
      </Paper>

      {/* 将来の拡張セクション（準備中） */}
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

        <Alert severity="info">
          以下の機能は将来のバージョンで実装予定です：
          <ul style={{ marginTop: '8px', marginBottom: '0' }}>
            <li>メンテナンスモード</li>
            <li>新規登録承認制</li>
            <li>トライアル期間設定</li>
          </ul>
        </Alert>
      </Paper>

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

        <Alert severity="info">
          以下の機能は将来のバージョンで実装予定です：
          <ul style={{ marginTop: '8px', marginBottom: '0' }}>
            <li>データエクスポート（CSV形式）</li>
            <li>データ保持期間設定</li>
            <li>古いデータの自動削除</li>
          </ul>
        </Alert>
      </Paper>
    </>
  );
};
