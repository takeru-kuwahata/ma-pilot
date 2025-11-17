import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from './theme';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { DataManagement } from './pages/DataManagement';
import { MarketAnalysis } from './pages/MarketAnalysis';
import { Simulation } from './pages/Simulation';
import { Reports } from './pages/Reports';
import { ClinicSettings } from './pages/ClinicSettings';
import { StaffManagement } from './pages/StaffManagement';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminClinics } from './pages/admin/AdminClinics';
import { AdminSettings } from './pages/admin/AdminSettings';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
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
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
