// ============================================
// ユーザー関連型定義
// ============================================

export type UserRole = 'system_admin' | 'clinic_owner' | 'clinic_editor' | 'clinic_viewer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  clinic_id?: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// 医院関連型定義
// ============================================

export type OpenhouseStatus = 'none' | 'scheduled' | 'completed';

export interface Clinic {
  id: string;
  name: string;
  slug?: string;
  postal_code: string;
  address: string;
  phone_number: string;
  latitude: number;
  longitude: number;
  owner_id: string;
  is_active: boolean;
  openhouse_status: OpenhouseStatus;
  created_at: string;
  updated_at: string;
}

// ============================================
// 月次データ関連型定義
// ============================================

export interface MonthlyData {
  id: string;
  clinic_id: string;
  year_month: string; // YYYY-MM形式

  // 収益関連
  total_revenue: number;
  insurance_revenue: number;
  self_pay_revenue: number;

  // コスト関連
  personnel_cost: number;
  material_cost: number;
  fixed_cost: number;
  other_cost: number;

  // 患者数
  first_visit_patients: number;      // 初診
  re_first_visit_patients: number;   // 再初診
  returning_patients: number;        // 再診
  other_patients: number;            // 他
  total_patients: number;

  // 診療関連
  treatment_count: number;
  average_revenue_per_patient: number;

  created_at: string;
  updated_at: string;
}

// ============================================
// シミュレーション関連型定義
// ============================================

export interface SimulationInput {
  target_revenue: number;
  target_profit: number;
  assumed_average_revenue_per_patient: number;
  assumed_personnel_cost_rate: number;
  assumed_material_cost_rate: number;
  assumed_fixed_cost: number;
}

export interface SimulationResult {
  required_patients: number;
  required_treatments: number;
  estimated_revenue: number;
  estimated_profit: number;
  profit_margin: number;
  strategies: string[];
}

export interface Simulation {
  id: string;
  clinic_id: string;
  title: string;
  input: SimulationInput;
  result: SimulationResult;
  created_at: string;
  updated_at: string;
}

// ============================================
// レポート関連型定義
// ============================================

export type ReportType = 'monthly' | 'quarterly' | 'annual' | 'simulation' | 'market_analysis';
export type ReportFormat = 'pdf' | 'csv';

export interface Report {
  id: string;
  clinic_id: string;
  type: ReportType;
  format: ReportFormat;
  title: string;
  generated_at: string;
  file_url: string;
  created_at: string;
}

// ============================================
// 診療圏分析関連型定義
// ============================================

