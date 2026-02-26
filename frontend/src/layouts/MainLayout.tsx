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
  Avatar,
  Divider,
  Button,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  SwapHoriz as SwapHorizIcon,
  AccountCircle as AccountCircleIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, useParams, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/api';
import { useCurrentClinic } from '../hooks/useCurrentClinic';
import { clinicMenuItems } from '../constants/menuConfig';
import { filterMenuByRole } from '../utils/menuFilter';

const drawerWidth = 240;

export const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clinicId: clinicIdParam } = useParams<{ clinicId: string }>();
  const { user, logout: storeLogout, setSelectedClinic } = useAuthStore();
  const { clinicName } = useCurrentClinic();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // 権限によるメニューフィルタリング & パスにclinicIdを含める
  const filteredMenuItems = React.useMemo(() => {
    if (!user || !clinicIdParam) return [];
    const filtered = filterMenuByRole(clinicMenuItems, user.role);
    return filtered.map(item => ({
      ...item,
      path: item.path.replace('/clinic/', `/clinic/${clinicIdParam}/`)
    }));
  }, [user, clinicIdParam]);

  // system_adminかどうか判定
  const isSystemAdmin = user?.role === 'system_admin';

  const userName = user?.display_name || user?.email?.split('@')[0] || 'ユーザー';
  const userInitial = user?.display_name ? user.display_name.charAt(0) : (user?.email?.charAt(0).toUpperCase() || 'U');

  // URLパラメータのclinicIdをZustandに同期
  React.useEffect(() => {
    if (clinicIdParam && user?.role === 'system_admin') {
      setSelectedClinic(clinicIdParam);
    }
  }, [clinicIdParam, user?.role, setSelectedClinic]);

  const handleNavigation = (path: string) => {
    // パスが相対パスの場合、clinicIdを含めた完全パスに変換
    if (clinicIdParam && path.startsWith('/clinic/') && !path.includes(clinicIdParam)) {
      const newPath = path.replace('/clinic/', `/clinic/${clinicIdParam}/`);
      navigate(newPath);
    } else {
      navigate(path);
    }
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
      <List sx={{ pt: 2, pb: 0 }}>
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
            selected={location.pathname === `/clinic/${clinicIdParam}/my-settings`}
            onClick={() => handleMenuClick(`/clinic/${clinicIdParam}/my-settings`)}
            sx={{
              py: 1.5,
              px: 3,
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 107, 53, 0.08)',
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

          {/* ロゴ＋クリニック名 */}
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
            {clinicName && (
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#212121',
                  display: { xs: 'none', sm: 'block' },
                  ml: 0.5,
                }}
              >
                {clinicName}
              </Typography>
            )}
          </Box>

          {/* system_admin用のモード切替ボタン */}
          {isSystemAdmin && (
            <Button
              variant="contained"
              startIcon={<SwapHorizIcon />}
              onClick={() => navigate('/admin/dashboard')}
              sx={{
                mr: 2,
                backgroundColor: '#FF6B35',
                color: '#ffffff',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#e55a25' },
                boxShadow: 'none',
              }}
            >
              運営者モードへ
            </Button>
          )}

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
