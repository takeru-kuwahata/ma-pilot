import { MenuItemConfig, UserRole } from '../types';

/**
 * ユーザーの権限に応じてメニュー項目をフィルタリング
 * @param menuItems メニュー項目の配列
 * @param userRole ユーザーの権限
 * @returns フィルタリングされたメニュー項目
 */
export const filterMenuByRole = (
  menuItems: MenuItemConfig[],
  userRole: UserRole
): MenuItemConfig[] => {
  return menuItems.filter(item => {
    // rolesが未指定の場合は全ロールに表示
    if (!item.roles || item.roles.length === 0) {
      return true;
    }

    // 指定されたrolesにユーザーのロールが含まれているかチェック
    return item.roles.includes(userRole);
  });
};
