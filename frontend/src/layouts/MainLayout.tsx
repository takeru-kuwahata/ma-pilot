import React, { ReactNode } from 'react';
import {
  AppBar,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  EditNote as EditNoteIcon,
  LocationOn as LocationOnIcon,
  TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
  Print as PrintIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
}

const drawerWidth = 240;

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // TODO: 認証コンテキストから取得（Phase 5以降）
  const clinicName = 'さくら歯科クリニック';
  const userName = '田中太郎';
  const userInitial = '田';

  const menuItems = [
    { path: '/dashboard', label: 'ダッシュボード', icon: <DashboardIcon /> },
    { path: '/data-management', label: '基礎データ管理', icon: <EditNoteIcon /> },
    { path: '/market-analysis', label: '診療圏分析', icon: <LocationOnIcon /> },
    { path: '/simulation', label: '経営シミュレーション', icon: <TrendingUpIcon /> },
    { path: '/reports', label: 'レポート管理', icon: <DescriptionIcon /> },
    { path: '/print-order', label: '印刷物発注', icon: <PrintIcon /> },
  ];

  const settingsItems = [
    { path: '/clinic-settings', label: '医院設定', icon: <BusinessIcon /> },
    { path: '/staff-management', label: 'スタッフ管理', icon: <PeopleIcon /> },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    // TODO: ログアウト処理（Phase 5以降）
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* ヘッダー */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: '#ffffff',
          color: '#424242',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: 'none',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {/* ロゴ */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                backgroundColor: '#FF6B35',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              MA
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: 20,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              MA-Pilot
            </Typography>
          </Box>

          {/* 医院名 */}
          <Typography
            variant="body2"
            sx={{
              color: '#616161',
              pr: 2,
              mr: 2,
              borderRight: '1px solid #e0e0e0',
              display: { xs: 'none', md: 'block' },
            }}
          >
            {clinicName}
          </Typography>

          {/* ユーザー情報 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#FF6B35',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {userInitial}
            </Avatar>
            <Typography
              variant="body2"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              {userName}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* サイドバー */}
      <Box
        sx={{
          position: 'fixed',
          top: '64px',
          left: 0,
          width: `${drawerWidth}px`,
          height: 'calc(100vh - 64px)',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
          overflowY: 'auto',
        }}
      >
        <List sx={{ pt: 2, pb: 0 }}>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  py: 1.5,
                  px: 3,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 107, 53, 0.08)',
                    borderLeft: '3px solid #FF6B35',
                    color: '#FF6B35',
                    pl: 'calc(24px - 3px)',
                    '& .MuiListItemIcon-root': {
                      color: '#FF6B35',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2, mx: 3 }} />

        <Typography
          variant="caption"
          sx={{
            px: 3,
            py: 1.5,
            display: 'block',
            color: '#9e9e9e',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: 12,
          }}
        >
          設定
        </Typography>

        <List sx={{ pt: 0, pb: 0 }}>
          {settingsItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  py: 1.5,
                  px: 3,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 107, 53, 0.08)',
                    borderLeft: '3px solid #FF6B35',
                    color: '#FF6B35',
                    pl: 'calc(24px - 3px)',
                    '& .MuiListItemIcon-root': {
                      color: '#FF6B35',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2, mx: 3 }} />

        <List sx={{ pt: 0, pb: 0 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                py: 1.5,
                px: 3,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="ログアウト"
                primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          marginLeft: `${drawerWidth}px`,
          marginTop: '64px',
          padding: '24px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#f5f5f5',
          width: `calc(100vw - ${drawerWidth}px)`,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
