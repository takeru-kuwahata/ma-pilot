import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { theme } from './theme';
import { queryClient } from './hooks/useOptimizedQuery';
import { initializeAnnouncer } from './utils/announcer';
import './i18n/config';

// コード分割: 遅延ロード（Lazy Loading）
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const DataManagement = lazy(() => import('./pages/DataManagement').then(m => ({ default: m.DataManagement })));
const MarketAnalysis = lazy(() => import('./pages/MarketAnalysis').then(m => ({ default: m.MarketAnalysis })));
const Simulation = lazy(() => import('./pages/Simulation').then(m => ({ default: m.Simulation })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const ClinicSettings = lazy(() => import('./pages/ClinicSettings').then(m => ({ default: m.ClinicSettings })));
const StaffManagement = lazy(() => import('./pages/StaffManagement').then(m => ({ default: m.StaffManagement })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminClinics = lazy(() => import('./pages/admin/AdminClinics').then(m => ({ default: m.AdminClinics })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const PriceTableManagement = lazy(() => import('./pages/PriceTableManagement'));
const PrintOrderForm = lazy(() => import('./pages/PrintOrderForm'));
const PrintOrderHistory = lazy(() => import('./pages/PrintOrderHistory'));

// ローディングフォールバック
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    role="status"
    aria-live="polite"
    aria-label="コンテンツを読み込んでいます"
  >
    <CircularProgress aria-label="読み込み中" />
  </Box>
);

function App() {
  // アクセシビリティ: スクリーンリーダー用アナウンサーを初期化
  useEffect(() => {
    initializeAnnouncer();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* スキップリンク - キーボードユーザーのためのアクセシビリティ機能 */}
        <a href="#main-content" className="skip-link">
          メインコンテンツへスキップ
        </a>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <main id="main-content">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/data-management" element={<DataManagement />} />
                <Route path="/market-analysis" element={<MarketAnalysis />} />
                <Route path="/simulation" element={<Simulation />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/clinic-settings" element={<ClinicSettings />} />
                <Route path="/staff-management" element={<StaffManagement />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/clinics" element={<AdminClinics />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/price-tables" element={<PriceTableManagement />} />
                <Route path="/print-order" element={<PrintOrderForm />} />
                <Route path="/print-order-history" element={<PrintOrderHistory />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </main>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
      {/* React Query DevTools（開発環境のみ） */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
