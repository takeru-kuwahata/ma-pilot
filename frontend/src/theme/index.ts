import { createTheme } from '@mui/material/styles';

// ============================================================
// MA-Pilot フォント・カラーガイドライン
// ============================================================
//
// 【基本方針】
// 日本語は英語より画数が多く、小さいフォント・薄い色は判読不可。
// freee・マネーフォワード・SmartHR等の日本語BtoBサービスを参考に
// 最低フォントサイズ13px・最低コントラスト比4.5:1を徹底する。
//
// 【フォントサイズ規則】
//   ページタイトル    : 24px / weight 600
//   セクション見出し  : 18px / weight 600
//   カード見出し      : 16px / weight 600
//   本文・ラベル      : 15px / weight 400  ← 日本語の基本サイズ
//   補足・説明文      : 13px / weight 400  ← これ以下は使用禁止
//   テーブルヘッダー  : 13px / weight 600
//   テーブルセル      : 14px / weight 400
//   KPI数値           : 28px / weight 700
//   ボタン            : 15px / weight 600
//
// 【カラー規則（白背景 #ffffff 基準）】
//   メインテキスト    : #1a1a1a  コントラスト比 17.7:1 ✅
//   本文テキスト      : #333333  コントラスト比 12.6:1 ✅
//   補足テキスト      : #555555  コントラスト比  7.0:1 ✅ ← #616161の代替
//   無効・プレースホルダ: #767676 コントラスト比  4.5:1 ✅ (WCAG AA最低限)
//   使用禁止          : #9e9e9e (2.9:1) / #bdbdbd (1.9:1) / #757575以下
//
// 【禁止事項】
//   - 12px以下のフォントサイズ
//   - color: #9e9e9e, #bdbdbd での本文表示
//   - グレー文字 + 小さいフォントの組み合わせ
// ============================================================

export const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B35',
      light: '#FF8A5C',
      dark: '#E65100',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#e65100',
      contrastText: '#ffffff',
    },
    error: {
      main: '#c62828',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',    // メインテキスト
      secondary: '#555555',  // 補足テキスト（#616161から変更・コントラスト比7.0:1）
      disabled: '#767676',   // 無効テキスト（WCAG AA最低限）
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    // 日本語フォントを英語より前に配置
    fontFamily: [
      '"Hiragino Sans"',
      '"Hiragino Kaku Gothic ProN"',
      'Meiryo',
      '"Yu Gothic Medium"',
      '"Yu Gothic"',
      'sans-serif',
    ].join(','),
    fontSize: 15, // ベースフォントサイズ（日本語BtoBサービス標準）

    // ページタイトル: 24px
    h4: { fontSize: '24px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4 },
    // セクション見出し: 18px
    h6: { fontSize: '18px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4 },
    // 本文: 15px
    body1: { fontSize: '15px', fontWeight: 400, color: '#333333', lineHeight: 1.7 },
    // 補足・説明文: 13px（最小サイズ）
    body2: { fontSize: '13px', fontWeight: 400, color: '#555555', lineHeight: 1.6 },
    // ラベル・キャプション: 13px
    caption: { fontSize: '13px', fontWeight: 400, color: '#555555', lineHeight: 1.5 },
    // ボタン
    button: { fontSize: '15px', fontWeight: 600 },

    // 未使用だが定義が必要なvariant
    h1: { fontSize: '32px', fontWeight: 700, color: '#1a1a1a' },
    h2: { fontSize: '28px', fontWeight: 700, color: '#1a1a1a' },
    h3: { fontSize: '24px', fontWeight: 600, color: '#1a1a1a' },
    h5: { fontSize: '20px', fontWeight: 600, color: '#1a1a1a' },
    subtitle1: { fontSize: '15px', fontWeight: 600, color: '#333333' },
    subtitle2: { fontSize: '13px', fontWeight: 600, color: '#555555' },
    overline: { fontSize: '13px', fontWeight: 600, color: '#555555', letterSpacing: '0.05em' },
  },
  components: {
    // ===== ボタン =====
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '15px',
          '&:focus-visible': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
          },
        },
      },
    },

    // ===== テーブル =====
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: '13px',
          fontWeight: 600,
          color: '#555555',
        },
        body: {
          fontSize: '14px',
          color: '#333333',
        },
      },
    },

    // ===== テキストフィールド =====
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontSize: '15px',
            color: '#1a1a1a',
          },
          '& .MuiInputLabel-root': {
            fontSize: '15px',
            color: '#555555',
          },
          '& .MuiInputBase-input::placeholder': {
            color: '#767676',
            opacity: 1,
          },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '2px',
          },
        },
      },
    },

    // ===== セレクト =====
    MuiSelect: {
      styleOverrides: {
        select: {
          fontSize: '15px',
          color: '#1a1a1a',
        },
      },
    },

    // ===== Chip =====
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '13px',
          fontWeight: 600,
        },
        label: {
          fontSize: '13px',
        },
      },
    },

    // ===== カード =====
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },

    // ===== Paper =====
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },

    // ===== リンク =====
    MuiLink: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
            borderRadius: '2px',
          },
        },
      },
    },

    // ===== Tooltip =====
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '13px',
        },
      },
    },

    // ===== FormHelperText（入力補足） =====
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '13px',
          color: '#555555',
        },
      },
    },

    // ===== MenuItem =====
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '15px',
          color: '#1a1a1a',
        },
      },
    },
  },
});
