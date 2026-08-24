import { describe, it, expect } from 'vitest';
import { buildActualPoints, buildForecastPoints, buildChartRows } from '../../utils/simulationForecast';
import type { MonthlyData } from '../../types';

const makeMonthlyData = (yearMonth: string, overrides: Partial<MonthlyData> = {}): MonthlyData => ({
  id: `id-${yearMonth}`,
  clinic_id: 'clinic-1',
  year_month: yearMonth,
  total_revenue: 10_000_000,
  insurance_revenue: 6_000_000,
  self_pay_revenue: 3_000_000,
  retail_revenue: 1_000_000,
  variable_cost: 3_000_000,
  fixed_cost: 5_000_000,
  first_visit_patients: 50,
  re_first_visit_patients: 10,
  returning_patients: 400,
  other_patients: 40,
  total_patients: 500,
  treatment_count: 800,
  average_revenue_per_patient: 20_000,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('buildActualPoints', () => {
  it('年月の古い順に並び替えて返す', () => {
    const data = [
      makeMonthlyData('2026-03'),
      makeMonthlyData('2026-01'),
      makeMonthlyData('2026-02'),
    ];
    const points = buildActualPoints(data);
    expect(points.map((p) => p.month)).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  it('直近12ヶ月のみを対象とする（13ヶ月分あれば最古の1件を除外）', () => {
    const data = Array.from({ length: 13 }, (_, i) =>
      makeMonthlyData(`2025-${String(i + 1).padStart(2, '0')}`)
    );
    const points = buildActualPoints(data);
    expect(points).toHaveLength(12);
    expect(points[0].month).toBe('2025-02');
  });

  it('isForecastはfalse、利益=総売上-(変動費+固定費)で計算する', () => {
    const data = [makeMonthlyData('2026-01', { total_revenue: 10_000_000, variable_cost: 3_000_000, fixed_cost: 5_000_000 })];
    const [point] = buildActualPoints(data);
    expect(point.isForecast).toBe(false);
    expect(point.profit).toBe(2_000_000);
  });
});

describe('buildForecastPoints', () => {
  it('periodMonths件の予測点を、直近実績の翌月から生成する', () => {
    const latest = makeMonthlyData('2026-06', { total_revenue: 10_000_000 });
    const points = buildForecastPoints(latest, 12, 12_000_000, 3_000_000, 550);
    expect(points).toHaveLength(12);
    expect(points[0].month).toBe('2026-07');
    expect(points.every((p) => p.isForecast)).toBe(true);
  });

  it('年をまたぐ場合に正しく繰り上がる', () => {
    const latest = makeMonthlyData('2026-11', { total_revenue: 10_000_000 });
    const points = buildForecastPoints(latest, 3, 11_000_000, 2_500_000, 520);
    expect(points.map((p) => p.month)).toEqual(['2026-12', '2027-01', '2027-02']);
  });

  it('最終月（期間の最後）で目標値に到達する（線形補間の終点）', () => {
    const latest = makeMonthlyData('2026-01', {
      total_revenue: 10_000_000,
      variable_cost: 3_000_000,
      fixed_cost: 5_000_000,
      total_patients: 500,
    });
    const points = buildForecastPoints(latest, 12, 12_000_000, 3_000_000, 550);
    const last = points[points.length - 1];
    expect(last.revenue).toBe(12_000_000);
    expect(last.profit).toBe(3_000_000);
    expect(last.patients).toBe(550);
  });

  it('中間月は開始値と目標値の間を線形に補間する', () => {
    const latest = makeMonthlyData('2026-01', { total_revenue: 10_000_000, variable_cost: 3_000_000, fixed_cost: 5_000_000 });
    // targetRevenue=14,000,000、開始10,000,000、4ヶ月かけて到達 → 1ヶ月目は+1,000,000で11,000,000
    const points = buildForecastPoints(latest, 4, 14_000_000, 3_000_000, 500);
    expect(points[0].revenue).toBe(11_000_000);
    expect(points[1].revenue).toBe(12_000_000);
  });
});

describe('buildChartRows', () => {
  it('実績行と予測行を月順に連結する', () => {
    const actual = buildActualPoints([makeMonthlyData('2026-01'), makeMonthlyData('2026-02')]);
    const forecast = buildForecastPoints(makeMonthlyData('2026-02'), 2, 12_000_000, 3_000_000, 550);
    const rows = buildChartRows(actual, forecast);
    expect(rows.map((r) => r.month)).toEqual(['2026-01', '2026-02', '2026-03', '2026-04']);
  });

  it('実績の最終点を予測側のキーにも複製し、線が途切れず接続する', () => {
    const actual = buildActualPoints([makeMonthlyData('2026-01'), makeMonthlyData('2026-02', { total_revenue: 10_500_000 })]);
    const forecast = buildForecastPoints(makeMonthlyData('2026-02', { total_revenue: 10_500_000 }), 1, 12_000_000, 3_000_000, 550);
    const rows = buildChartRows(actual, forecast);
    const connector = rows[1]; // 2026-02（実績の最終点）
    expect(connector.actualRevenue).toBe(10_500_000);
    expect(connector.forecastRevenue).toBe(10_500_000); // 予測線の起点として複製されている
  });

  it('実績行にforecast*、予測行にactual*が入らない', () => {
    const actual = buildActualPoints([makeMonthlyData('2026-01')]);
    const forecast = buildForecastPoints(makeMonthlyData('2026-01'), 1, 11_000_000, 2_500_000, 520);
    const rows = buildChartRows(actual, forecast);
    const forecastOnlyRow = rows[rows.length - 1];
    expect(forecastOnlyRow.actualRevenue).toBeUndefined();
    expect(forecastOnlyRow.forecastRevenue).toBeDefined();
  });

  it('実績が0件でも予測行だけを返す', () => {
    const forecast = buildForecastPoints(makeMonthlyData('2026-01'), 2, 11_000_000, 2_500_000, 520);
    const rows = buildChartRows([], forecast);
    expect(rows).toHaveLength(2);
    expect(rows[0].actualRevenue).toBeUndefined();
  });
});
