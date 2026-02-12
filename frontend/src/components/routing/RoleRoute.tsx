import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

/**
 * 権限チェックを行うルート保護コンポーネント
 * 権限不足の場合は適切なページへリダイレクト
 */
export const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { user, isLoading } = useAuthStore();

  // ロード中は何も表示しない
  if (isLoading) {
    return null;
  }

  // 未認証の場合は /login にリダイレクト
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 権限チェック
  if (!allowedRoles.includes(user.role)) {
    // 権限不足の場合、ユーザーのロールに応じたデフォルトページへリダイレクト
    const redirectPath = user.role === 'system_admin'
      ? '/admin/dashboard'
      : '/clinic/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // 権限OKの場合は子ルートをレンダリング
  return <Outlet />;
};
