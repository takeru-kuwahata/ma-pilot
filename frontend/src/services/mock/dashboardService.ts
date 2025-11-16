import { DashboardData, DashboardKpi, DashboardAlert, MonthlyTrendData } from '../../types';

export class DashboardService {
  // モックデータ: KPI
  private mockKpis: DashboardKpi[] = [
    {
      id: 'kpi-1',
      label: '総売上',
      value: 8500000,
      unit: '¥',
      comparison: {
        trend: 'positive',
        monthOverMonth: 5.2,
        yearOverYear: 12.3,
      },
    },
    {
      id: 'kpi-2',
      label: '営業利益',
      value: 2100000,
      unit: '¥',
      comparison: {
        trend: 'negative',
        monthOverMonth: 3.8,
        yearOverYear: -2.1,
      },
    },
    {
      id: 'kpi-3',
      label: '粗利率',
      value: 24.7,
      unit: '%',
      comparison: {
        trend: 'negative',
        monthOverMonth: -0.5,
        yearOverYear: -3.2,
      },
    },
    {
      id: 'kpi-4',
      label: '総患者数',
      value: 420,
      unit: '人',
      comparison: {
        trend: 'positive',
        monthOverMonth: 8,
        yearOverYear: 35,
      },
    },
    {
      id: 'kpi-5',
      label: 'ユニット稼働率',
      value: 78.5,
      unit: '%',
      comparison: {
        trend: 'positive',
        monthOverMonth: 2.3,
        yearOverYear: 5.7,
      },
    },
    {
      id: 'kpi-6',
      label: '自費率',
      value: 18.2,
      unit: '%',
      comparison: {
        trend: 'negative',
        monthOverMonth: -1.2,
        yearOverYear: -0.3,
      },
    },
    {
      id: 'kpi-7',
      label: '新患数',
      value: 35,
      unit: '人',
      comparison: {
        trend: 'positive',
        monthOverMonth: 5,
        yearOverYear: 8,
      },
    },
    {
      id: 'kpi-8',
      label: 'リコール率',
      value: 62.3,
      unit: '%',
      comparison: {
        trend: 'positive',
        monthOverMonth: -0.2,
        yearOverYear: 3.5,
      },
    },
  ];

  // モックデータ: アラート
  private mockAlerts: DashboardAlert[] = [
    {
      id: 'alert-1',
      severity: 'warning',
      title: '自費率が低下しています',
      message: '前月比 -1.2%の減少。自費診療の提案を強化することを推奨します。',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'alert-2',
      severity: 'error',
      title: '粗利率が目標を下回っています',
      message: '目標25%に対して24.7%。変動費の見直しを検討してください。',
      timestamp: new Date().toISOString(),
    },
  ];

  // モックデータ: 月次推移（直近6ヶ月）
  private mockTrends: MonthlyTrendData[] = [
    {
      yearMonth: '2024-05',
      totalRevenue: 9500000,
      operatingProfit: 2100000,
      newPatients: 55,
      returningPatients: 365,
      unitUtilization: 76.2,
      selfPayRate: 19.4,
    },
    {
      yearMonth: '2024-06',
      totalRevenue: 9100000,
      operatingProfit: 2020000,
      newPatients: 50,
      returningPatients: 355,
      unitUtilization: 75.8,
      selfPayRate: 19.1,
    },
    {
      yearMonth: '2024-07',
      totalRevenue: 8600000,
      operatingProfit: 1870000,
      newPatients: 46,
      returningPatients: 325,
      unitUtilization: 74.5,
      selfPayRate: 18.5,
    },
    {
      yearMonth: '2024-08',
      totalRevenue: 7500000,
      operatingProfit: 1560000,
      newPatients: 35,
      returningPatients: 285,
      unitUtilization: 71.2,
      selfPayRate: 17.8,
    },
    {
      yearMonth: '2024-09',
      totalRevenue: 8900000,
      operatingProfit: 1980000,
      newPatients: 49,
      returningPatients: 340,
      unitUtilization: 76.0,
      selfPayRate: 18.9,
    },
    {
      yearMonth: '2024-10',
      totalRevenue: 9300000,
      operatingProfit: 2170000,
      newPatients: 53,
      returningPatients: 358,
      unitUtilization: 78.5,
      selfPayRate: 18.2,
    },
  ];

  async getDashboardData(_clinicId: string): Promise<DashboardData> {
    // @MOCK_TO_API: GET /api/dashboard?clinic_id={_clinicId}
    // Request: clinicId (query param)
    // Response: DashboardData
    // Note: バックエンドで以下を実施:
    //   1. clinic_idに紐づく月次データを取得
    //   2. 主要KPIを自動計算（営業利益、粗利率、稼働率等）
    //   3. 前月比・前年比を算出
    //   4. アラート判定（目標未達、異常値検知）
    //   5. 直近6ヶ月の推移データを生成

    // モック実装: 200ms待機してデータ返却
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      kpis: this.mockKpis,
      alerts: this.mockAlerts,
      trends: this.mockTrends,
      lastUpdated: '2025-10',
      dataSource: '手動入力',
    };
  }
}
