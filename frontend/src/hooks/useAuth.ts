import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import {
  LoginFormData,
  PasswordResetFormData,
  User,
} from '../types';

export const useAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const login = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(data.email, data.password);
      setSuccessMessage('ログインしました');

      // ロールに応じたリダイレクト
      const user = response.user;
      if (user.role === 'system_admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const signup = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: signup API実装
      setSuccessMessage('アカウントを作成しました');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アカウント作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (data: PasswordResetFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.resetPassword(data.email);
      setSuccessMessage(response.message || 'リセットメールを送信しました');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'パスワードリセットに失敗しました'
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログアウトに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = (): User | null => {
    return authService.getCurrentUser();
  };

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  return {
    login,
    signup,
    resetPassword,
    logout,
    getCurrentUser,
    loading,
    error,
    successMessage,
    clearMessages,
  };
};
