import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import { API_BASE_URL, getAuthHeaders, handleResponse } from '../../services/api/config';
import { useAuthStore } from '../../stores/authStore';

export const AdminMySettings = () => {
  const { user, setUser } = useAuthStore();

  // 名前変更
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  // パスワード変更
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true);
    setNameMsg('');
    try {
      await fetch(`${API_BASE_URL}/api/my/display-name`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ display_name: displayName.trim() }),
      }).then(handleResponse);
      if (user) setUser({ ...user, display_name: displayName.trim() });
      setNameMsg('名前を更新しました');
    } catch (e) {
      setNameMsg(`エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 6) {
      setPwMsg('パスワードは6文字以上で入力してください');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg('パスワードが一致しません');
      return;
    }
    setSavingPw(true);
    setPwMsg('');
    try {
      await fetch(`${API_BASE_URL}/api/my/password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ new_password: newPassword }),
      }).then(handleResponse);
      setNewPassword('');
      setConfirmPassword('');
      setPwMsg('パスワードを更新しました');
    } catch (e) {
      setPwMsg(`エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <Box sx={{ marginBottom: '24px' }}>
        <Typography variant="h4" sx={{ fontSize: '32px', fontWeight: 500, marginBottom: '8px' }}>
          マイページ設定
        </Typography>
        <Typography variant="body2" sx={{ color: '#616161', fontSize: '14px' }}>
          {user?.email}
        </Typography>
      </Box>

      <Paper sx={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', maxWidth: 480 }}>
        {/* 名前変更 */}
        <Typography sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          表示名の変更
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="表示名"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
            placeholder="例：桑畑健"
          />
          {nameMsg && (
            <Typography sx={{ fontSize: '13px', color: nameMsg.startsWith('エラー') ? '#F44336' : '#4CAF50' }}>
              {nameMsg}
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={handleSaveName}
            disabled={savingName || !displayName.trim()}
            sx={{ backgroundColor: '#FF6B35', '&:hover': { backgroundColor: '#E55A2B' }, alignSelf: 'flex-start' }}
            startIcon={savingName ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
          >
            {savingName ? '保存中...' : '保存する'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* パスワード変更 */}
        <Typography sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          パスワードの変更
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="新しいパスワード"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            placeholder="6文字以上"
          />
          <TextField
            label="新しいパスワード（確認）"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
          />
          {pwMsg && (
            <Typography sx={{ fontSize: '13px', color: pwMsg.startsWith('エラー') || pwMsg.includes('一致') || pwMsg.includes('文字') ? '#F44336' : '#4CAF50' }}>
              {pwMsg}
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={handleSavePassword}
            disabled={savingPw || !newPassword}
            sx={{ backgroundColor: '#FF6B35', '&:hover': { backgroundColor: '#E55A2B' }, alignSelf: 'flex-start' }}
            startIcon={savingPw ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
          >
            {savingPw ? '変更中...' : 'パスワードを変更する'}
          </Button>
        </Box>
      </Paper>
    </>
  );
};
