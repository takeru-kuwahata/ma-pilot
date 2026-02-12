import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { theme } from './theme';
import { queryClient } from './hooks/useOptimizedQuery';
import './i18n/config';

console.log('[App] All imports successful');

function App() {
  console.log('[App] Component rendering');

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Imports successful!</h1>
      <p>All dependencies loaded correctly.</p>
    </div>
  );
}

export default App;
