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
} from '@mui/material';
import {
  Logout as LogoutIcon,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCurrentClinic } from '../hooks/useCurrentClinic';
import { clinicMenuItems } from '../constants/menuConfig';
import { filterMenuByRole } from '../utils/menuFilter';

const drawerWidth = 240;

export const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { clinicName } = useCurrentClinic();

  // 権限によるメニューフィルタリング
  const filteredMenuItems = user
    ? filterMenuByRole(clinicMenuItems, user.role)
    : [];

  // system_adminかどうか判定
  const isSystemAdmin = user?.role === 'system_admin';

  // TODO: 認証コンテキストから取得（Phase 5以降）
  const userName = '田中太郎';
  const userInitial = '田';

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

          {/* system_admin用のモード切替ボタン */}
          {isSystemAdmin && (
            <Button
              color="inherit"
              startIcon={<SwapHorizIcon />}
              onClick={() => navigate('/admin/dashboard')}
              sx={{ mr: 2 }}
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
          {filteredMenuItems.map((item) => (
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
        <Outlet />
      </Box>
    </Box>
  );
};
