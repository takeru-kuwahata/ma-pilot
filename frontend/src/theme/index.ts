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
    // htmlFontSize: ブラウザデフォルト16pxを基準にremを計算
    // 15px = 0.9375rem, 13px = 0.8125rem, 18px = 1.125rem, 24px = 1.5rem
    htmlFontSize: 16,
    fontSize: 15,

    // ===== rem適用（OS・ブラウザのフォントサイズ設定に追従） =====
    // ページタイトル: 24px相当
    h4: { fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4 },
    // セクション見出し: 18px相当
    h6: { fontSize: '1.125rem', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4 },
    // サブ見出し: 20px相当
    h5: { fontSize: '1.25rem', fontWeight: 600, color: '#1a1a1a' },
    // 本文: 15px相当 ← OS設定に追従する最重要テキスト
    body1: { fontSize: '0.9375rem', fontWeight: 400, color: '#333333', lineHeight: 1.7 },
    // 補足・説明文: 13px相当（最小サイズ）
    body2: { fontSize: '0.8125rem', fontWeight: 400, color: '#555555', lineHeight: 1.6 },
    // ラベル・キャプション: 13px相当
    caption: { fontSize: '0.8125rem', fontWeight: 400, color: '#555555', lineHeight: 1.5 },
    // ボタン: 15px相当
    button: { fontSize: '0.9375rem', fontWeight: 600 },
    // サブタイトル
    subtitle1: { fontSize: '0.9375rem', fontWeight: 600, color: '#333333' },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600, color: '#555555' },
    overline: { fontSize: '0.8125rem', fontWeight: 600, color: '#555555', letterSpacing: '0.05em' },

    // ===== px維持（KPI数値・大見出し：固定グリッド内のため崩れ防止） =====
    h1: { fontSize: '32px', fontWeight: 700, color: '#1a1a1a' },
    h2: { fontSize: '28px', fontWeight: 700, color: '#1a1a1a' },
    h3: { fontSize: '24px', fontWeight: 600, color: '#1a1a1a' },
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

    // ===== テーブル（px維持：固定幅列との整合性のため） =====
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

    // ===== テキストフィールド（rem：入力欄はOS設定追従が重要） =====
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontSize: '0.9375rem',
            color: '#1a1a1a',
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.9375rem',
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

    // ===== セレクト（rem） =====
    MuiSelect: {
      styleOverrides: {
        select: {
          fontSize: '0.9375rem',
          color: '#1a1a1a',
        },
      },
    },

    // ===== Chip（px維持：height固定との整合性のため） =====
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

    // ===== Tooltip（rem） =====
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.8125rem',
        },
      },
    },

    // ===== FormHelperText（rem：入力補足はOS設定追従が重要） =====
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          color: '#555555',
        },
      },
    },

    // ===== MenuItem（rem） =====
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
          color: '#1a1a1a',
        },
      },
    },
  },
});
