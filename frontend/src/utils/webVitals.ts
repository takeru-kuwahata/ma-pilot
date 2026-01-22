import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

/**
 * Web Vitals計測
 * - CLS (Cumulative Layout Shift): レイアウトシフト
 * - INP (Interaction to Next Paint): 次回描画までのインタラクション（FIDの後継）
 * - FCP (First Contentful Paint): 初回コンテンツ描画
 * - LCP (Largest Contentful Paint): 最大コンテンツ描画
 * - TTFB (Time to First Byte): 初回バイト取得時間
 */

function sendToAnalytics(metric: Metric) {
  // 開発環境ではコンソールに出力
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }

  // 本番環境では分析サービスに送信（将来実装）
  // 例: Google Analytics, Sentry, カスタムエンドポイント等
  // navigator.sendBeacon('/api/analytics', JSON.stringify(metric));
}

export function reportWebVitals(onPerfEntry?: (metric: Metric) => void) {
  const callback = onPerfEntry || sendToAnalytics;

  onCLS(callback);
  onINP(callback);
  onFCP(callback);
  onLCP(callback);
  onTTFB(callback);
}

/**
 * パフォーマンス閾値（Core Web Vitals基準）
 */
export const PERFORMANCE_THRESHOLDS = {
  // LCP: 2.5秒以下が良好
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  // INP: 200ms以下が良好
  INP: {
    good: 200,
    needsImprovement: 500,
  },
  // CLS: 0.1以下が良好
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // FCP: 1.8秒以下が良好
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  // TTFB: 800ms以下が良好
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
};

/**
 * パフォーマンス評価
 */
export function evaluateMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];

  if (!threshold) return 'good';

  if (value <= threshold.good) {
    return 'good';
  } else if (value <= threshold.needsImprovement) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}
