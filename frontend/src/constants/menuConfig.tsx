import { MenuItemConfig } from '../types';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DescriptionIcon from '@mui/icons-material/Description';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

// 医院エリア用メニュー
export const clinicMenuItems: MenuItemConfig[] = [
  {
    path: '/clinic/dashboard',
    label: 'ダッシュボード',
    icon: <DashboardIcon />,
    // roles未指定 = 全ロール
  },
  {
    path: '/clinic/data-management',
    label: '基礎データ管理',
    icon: <EditNoteIcon />,
    roles: ['clinic_owner', 'clinic_editor', 'system_admin'],
  },
  {
    path: '/clinic/market-analysis',
    label: '診療圏分析',
    icon: <LocationOnIcon />,
    // roles未指定 = 全ロール
  },
  {
    path: '/clinic/simulation',
    label: '経営シミュレーション',
    icon: <TrendingUpIcon />,
    roles: ['clinic_owner', 'clinic_editor', 'system_admin'],
  },
  {
    path: '/clinic/reports',
    label: 'レポート管理',
    icon: <DescriptionIcon />,
    // roles未指定 = 全ロール
  },
  {
    path: '/clinic/print-order',
    label: '印刷物発注',
    icon: <PrintIcon />,
    // roles未指定 = 全ロール（clinic_viewerも発注可能）
  },
  {
    path: '/clinic/print-order-history',
    label: '印刷物発注履歴',
    icon: <PrintIcon />,
    // roles未指定 = 全ロール
  },
  {
    path: '/clinic/settings',
    label: '医院設定',
    icon: <SettingsIcon />,
    roles: ['clinic_owner', 'system_admin'],
  },
  {
    path: '/clinic/staff',
    label: 'スタッフ管理',
    icon: <PeopleIcon />,
    roles: ['clinic_owner', 'system_admin'],
  },
];

// 運営者エリア用メニュー
export const adminMenuItems: MenuItemConfig[] = [
  {
    path: '/admin/dashboard',
    label: '管理ダッシュボード',
    icon: <DashboardIcon />,
    roles: ['system_admin'],
  },
  {
    path: '/admin/operators',
    label: '運営者アカウント管理',
    icon: <PeopleIcon />,
    roles: ['system_admin'],
  },
  {
    path: '/admin/clinics',
    label: '医院アカウント管理',
    icon: <BusinessIcon />,
    roles: ['system_admin'],
  },
  {
    path: '/admin/settings',
    label: 'システム設定',
    icon: <AdminPanelSettingsIcon />,
    roles: ['system_admin'],
  },
  {
    path: '/admin/price-tables',
    label: '価格表管理',
    icon: <EditNoteIcon />,
    roles: ['system_admin'],
  },
  {
    path: '/admin/print-orders',
    label: '印刷物発注管理',
    icon: <PrintIcon />,
    roles: ['system_admin'],
  },
];
