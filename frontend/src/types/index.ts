// ============================================
// ユーザー関連型定義
// ============================================

export type UserRole = 'system_admin' | 'clinic_owner' | 'clinic_editor' | 'clinic_viewer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  clinic_id?: string;
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

// ============================================
// 印刷物受注システム関連型定義
// ============================================

export type PrintOrderPattern = 'consultation' | 'reorder';
export type PaymentMethod = 'stripe' | 'invoice';
export type PaymentStatus = 'pending' | 'paid' | 'invoiced';
export type OrderStatus = 'submitted' | 'confirmed' | 'in_production' | 'shipped' | 'completed' | 'cancelled';

export interface PriceTableSpecifications {
  corner_radius?: string;       // 角丸半径（例: 角丸なし、R3mm）
  coating?: string;             // 加工種類（例: なし、マット加工、グロス加工）
  type?: string;                // タイプ（例: standard、premium）
  material?: string;            // 素材（例: アクリル、金属）
  [key: string]: string | undefined; // その他の仕様
}

export interface PriceTable {
  id: string;
  product_type: string;         // 商品種類（診察券、名刺、リコールハガキ等）
  quantity: number;             // 数量
  price: number;                // 価格（円）
  design_fee: number;           // デザイン費（円）
  design_fee_included: boolean; // デザイン費込みかどうか
  specifications?: string;      // 仕様詳細（JSON形式文字列）
  delivery_days: number;        // 納期（日数）
  created_at: string;
  updated_at: string;
}

export interface PrintOrder {
  id: string;
  clinic_name: string;          // クリニック名（必須）
  email: string;                // メールアドレス（必須）
  pattern: PrintOrderPattern;   // パターン（consultation: A/B統合、reorder: C）
  product_type?: string;        // 商品種類（パターンCでは必須）
  quantity?: number;            // 数量（パターンCでは必須）
  specifications?: string;      // 仕様詳細（JSON形式文字列）
  delivery_date?: string;       // 納期希望日（ISO 8601形式）
  design_required?: boolean;    // デザイン要否
  notes?: string;               // 備考（自由記述）
  estimated_price?: number;     // 見積もり金額（円、パターンCのみ）
  payment_method?: PaymentMethod;   // 決済方法
  payment_status: PaymentStatus;    // 決済ステータス
  order_status: OrderStatus;        // 注文ステータス
  stripe_payment_intent_id?: string; // Stripe PaymentIntent ID
  created_at: string;
  updated_at: string;
}

export interface PrintOrderFormData {
  clinic_name: string;
  email: string;
  pattern: PrintOrderPattern;
  product_type?: string;
  quantity?: number;
  specifications?: PriceTableSpecifications;
  delivery_date?: string;
  design_required?: boolean;
  notes?: string;
}

export interface PriceEstimateRequest {
  product_type: string;
  quantity: number;
  specifications?: PriceTableSpecifications;
  design_required?: boolean;
}

export interface PriceEstimateResponse {
  estimated_price: number;
  breakdown: {
    base_price: number;
    design_fee: number;
    total: number;
  };
  delivery_days: number;
  price_table_id: string;
}

// ============================================
// UI構造リファクタリング関連型定義
// ============================================

// メニュー項目設定
export interface MenuItemConfig {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[]; // 未指定 = 全ロール
}

// レイアウトモード
export type LayoutMode = 'admin' | 'clinic' | 'public';
