import type { MonthlyData } from '../types';

export interface ForecastPoint {
  month: string; // YYYY-MM、または「Nヶ月後」等の表示用ラベル
  isForecast: boolean;
  revenue: number;
  profit: number;
  patients: number;
}

/** グラフ描画用の1行。実績はactual*、予測はforecast*に値が入り、他方はundefinedになる */
export interface ChartRow {
  month: string;
  actualRevenue?: number;
  actualProfit?: number;
  actualPatients?: number;
  forecastRevenue?: number;
  forecastProfit?: number;
  forecastPatients?: number;
}

/**
 * 実績点列と予測点列を、実績と予測で線種を分けて描画できる1系列にまとめる。
 * 予測線を実績の続きとして自然に見せるため、実績の最終点は予測側のキーにも複製する（接続点）。
 */
export const buildChartRows = (actualPoints: ForecastPoint[], forecastPoints: ForecastPoint[]): ChartRow[] => {
  const actualRows: ChartRow[] = actualPoints.map((p) => ({
    month: p.month,
    actualRevenue: p.revenue,
    actualProfit: p.profit,
    actualPatients: p.patients,
  }));

  const lastActual = actualPoints[actualPoints.length - 1];
  if (lastActual && actualRows.length > 0) {
    const connector = actualRows[actualRows.length - 1];
    connector.forecastRevenue = lastActual.revenue;
    connector.forecastProfit = lastActual.profit;
    connector.forecastPatients = lastActual.patients;
  }

  const forecastRows: ChartRow[] = forecastPoints.map((p) => ({
    month: p.month,
    forecastRevenue: p.revenue,
    forecastProfit: p.profit,
    forecastPatients: p.patients,
  }));

  return [...actualRows, ...forecastRows];
};

/**
 * 実績の直近12ヶ月分（古い順）を、グラフ表示用の点列に変換する。
 */
export const buildActualPoints = (monthlyData: MonthlyData[]): ForecastPoint[] => {
  const sorted = [...monthlyData].sort((a, b) => a.year_month.localeCompare(b.year_month));
  const last12 = sorted.slice(-12);
  return last12.map((d) => ({
    month: d.year_month,
    isForecast: false,
    revenue: d.total_revenue,
    profit: d.total_revenue - (d.variable_cost + d.fixed_cost),
    patients: d.total_patients,
  }));
};

/**
 * 直近実績から目標値（targetRevenue/targetProfit/targetPatients）まで、
 * periodMonths ヶ月かけて線形に近づく予測点列を生成する（開始月=直近実績の翌月、終点=目標到達月）。
 */
export const buildForecastPoints = (
  latestData: MonthlyData,
  periodMonths: number,
  targetRevenue: number,
  targetProfit: number,
  targetPatients: number
): ForecastPoint[] => {
  const startRevenue = latestData.total_revenue;
  const startProfit = latestData.total_revenue - (latestData.variable_cost + latestData.fixed_cost);
  const startPatients = latestData.total_patients;

  const [startYear, startMonth] = latestData.year_month.split('-').map(Number);

  const points: ForecastPoint[] = [];
  for (let i = 1; i <= periodMonths; i++) {
    const ratio = i / periodMonths;
    const totalMonthIndex = startMonth - 1 + i;
    const year = startYear + Math.floor(totalMonthIndex / 12);
    const month = (totalMonthIndex % 12) + 1;
    points.push({
      month: `${year}-${String(month).padStart(2, '0')}`,
      isForecast: true,
      revenue: Math.round(startRevenue + (targetRevenue - startRevenue) * ratio),
      profit: Math.round(startProfit + (targetProfit - startProfit) * ratio),
      patients: Math.round(startPatients + (targetPatients - startPatients) * ratio),
    });
  }
  return points;
};
