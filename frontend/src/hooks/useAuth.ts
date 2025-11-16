import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/mock/AuthService';
import {
  LoginFormData,
  SignupFormData,
  PasswordResetFormData,
  User,
} from '../types';

const authService = new AuthService();

export const useAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const login = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(data);
      setSuccessMessage(response.message || 'ログインしました');

      // ロールに応じたリダイレクト
      const user = response.data;
      if (user.role === 'system_admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.signup(data);
      setSuccessMessage(response.message || 'アカウントを作成しました');

      // 自動ログイン後にダッシュボードへ
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
      const response = await authService.resetPassword(data);
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
