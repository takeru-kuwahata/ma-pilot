// ============================================
// Phase 6: ヒアリングシート機能 - 型定義
// ============================================

// ============================================
// ヒアリング関連型定義
// ============================================

/**
 * ヒアリング回答データの構造
 * PDFベースの質問フォームに対応
 */
export interface HearingResponseData {
  section1: {
    monthlyRevenue: number;        // 月商（円）
    staffCount: number;            // スタッフ数（人）
    patientCount: number;          // 月間患者数（人）
    unitCount: number;             // ユニット数（台）
    openingYear?: number;          // 開業年（任意）
    location?: string;             // 立地（任意、例: 駅前、住宅街）
  };
  section2: {
    challenges: string[];          // 課題（複数選択）
    priorities: string[];          // 優先事項（複数選択）
    challengeDetails?: string;     // 課題の詳細（自由記述）
  };
  section3: {
    goals: string[];               // 目標（複数選択）
    timeline: string;              // 達成期限（例: 6ヶ月以内、1年以内）
    notes?: string;                // その他メモ（自由記述）
  };
}

/**
 * ヒアリングエンティティ
 */
export interface Hearing {
  id: string;
  clinicId: string;
  lstepId?: string;
  responseData: HearingResponseData;
  isLatest: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 課題の優先度
 */
export type ChallengePriority = 'high' | 'medium' | 'low';

/**
 * 課題エンティティ
 */
export interface Challenge {
  category: string;              // 課題カテゴリ（例: スタッフ採用、Webマーケティング）
  description: string;           // 課題詳細
  priority: ChallengePriority;   // 優先度
}

/**
 * AI分析ステータス
 */
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * AI分析結果エンティティ
 */
export interface HearingAnalysis {
  id: string;
  hearingId: string;
  strongPoints: string[];        // 強み（箇条書き）
  challenges: Challenge[];       // 課題（カテゴリ別、優先度付き）
  analysisStatus: AnalysisStatus;
  errorMessage?: string;         // エラーメッセージ（失敗時のみ）
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 企業関連型定義
// ============================================

/**
 * 企業エンティティ
 */
export interface Company {
  id: string;
  name: string;
  category: string;              // カテゴリ（例: スタッフ採用、Webマーケティング）
  serviceDescription: string;
  contactEmail: string;
  websiteUrl: string;
  tags: string[];                // タグ（検索用）
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 企業レコメンドエンティティ
 */
export interface Recommendation {
  id: string;
  hearingAnalysisId: string;
  company: Company;
  challengeCategory: string;     // 対応する課題カテゴリ
  matchScore: number;            // マッチングスコア（0-100）
  createdAt: string;
}

// ============================================
// フォーム関連型定義
// ============================================

/**
 * ヒアリングフォーム入力データ
 */
export interface HearingFormData {
  clinicId: string;
  lstepId?: string;
  responseData: HearingResponseData;
}

/**
 * 企業作成フォーム入力データ
 */
export interface CompanyFormData {
  name: string;
  category: string;
  serviceDescription: string;
  contactEmail: string;
  websiteUrl: string;
  tags: string[];
  isActive: boolean;
}

// ============================================
// API関連型定義
// ============================================

/**
 * ヒアリング一覧レスポンス
 */
export interface HearingListResponse {
  data: (Hearing & {
    analysis?: {
      id: string;
      analysisStatus: AnalysisStatus;
    };
  })[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * 最新ヒアリングレスポンス
 */
export interface LatestHearingResponse {
  data: Hearing & {
    analysis?: HearingAnalysis;
  };
}

/**
 * AI分析結果レスポンス
 */
export interface AnalysisResponse {
  data: HearingAnalysis;
}

/**
 * 企業レコメンドレスポンス
 */
export interface RecommendationListResponse {
  data: Recommendation[];
  total: number;
}

/**
 * 企業一覧レスポンス
 */
export interface CompanyListResponse {
  data: Company[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * CSV一括読込結果
 */
export interface CompanyCsvImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

/**
 * 管理者向けヒアリング集計データ
 */
export interface AdminHearingAggregation {
  totalHearings: number;
  completedAnalyses: number;
  failedAnalyses: number;
  pendingAnalyses: number;
  challengeCategories: Record<string, number>;
}

/**
 * 管理者向けヒアリング一覧レスポンス
 */
export interface AdminHearingListResponse {
  data: {
    hearings: Array<{
      id: string;
      clinicId: string;
      clinicName: string;
      createdAt: string;
      analysis?: {
        analysisStatus: AnalysisStatus;
        challengesCount: number;
      };
    }>;
    total: number;
    limit: number;
    offset: number;
    aggregation: AdminHearingAggregation;
  };
}

// ============================================
// 定数定義
// ============================================

/**
 * 課題カテゴリ一覧（マスタデータ）
 */
export const CHALLENGE_CATEGORIES = [
  'スタッフ採用',
  'Webマーケティング',
  'SNS運用',
  '診療効率化',
  '設備導入',
  '会計・税務',
  '研修・セミナー',
  'その他'
] as const;

/**
 * 課題カテゴリ型
 */
export type ChallengeCategory = typeof CHALLENGE_CATEGORIES[number];

/**
 * 目標達成期限の選択肢
 */
export const TIMELINE_OPTIONS = [
  '3ヶ月以内',
  '6ヶ月以内',
  '1年以内',
  '2年以内',
  '未定'
] as const;

/**
 * 目標達成期限型
 */
export type TimelineOption = typeof TIMELINE_OPTIONS[number];

/**
 * 立地の選択肢
 */
export const LOCATION_OPTIONS = [
  '駅前',
  '住宅街',
  'ロードサイド',
  'ビル内',
  'その他'
] as const;

/**
 * 立地型
 */
export type LocationOption = typeof LOCATION_OPTIONS[number];

// ============================================
// ヘルパー関数型定義
// ============================================

/**
 * マッチングスコアを星評価に変換
 * @param score マッチングスコア（0-100）
 * @returns 星の数（1-5）
 */
export const matchScoreToStars = (score: number): number => {
  if (score >= 90) return 5;
  if (score >= 70) return 4;
  if (score >= 50) return 3;
  if (score >= 30) return 2;
  return 1;
};

/**
 * 優先度をラベルに変換
 * @param priority 優先度
 * @returns 日本語ラベル
 */
export const priorityToLabel = (priority: ChallengePriority): string => {
  switch (priority) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
    default:
      return '';
  }
};

/**
 * 分析ステータスをラベルに変換
 * @param status 分析ステータス
 * @returns 日本語ラベル
 */
export const analysisStatusToLabel = (status: AnalysisStatus): string => {
  switch (status) {
    case 'pending':
      return '待機中';
    case 'processing':
      return '分析中';
    case 'completed':
      return '完了';
    case 'failed':
      return '失敗';
    default:
      return '';
  }
};

/**
 * 分析ステータスをカラーに変換（MUI Color）
 * @param status 分析ステータス
 * @returns MUIカラー文字列
 */
export const analysisStatusToColor = (status: AnalysisStatus): 'default' | 'primary' | 'success' | 'error' => {
  switch (status) {
    case 'pending':
      return 'default';
    case 'processing':
      return 'primary';
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};
