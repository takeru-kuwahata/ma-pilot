import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import { queryClient } from './hooks/useOptimizedQuery';
import './i18n/config';

console.log('[App] Providers imported');

function App() {
  console.log('[App] Rendering with providers');

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <h1>Providers working!</h1>
            <p>QueryClient, Theme, and BrowserRouter are active.</p>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
