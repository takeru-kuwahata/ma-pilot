import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * 認証チェックを行うルート保護コンポーネント
 * 未認証ユーザーは /login にリダイレクト
 */
export const PrivateRoute = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return null; // TODO: ローディングスピナーを表示する場合はここに追加
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
