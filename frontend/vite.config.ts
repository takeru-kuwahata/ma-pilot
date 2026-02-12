import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // バンドルサイズ分析（analyze時のみ）
    mode === 'analyze' && visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  server: {
    port: 3247,
    open: true,
  },
  build: {
    outDir: 'dist',
    // ソースマップを本番環境では無効化（セキュリティとサイズ削減）
    sourcemap: false,
    // チャンク分割戦略
    rollupOptions: {
      output: {
        manualChunks: {
          // React関連を1つのチャンクに
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // MUI関連を1つのチャンクに
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // グラフライブラリを1つのチャンクに
          'vendor-charts': ['recharts'],
          // その他のライブラリ
          'vendor-utils': ['zustand', '@tanstack/react-query', 'react-hook-form', 'papaparse', '@supabase/supabase-js'],
        },
      },
    },
    // チャンクサイズ警告の閾値（1MB）
    chunkSizeWarningLimit: 1000,
    // 最小化設定
    minify: 'terser',
    terserOptions: {
      compress: {
        // console.logを本番環境では削除（デバッグ中は無効化）
        drop_console: false,
        drop_debugger: false,
      },
    },
  },
  // 最適化設定
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      'recharts',
    ],
  },
}));
