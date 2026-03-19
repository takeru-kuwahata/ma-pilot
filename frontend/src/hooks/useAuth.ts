import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import {
  LoginFormData,
  PasswordResetFormData,
  User,
} from '../types';

export interface RegisterFormData {
  email: string;
  password: string;
  passwordConfirm: string;
  clinic_name: string;
  slug: string;
  postal_code: string;
  address: string;
  phone_number: string;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const login = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(data.email, data.password);

      console.log('[useAuth] Login response:', response.user);

      // authStoreを更新
      setUser(response.user);

      console.log('[useAuth] setUser called with:', response.user);

      setSuccessMessage('ログインしました');

      // ロールに応じたリダイレクト
      const user = response.user;
      console.log('[useAuth] Navigating to:', user.role === 'system_admin' ? '/admin/dashboard' : '/clinic/dashboard');

      if (user.role === 'system_admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/clinic/dashboard');
      }
    } catch (err) {
      console.error('[useAuth] Login error:', err);
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (data.password !== data.passwordConfirm) {
        setError('パスワードが一致しません');
        return;
      }

      const result = await authService.register({
        email: data.email,
        password: data.password,
        clinic_name: data.clinic_name,
        slug: data.slug || undefined,
        postal_code: data.postal_code,
        address: data.address,
        phone_number: data.phone_number,
      });

      setSuccessMessage(result.message);
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
