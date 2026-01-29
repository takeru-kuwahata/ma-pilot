import { ReactNode } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { AdminLayout } from '../layouts/AdminLayout';

/**
 * ユーザーロールに応じて適切なLayoutコンポーネントを返すカスタムフック
 * システム管理者の場合はAdminLayout、それ以外はMainLayoutを使用
 */
export const useLayout = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSystemAdmin = user?.role === 'system_admin';

  const Layout = ({ children }: { children: ReactNode }) => {
    const LayoutComponent = isSystemAdmin ? AdminLayout : MainLayout;
    return <LayoutComponent>{children}</LayoutComponent>;
  };

  return { Layout, isSystemAdmin };
};
