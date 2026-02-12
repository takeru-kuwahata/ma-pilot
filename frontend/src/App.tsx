import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { theme } from './theme';
import { queryClient } from './hooks/useOptimizedQuery';
import './i18n/config';

// ルーティング保護コンポーネント
import { PrivateRoute } from './components/routing/PrivateRoute';
import { RoleRoute } from './components/routing/RoleRoute';

// レイアウトコンポーネント
import { PublicLayout } from './layouts/PublicLayout';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';

// 公開ページ
import { LoginPage } from './pages/LoginPage';

// 医院エリアページ
import { Dashboard } from './pages/Dashboard';
import { DataManagement } from './pages/DataManagement';
import { MarketAnalysis } from './pages/MarketAnalysis';
import { Simulation } from './pages/Simulation';
import { Reports } from './pages/Reports';
import { ClinicSettings } from './pages/ClinicSettings';
import { StaffManagement } from './pages/StaffManagement';
import PrintOrderForm from './pages/PrintOrderForm';
import PrintOrderHistory from './pages/PrintOrderHistory';

// 運営者エリアページ
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminClinics } from './pages/admin/AdminClinics';
import { AdminSettings } from './pages/admin/AdminSettings';
import PriceTableManagement from './pages/PriceTableManagement';

// エラーページ
import { Forbidden } from './pages/Forbidden';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
              {/* ========== パブリックエリア（/login） ========== */}
              <Route element={<PublicLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Route>

              {/* ========== 医院エリア（/clinic/*） ========== */}
              <Route element={<PrivateRoute />}>
                <Route
                  element={
                    <RoleRoute
                      allowedRoles={['clinic_owner', 'clinic_editor', 'clinic_viewer', 'system_admin']}
                    />
                  }
                >
                  <Route element={<MainLayout />}>
                    <Route path="/clinic/dashboard" element={<Dashboard />} />
                    <Route path="/clinic/data-management" element={<DataManagement />} />
                    <Route path="/clinic/market-analysis" element={<MarketAnalysis />} />
                    <Route path="/clinic/simulation" element={<Simulation />} />
                    <Route path="/clinic/reports" element={<Reports />} />
                    <Route path="/clinic/settings" element={<ClinicSettings />} />
                    <Route path="/clinic/staff" element={<StaffManagement />} />
                    <Route path="/clinic/print-order" element={<PrintOrderForm />} />
                    <Route path="/clinic/print-order-history" element={<PrintOrderHistory />} />
                  </Route>
                </Route>
              </Route>

              {/* ========== 運営者エリア（/admin/*） ========== */}
              <Route element={<PrivateRoute />}>
                <Route element={<RoleRoute allowedRoles={['system_admin']} />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/clinics" element={<AdminClinics />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/price-tables" element={<PriceTableManagement />} />
                    <Route path="/admin/print-orders" element={<PrintOrderHistory />} />
                  </Route>
                </Route>
              </Route>

              {/* ========== 旧URLからのリダイレクト（後方互換性） ========== */}
              <Route path="/dashboard" element={<Navigate to="/clinic/dashboard" replace />} />
              <Route path="/data-management" element={<Navigate to="/clinic/data-management" replace />} />
              <Route path="/market-analysis" element={<Navigate to="/clinic/market-analysis" replace />} />
              <Route path="/simulation" element={<Navigate to="/clinic/simulation" replace />} />
              <Route path="/reports" element={<Navigate to="/clinic/reports" replace />} />
              <Route path="/clinic-settings" element={<Navigate to="/clinic/settings" replace />} />
              <Route path="/staff-management" element={<Navigate to="/clinic/staff" replace />} />
              <Route path="/print-order" element={<Navigate to="/clinic/print-order" replace />} />
              <Route path="/print-order-history" element={<Navigate to="/clinic/print-order-history" replace />} />

              {/* ========== 403 Forbidden ========== */}
              <Route path="/forbidden" element={<Forbidden />} />

              {/* ========== 404 Not Found ========== */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
      </ThemeProvider>
      {/* React Query DevTools（開発環境のみ） */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
