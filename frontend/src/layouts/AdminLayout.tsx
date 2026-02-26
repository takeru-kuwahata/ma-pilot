import React from 'react';
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
  Divider,
  Chip,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/api';
import { adminMenuItems } from '../constants/menuConfig';

const drawerWidth = 240;

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: storeLogout, user } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // 運営者エリア用のメニューを使用
  const filteredMenuItems = adminMenuItems;

  const userName = user?.display_name || 'システム管理者';

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await authService.logout();
    storeLogout();
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path: string) => {
    handleNavigation(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // サイドバーの内容（デスクトップとモバイルで共通）
  const drawerContent = (
    <>
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
          mt: 2,
        }}
      >
        管理機能
      </Typography>

      <List sx={{ pt: 0, pb: 0 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleMenuClick(item.path)}
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
            selected={location.pathname === '/admin/my-settings'}
            onClick={() => handleMenuClick('/admin/my-settings')}
            sx={{
              py: 1.5,
              px: 3,
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 107, 53, 0.08)',
                borderLeft: '3px solid #FF6B35',
                color: '#FF6B35',
                pl: 'calc(24px - 3px)',
                '& .MuiListItemIcon-root': { color: '#FF6B35' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <AccountCircleIcon />
            </ListItemIcon>
            <ListItemText
              primary="マイページ設定"
              primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{ py: 1.5, px: 3 }}
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
    </>
  );

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
          {/* ハンバーガーメニュー（モバイルのみ） */}
          <IconButton
            color="inherit"
            aria-label="メニューを開く"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

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
            <Chip
              label="管理者"
              sx={{
                marginLeft: 1,
                backgroundColor: '#F44336',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                height: 24,
              }}
            />
          </Box>

          {/* ユーザー名のみ表示（アイコンなし） */}
          <Typography
            variant="body2"
            sx={{ color: '#616161', display: { xs: 'none', md: 'block' } }}
          >
            {userName}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* モバイル用Drawer（一時的表示） */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // モバイルでのパフォーマンス向上
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            top: '64px',
            height: 'calc(100vh - 64px)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* デスクトップ用Drawer（固定表示） */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            top: '64px',
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            borderRight: '1px solid #e0e0e0',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: { xs: 0, md: `${drawerWidth}px` },
          marginTop: '64px',
          padding: { xs: '16px', sm: '24px' },
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#f5f5f5',
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
