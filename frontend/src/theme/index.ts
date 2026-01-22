import { createTheme } from '@mui/material/styles';

// MA-Lstep カスタムテーマ
// 歯科医院経営分析システム - コーポレートカラー（オレンジ系）
export const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B35', // コーポレートオレンジ（ロゴカラー）
      light: '#FF8A5C',
      dark: '#E65100',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF9800', // アクセントオレンジ
      light: '#FFB74D',
      dark: '#F57C00',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#d32f2f', // WCAG AA準拠: コントラスト比 4.5:1以上
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Hiragino Kaku Gothic ProN"',
      'Meiryo',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          // フォーカス時の視認性向上（アクセシビリティ）
          '&:focus-visible': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          // フォーカス時の視認性向上（アクセシビリティ）
          '& .MuiOutlinedInput-root.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          // フォーカス時の視認性向上（アクセシビリティ）
          '&:focus-visible': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
            borderRadius: '2px',
          },
        },
      },
    },
  },
});
