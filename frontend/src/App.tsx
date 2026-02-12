import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import { queryClient } from './hooks/useOptimizedQuery';
import './i18n/config';

// ルーティング保護コンポーネント
import { PrivateRoute } from './components/routing/PrivateRoute';
import { RoleRoute } from './components/routing/RoleRoute';

// レイアウトコンポーネント
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

// 公開ページ
import { LoginPage } from './pages/LoginPage';

// 運営者エリアページ
import { AdminDashboard } from './pages/admin/AdminDashboard';

console.log('[App] All components imported successfully');

function App() {
  console.log('[App] Rendering with Routes');

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* パブリックエリア */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Route>

            {/* 運営者エリア - AdminDashboardのみテスト */}
            <Route element={<PrivateRoute />}>
              <Route element={<RoleRoute allowedRoles={['system_admin']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
