import { describe, it, expect } from 'vitest';

// フォーマット関数をインラインで定義して実装テスト
// アプリ内で共通利用されているパターンを検証する

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return `${year}年${parseInt(month, 10)}月`;
}

function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

function formatRevenue(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}億円`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(0)}万円`;
  return `${value.toLocaleString('ja-JP')}円`;
}

function calculateProfitRate(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}

describe('フォーマット関数', () => {
  describe('formatCurrency', () => {
    it('整数をカンマ区切りの円表記にする', () => {
      expect(formatCurrency(10000)).toBe('¥10,000');
      expect(formatCurrency(1000000)).toBe('¥1,000,000');
    });

    it('0は¥0を返す', () => {
      expect(formatCurrency(0)).toBe('¥0');
    });

    it('小数は含まれない', () => {
      expect(formatCurrency(5000)).toBe('¥5,000');
    });
  });

  describe('formatYearMonth', () => {
    it('YYYY-MM形式を年月表記に変換する', () => {
      expect(formatYearMonth('2025-03')).toBe('2025年3月');
      expect(formatYearMonth('2025-12')).toBe('2025年12月');
      expect(formatYearMonth('2025-01')).toBe('2025年1月');
    });

    it('月の先頭ゼロを除去する', () => {
      expect(formatYearMonth('2025-06')).toBe('2025年6月');
    });
  });

  describe('formatPercentage', () => {
    it('数値をパーセント表記にする', () => {
      expect(formatPercentage(15)).toBe('15.0%');
      expect(formatPercentage(0)).toBe('0.0%');
      expect(formatPercentage(100)).toBe('100.0%');
    });

    it('小数点の桁数を指定できる', () => {
      expect(formatPercentage(12.345, 2)).toBe('12.35%');
      expect(formatPercentage(12.345, 0)).toBe('12%');
    });
  });

  describe('formatRevenue', () => {
    it('1億円以上は億円表記にする', () => {
      expect(formatRevenue(200_000_000)).toBe('2.0億円');
    });

    it('1万円以上は万円表記にする', () => {
      expect(formatRevenue(5_000_000)).toBe('500万円');
      expect(formatRevenue(50_000)).toBe('5万円');
    });

    it('1万円未満は円表記にする', () => {
      expect(formatRevenue(9_999)).toBe('9,999円');
    });
  });

  describe('calculateProfitRate', () => {
    it('利益率を正しく計算する', () => {
      const rate = calculateProfitRate(10_000_000, 8_000_000);
      expect(rate).toBeCloseTo(20, 5);
    });

    it('コストが収益と同じ場合は0%', () => {
      expect(calculateProfitRate(1_000_000, 1_000_000)).toBe(0);
    });

    it('収益が0の場合は0を返す（ゼロ除算回避）', () => {
      expect(calculateProfitRate(0, 500_000)).toBe(0);
    });

    it('コストが収益より大きい場合は負の値', () => {
      const rate = calculateProfitRate(1_000_000, 1_500_000);
      expect(rate).toBe(-50);
    });
  });
});

describe('年月バリデーション', () => {
  it('YYYY-MM形式の正規表現マッチ', () => {
    const pattern = /^\d{4}-(0[1-9]|1[0-2])$/;
    expect(pattern.test('2025-01')).toBe(true);
    expect(pattern.test('2025-12')).toBe(true);
    expect(pattern.test('2025-13')).toBe(false);
    expect(pattern.test('2025-00')).toBe(false);
    expect(pattern.test('25-01')).toBe(false);
  });
});
