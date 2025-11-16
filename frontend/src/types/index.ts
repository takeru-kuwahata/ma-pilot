// ============================================
// ユーザー関連型定義
// ============================================

export type UserRole = 'system_admin' | 'clinic_owner' | 'clinic_editor' | 'clinic_viewer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  clinicId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 医院関連型定義
// ============================================

export interface Clinic {
  id: string;
  name: string;
  postalCode: string;
  address: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 月次データ関連型定義
// ============================================

export interface MonthlyData {
  id: string;
  clinicId: string;
  yearMonth: string; // YYYY-MM形式

  // 収益関連
  totalRevenue: number;
  insuranceRevenue: number;
  selfPayRevenue: number;

  // コスト関連
  personnelCost: number;
  materialCost: number;
  fixedCost: number;
  otherCost: number;

  // 患者数
  newPatients: number;
  returningPatients: number;
  totalPatients: number;

  // 診療関連
  treatmentCount: number;
  averageRevenuePerPatient: number;

  createdAt: string;
  updatedAt: string;
}

// ============================================
// シミュレーション関連型定義
// ============================================

export interface SimulationInput {
  targetRevenue: number;
  targetProfit: number;
  assumedAverageRevenuePerPatient: number;
  assumedPersonnelCostRate: number;
  assumedMaterialCostRate: number;
  assumedFixedCost: number;
}

export interface SimulationResult {
  requiredPatients: number;
  requiredTreatments: number;
  estimatedRevenue: number;
  estimatedProfit: number;
  profitMargin: number;
  strategies: string[];
}

export interface Simulation {
  id: string;
  clinicId: string;
  title: string;
  input: SimulationInput;
  result: SimulationResult;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// レポート関連型定義
// ============================================

export type ReportType = 'monthly' | 'quarterly' | 'annual' | 'simulation' | 'market_analysis';
export type ReportFormat = 'pdf' | 'csv';

export interface Report {
  id: string;
  clinicId: string;
  type: ReportType;
  format: ReportFormat;
  title: string;
  generatedAt: string;
  fileUrl: string;
  createdAt: string;
}

// ============================================
// 診療圏分析関連型定義
// ============================================

export interface PopulationData {
  area: string;
  totalPopulation: number;
  ageGroups: {
    age0_14: number;
    age15_64: number;
    age65Plus: number;
  };
}

export interface CompetitorClinic {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // km単位
}

export interface MarketAnalysis {
  id: string;
  clinicId: string;
  radiusKm: number;
  populationData: PopulationData;
  competitors: CompetitorClinic[];
  estimatedPotentialPatients: number;
  marketShare: number;
  analysisDate: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// フォーム関連型定義
// ============================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  inviteToken: string;
  password: string;
  passwordConfirm: string;
}

export interface PasswordResetFormData {
  email: string;
}

export interface MonthlyDataFormData {
  yearMonth: string;
  totalRevenue: number;           // 自動計算
  insuranceRevenue: number;
  selfPayRevenue: number;
  retailRevenue: number;
  variableCost: number;
  fixedCost: number;
  newPatients: number;
  returningPatients: number;
  totalPatients: number;          // 自動計算
}

export interface ClinicFormData {
  name: string;
  postalCode: string;
  address: string;
  phoneNumber: string;
}

// ============================================
// API関連型定義
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ============================================
// CSV取込関連型定義
// ============================================

export interface CsvImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

// ============================================
// ダッシュボード関連型定義
// ============================================

export type ComparisonTrend = 'positive' | 'negative' | 'neutral';

export interface KpiComparison {
  trend: ComparisonTrend;
  monthOverMonth: number;  // 前月比（%）
  yearOverYear: number;    // 前年比（%）
}

export interface DashboardKpi {
  id: string;
  label: string;           // KPI名（例: 総売上、営業利益）
  value: number;           // 現在の値
  unit: string;            // 単位（¥, %, 人）
  comparison: KpiComparison;
}

export type AlertSeverity = 'warning' | 'error' | 'info';

export interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
}

export interface MonthlyTrendData {
  yearMonth: string;       // YYYY-MM形式
  totalRevenue: number;
  operatingProfit: number;
  newPatients: number;
  returningPatients: number;
  unitUtilization: number; // ユニット稼働率（%）
  selfPayRate: number;     // 自費率（%）
}

export interface DashboardData {
  kpis: DashboardKpi[];
  alerts: DashboardAlert[];
  trends: MonthlyTrendData[];
  lastUpdated: string;
  dataSource: string;      // データソース（例: 手動入力、CSV取込）
}
