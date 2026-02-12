import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * 認証チェックを行うルート保護コンポーネント
 * 未認証ユーザーは /login にリダイレクト
 */
export const PrivateRoute = () => {
  const { user, isLoading } = useAuthStore();

  console.log('[PrivateRoute] isLoading:', isLoading, 'user:', user);

  // ロード中は何も表示しない（またはスピナー表示）
  if (isLoading) {
    console.log('[PrivateRoute] Still loading...');
    return null; // TODO: ローディングスピナーを表示する場合はここに追加
  }

  // 未認証の場合は /login にリダイレクト
  if (!user) {
    console.log('[PrivateRoute] No user, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // 認証済みの場合は子ルートをレンダリング
  console.log('[PrivateRoute] User authenticated, rendering Outlet');
  return <Outlet />;
};