export interface PopulationData {
  area: string;
  total_population: number;
  age_groups: {
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
  clinic_id: string;
  radius_km: number;
  population_data: PopulationData;
  competitors: CompetitorClinic[];
  estimated_potential_patients: number;
  market_share: number;
  analysis_date: string;
  created_at: string;
  updated_at: string;
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
  year_month: string;
  total_revenue: number;              // 自動計算
  insurance_revenue: number;
  self_pay_revenue: number;
  retail_revenue: number;
  variable_cost: number;
  fixed_cost: number;
  first_visit_patients: number;       // 初診
  re_first_visit_patients: number;    // 再初診
  returning_patients: number;         // 再診
  other_patients: number;             // 他
  total_patients: number;             // 自動計算
}

export interface ClinicFormData {
  name: string;
  slug?: string;
  postal_code: string;
  address: string;
  phone_number: string;
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
  month_over_month: number;  // 前月比（%）
  year_over_year: number;    // 前年比（%）
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
  year_month: string;       // YYYY-MM形式
  total_revenue: number;
  operating_profit: number;
  new_patients: number;     // 後方互換（first_visit_patientsのエイリアス）
  returning_patients: number;
  unit_utilization: number; // ユニット稼働率（%）
  self_pay_rate: number;     // 自費率（%）
}

export interface DashboardData {
  kpis: DashboardKpi[];
  alerts: DashboardAlert[];
  trends: MonthlyTrendData[];
  last_updated: string;
  data_source: string;      // データソース（例: 手動入力、CSV取込）
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
  specifications?: string | PriceTableSpecifications; // Supabaseから直接取得時はobject、バックエンド経由は文字列
  delivery_days: number;        // 納期（日数）
  created_at: string;
  updated_at: string;
}

// Phase 2: 注文明細
export interface PrintOrderItem {
  id: string;
  order_id: string;             // 注文ID（print_ordersへの外部キー）
  product_type: string;         // 商品種類
  quantity: number;             // 数量
  unit_price: number;           // 単価（円）
  subtotal: number;             // 小計（円）
  design_fee: number;           // デザイン料（円）
  delivery_days: number;        // 納期（日数）
  specifications?: PriceTableSpecifications; // 仕様詳細
  created_at: string;
  updated_at: string;
}

export interface PrintOrder {
  id: string;
  clinic_id: string;            // クリニックID（必須）
  clinic_name: string;          // クリニック名（必須）
  email: string;                // メールアドレス（必須）
  pattern: PrintOrderPattern;   // パターン（consultation: A/B統合、reorder: C）
  specifications?: string;      // 仕様詳細（JSON形式文字列）
  delivery_date?: string;       // 納期希望日（ISO 8601形式）
  design_required?: boolean;    // デザイン要否
  notes?: string;               // 備考（自由記述）
  estimated_price?: number;     // 見積もり金額（円、パターンCのみ）
  total_amount?: number;        // 合計金額（円）Phase 2追加
  payment_method?: PaymentMethod;   // 決済方法
  payment_status: PaymentStatus;    // 決済ステータス
  order_status: OrderStatus;        // 注文ステータス
  stripe_payment_intent_id?: string; // Stripe PaymentIntent ID
  delivery_address?: string;        // 納品先住所（Phase 1）
  daytime_contact?: string;         // 日中連絡先（Phase 1）
  terms_agreed?: boolean;           // 注意事項への同意（Phase 1）
  items?: PrintOrderItem[];         // 注文明細（Phase 2）
  created_at: string;
  updated_at: string;
}

// Phase 2: フォーム入力用の商品アイテム
export interface PrintOrderFormItem {
  product_type: string;
  quantity: number;
  unit_price?: number;              // 自動計算
  subtotal?: number;                // 自動計算
  design_fee?: number;              // 自動計算
  delivery_days?: number;           // 自動計算
  specifications?: PriceTableSpecifications | string; // オブジェクトまたはJSON文字列
}

export interface PrintOrderFormData {
  clinic_id: string;
  clinic_name: string;
  email: string;
  pattern: PrintOrderPattern;
  // Phase 2: 複数商品対応
  items?: PrintOrderFormItem[];     // 商品明細リスト
  // 後方互換性のため残す（相談モードで使用）
  product_type?: string;
  quantity?: number;
  specifications?: PriceTableSpecifications | string; // オブジェクトまたはJSON文字列
  delivery_date?: string;
  design_required?: boolean;
  notes?: string;
  // Phase 1 追加フィールド
  delivery_address?: string;        // 納品先住所
  daytime_contact?: string;         // 日中連絡先
  terms_agreed?: boolean;           // 注意事項への同意
  // Phase 2 追加フィールド
  payment_method?: PaymentMethod;   // 決済方法
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
// 経営コンサルテーション関連型定義
// ============================================

export type ScoreLevel = 'critical' | 'poor' | 'average' | 'good' | 'excellent';
export type ProposalPriority = 'critical' | 'high' | 'medium' | 'low';
export type ProposalCategory = '集患' | '収益性' | 'コスト最適化' | '成長性';

export interface KpiScore {
  key: string;
  label: string;
  value: number;
  unit: string;
  score: number;          // 1-5
  level: ScoreLevel;
  benchmark_avg: number;
  benchmark_good: number;
  benchmark_label: string;
}

export interface CategoryScore {
  category: ProposalCategory;
  score: number;          // 0-100
  level: ScoreLevel;
}

export interface PartnerService {
  id: string;
  company_name: string;
  service_name: string;
  catchcopy?: string;
  description?: string;
  price_range?: string;
  service_url?: string;
  coupon_code?: string;
  logo_url?: string;
  display_priority: number;
}

export interface Proposal {
  id: string;
  priority: ProposalPriority;
  category: ProposalCategory;
  pattern_id: string;
  title: string;
  why: string;
  what: string;
  how: string[];
  expected_impact: string;
  problem_tag: string;
  recommended_services: PartnerService[];
}

export interface ConsultingReport {
  total_score: number;        // 0-100
  total_level: ScoreLevel;
  percentile: number;         // 全国上位X%
  category_scores: CategoryScore[];
  kpi_scores: KpiScore[];
  proposals: Proposal[];
  year_month: string;
  has_enough_data: boolean;
}

// ============================================
// ゲーミフィケーション関連型定義
// ============================================

export type CharacterType = 'advanbi' | 'assistant' | 'doctor';
export type CharacterMood = 'happy' | 'encouraging' | 'neutral' | 'celebrate';
export type RankType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface RadarParameter {
  key: string;
  label: string;
  value: number;      // 0-100
  previous: number;   // 前月値
}

export interface MilestoneEvent {
  key: string;
  label: string;
  message: string;
  is_new: boolean;
}

export interface GamificationData {
  clinic_id: string;
  current_rank: RankType;
  rank_label: string;
  total_score: number;
  percentile: number;
  next_rank_label?: string;
  points_to_next_rank: number;
  parameters: RadarParameter[];
  consecutive_months: number;
  total_input_months: number;
  streak_start_month?: string | null;
  new_milestones: MilestoneEvent[];
  character_type: CharacterType;
  character_message: string;
  character_mood: CharacterMood;
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
