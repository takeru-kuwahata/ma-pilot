# MA-Pilot - 要件定義書

## 要件定義の作成原則

- **「あったらいいな」は絶対に作らない**
- **拡張可能性のための余分な要素は一切追加しない**
- **将来の「もしかして」のための準備は禁止**
- **今、ここで必要な最小限の要素のみ**

---

## 1. プロジェクト概要

### 1.1 成果目標

開業歯科医院がPILOT経由で経営数値を入力・自動取得し、リアルタイムな可視化・目標達成シミュレーション・戦略レポート生成を実現。データ駆動の経営判断と有料プランへの自然な転換を促す。

### 1.2 成功指標

#### 定量的指標

1. 導入医院数: リリース後6ヶ月以内に30医院以上が利用開始
2. データ入力完了率: 初回利用時に70%以上のユーザーが必須項目（売上、固定費、ユニット数等）を入力完了
3. PILOT連携成功率: 95%以上のユーザーでPILOTからのCSVデータ取込が正常動作
4. シミュレーション実行率: 月1回以上シミュレーション機能を使用するユーザーが60%以上
5. レポートDL率: 月1回以上レポートをダウンロード（PDF/CSV）するユーザーが50%以上

#### 定性的指標

1. 意思決定の自信: 「このツールのおかげで経営判断に自信が持てた」と80%以上が回答
2. 入力の手軽さ: 「PILOTデータが自動で入り、追加入力も迷わずできた」と評価
3. シミュレーションの実用性: 「提案された戦略（ユニット増設、採用計画等）が具体的で実践しやすい」と評価
4. レポートの価値: 「生成されたレポートを経営会議や銀行提出に活用できた」と評価

---

## 2. システム全体像

### 2.1 主要機能一覧

- **認証・権限管理**: メール+パスワード認証、4段階の権限管理（システム管理者、医院オーナー、医院編集者、医院閲覧者）
- **経営データ管理**: 売上、固定費、患者数、スタッフ情報等の入力・編集・一括取込
- **PILOT連携**: CSVデータ取込によるPILOT顧客データ活用
- **診療圏分析**: 人口統計・商圏データ取得、競合医院検索、地図表示
- **経営シミュレーション**: 目標逆算、戦略提案、複数シナリオ比較
- **レポート生成**: PDF/CSV形式での経営レポート自動生成
- **管理機能**: 全医院管理、アカウント管理、システム設定

### 2.2 ユーザーロールと権限

#### ゲスト

- ログイン画面のみアクセス可能

#### 医院閲覧者

- 自医院データの閲覧
- レポートダウンロード
- シミュレーション結果閲覧

#### 医院編集者

- 医院閲覧者の権限 +
- 自医院データの入力・編集
- シミュレーション実行
- PILOTデータ取込

#### 医院オーナー

- 医院編集者の権限 +
- 自医院データの削除
- スタッフアカウント管理（招待、権限変更、削除）
- 医院基本情報編集

#### システム管理者

- 全医院データの閲覧・分析
- 医院アカウント管理（有効化・無効化）
- 全医院の集計データ閲覧
- システム設定管理
- サポート対応（医院データの閲覧・修正支援）

### 2.3 認証・認可要件

#### 認証方式

- メール + パスワード認証（Supabase Auth）
- パスワードリセット機能
- 招待メール機能（オーナーが新規スタッフを招待）

#### セキュリティレベル

- 扱うデータ: 医院の経営数値（売上、利益、患者数等）
- セキュリティ分類: 機密情報（社外秘相当）
- 対応策:
  - SSL/TLS通信必須
  - Supabase Row Level Security（RLS）で医院単位のデータ分離
  - パスワードポリシー（8文字以上、英数字混在推奨）
  - セッション管理（一定期間で自動ログアウト）

#### 管理機能

- 必要性: 必須
- 具体的な機能:
  - 医院アカウント一覧・詳細閲覧
  - 医院の有効化・無効化（契約終了時）
  - 全医院の集計データ閲覧（ベンチマーク分析用）
  - サポート対応（医院データの閲覧・修正支援）
  - システム設定（通知メール設定、マスタデータ管理等）

---

## 3. ページ詳細仕様

### 3.1 実装状況

**✅ 全ページ実装完了（2025-12-26）**

- 医院ユーザー向けページ: 全10ページ実装完了（フロントエンド + バックエンドAPI統合済み）
- 管理者向けページ: 全3ページ実装完了
- 印刷物受注システム: 全3ページ実装完了

**詳細仕様**: 各ページのコード（`frontend/src/pages/`、`backend/src/api/`）を参照

---

## 4. データ設計概要

**✅ 実装完了（2025-12-26）**

詳細は以下を参照:
- **型定義**: `frontend/src/types/index.ts`（346行、全エンティティ定義済み）
- **データベーススキーマ**: `backend/supabase_schema.sql`（8テーブル、RLS設定済み）
- **バリデーション**: React Hook Form + Pydantic（二重チェック実装済み）

---

## 5. 制約事項

### 外部API制限

- **Google Maps API**: 月10,000リクエストまで無料、超過時は従量課金
- **e-Stat API**: レート制限あり（詳細は要確認）
- **RESAS API**: レート制限あり（詳細は要確認）
- **PILOT**: MVP版では手動CSVエクスポート運用（完全自動化には月額5,500円のWebhook転送機能が必要）

### 技術的制約

- **Supabase無料枠**: DB容量500MB、ストレージ1GB（超過時はProプラン移行必要）
- **Render.com無料枠**: 15分間アクセスなしで自動スリープ、初回アクセス時に起動時間が発生
- **PDF生成**: WeasyPrintはJavaScript実行不可（グラフは事前に画像化が必要）
- **CSV取込**: 1ファイル最大10,000行まで推奨（パフォーマンス考慮）

---

## 6. 複合API処理（バックエンド内部処理）

**✅ 実装完了（2025-12-26）**

詳細は以下のサービス実装を参照:
- `backend/src/services/market_analysis_service.py`
- `backend/src/services/simulation_service.py`
- `backend/src/services/report_service.py`
- `backend/src/services/monthly_data_service.py`

---

## 7. 技術スタック

### フロントエンド

```yaml
言語・フレームワーク:
  - React 18
  - TypeScript 5
  - Vite 5

UIライブラリ:
  - MUI v6（Material-UI）

状態管理:
  - Zustand（グローバル状態）
  - React Query（サーバー状態、キャッシング）

ルーティング:
  - React Router v6

グラフ・チャート:
  - Recharts

フォーム管理:
  - React Hook Form

CSV処理:
  - PapaParse
```

### バックエンド

```yaml
言語・フレームワーク:
  - Python 3.11+
  - FastAPI

データベースSDK:
  - Supabase SDK（PostgreSQL接続、認証）

PDF生成:
  - WeasyPrint

データ分析:
  - Pandas（集計、ベンチマーク分析）

外部API連携:
  - Requests（HTTP通信）

テンプレートエンジン:
  - Jinja2（PDFテンプレート）
```

### データベース・認証

```yaml
サービス:
  - Supabase（PostgreSQL + Auth + Storage）

データベース:
  - PostgreSQL 15

認証:
  - Supabase Auth（メール+パスワード）

ストレージ:
  - Supabase Storage（レポートPDF保存）

リアルタイム:
  - Supabase Realtime（ダッシュボード自動更新）
```

### 外部API

```yaml
必須API（無料）:
  - e-Stat API（人口統計）
  - RESAS API（商圏データ）
  - Community Geocoder（ジオコーディング）
  - Google Maps API（地図、競合検索）

データ連携:
  - PILOT（手動CSVエクスポート）
```

### インフラ

```yaml
フロントエンド:
  - Vercel（無料枠）

バックエンド:
  - Render.com（無料枠）または Railway

CI/CD:
  - GitHub Actions（無料枠）
```

---

## 8. 必要な外部サービス・アカウント

### 必須サービス（無料）

| サービス名 | 用途 | 取得先 | 備考 |
|-----------|------|--------|------|
| Supabase | データベース・認証・ストレージ | https://supabase.com | 無料枠: DB 500MB、5万MAU |
| e-Stat API | 人口統計データ取得 | https://www.e-stat.go.jp/api/ | 政府統計、完全無料 |
| RESAS API | 商圏データ・産業構造 | https://opendata.resas-portal.go.jp/ | 地域経済分析、無料 |
| Google Maps Platform | 地図表示・競合検索 | https://console.cloud.google.com | 無料枠: 月10,000リクエスト |
| Vercel | フロントエンドホスティング | https://vercel.com | 無料枠: 帯域100GB/月 |
| Render.com | バックエンドホスティング | https://render.com | 無料枠: 750時間/月 |

### オプションサービス（次フェーズ）

| サービス名 | 用途 | 取得先 | 備考 |
|-----------|------|--------|------|
| PILOT Webhook転送機能 | リアルタイム顧客データ連携 | PILOT管理画面 | 月額5,500円 |
| MAP-STAR Web | 歯科医院特化診療圏分析 | https://www.medicalark.co.jp/ | 月額17,000円〜 |
| Supabase Pro | DB容量拡大・優先サポート | https://supabase.com | 月額$25 |

---

## 9. 今後の拡張予定

**原則**: 拡張予定があっても、必要最小限の実装のみを行う

- 「あったらいいな」は実装しない
- 拡張可能性のための余分な要素は追加しない
- 将来の「もしかして」のための準備は禁止
- 今、ここで必要な最小限の要素のみを実装

拡張が必要になった時点で、Phase 11: 機能拡張オーケストレーターを使用して追加実装を行います。

### Phase 2: 自動化・高度化

- PILOT Webhook転送機能導入（リアルタイム自動連携）
- LINE Messaging API統合（友だち数自動取得）
- ベンチマーク機能実装（多医院データ比較）

### Phase 3: 高度な分析

- MAP-STAR Web連携（歯科医院特化診療圏分析）
- AIによる経営アドバイス生成
- 予測モデル（将来の売上・患者数予測）

### Phase 4: スケーリング

- Supabase Pro移行（医院数増加対応）
- Redis導入（キャッシュ、セッション管理）
- Celery導入（非同期タスク処理、大量レポート生成）

---

**作成日**: 2025年11月13日
**バージョン**: 1.0（MVP版）

---

## 🆕 Phase 2: 機能拡張 - ヒアリングシート機能

### 拡張概要

**追加日**: 2025-12-11
**目的**: クリニックの経営状況を定性的にヒアリングし、AI分析で課題を抽出、適切な企業をレコメンド
**実装方針**: 段階的リリース（Phase 1: 既存機能バックエンド → Phase 2: ヒアリングシート）

### 解決する課題

- 定量データ（月次データ）だけでは見えない課題の可視化
- クリニックが抱える悩みに対する具体的な解決策の提示
- 提携企業とクリニックのマッチング自動化

### 期待効果

- クリニックのエンゲージメント向上（定期ヒアリングによる接点増加）
- AI分析による客観的な強み・課題の把握
- 企業レコメンドによる新たな収益源（アフィリエイト等）

---

### 既存システムとの関係

**統合方針**: 既存システムへの追加機能（手動入力は残す、質問形式も追加）

**影響を受ける既存機能**:
- P-002 経営ダッシュボード: ヒアリング分析結果セクションを追加（タブUI）
- 認証システム: Lstep ID連携による外部認証追加

**共有するデータ**:
- Clinicエンティティ: ヒアリング回答とClinic IDの紐付け
- 認証システム: Supabase Authを共通利用

---

### 新規追加要素

#### 画面設計

**新規ページ**:
- **P-008**: ヒアリングフォーム
  - URL: `/hearing`
  - 権限: clinic_owner、clinic_editor
  - 内容: PDFベースの質問フォーム（チェックボックス、数値入力、自由記述）
  - Lstep連携: URLパラメータ `?lstep_id={ID}` でアクセス

- **P-009**: ヒアリング結果
  - URL: `/hearing/result`
  - 権限: clinic_owner、clinic_editor、clinic_viewer
  - 内容: AI分析結果（強み・課題）、企業レコメンド、履歴表示

- **A-004**: 企業管理（管理者専用）
  - URL: `/admin/companies`
  - 権限: system_admin
  - 内容: 企業CRUD、CSV一括読込

**既存ページ改修**:
- **P-002 経営ダッシュボード**:
  - タブUI追加（「数値分析」「ヒアリング分析」）
  - ヒアリング分析タブ: 最新分析結果、企業レコメンド、履歴一覧表示

#### API設計

**新規エンドポイント**:

```yaml
ヒアリング関連:
  POST /api/hearings:
    説明: ヒアリング回答を保存
    権限: clinic_owner, clinic_editor

  GET /api/hearings?clinic_id={id}:
    説明: ヒアリング履歴取得
    権限: clinic_owner, clinic_editor, clinic_viewer

  GET /api/hearings/latest?clinic_id={id}:
    説明: 最新ヒアリング取得
    権限: clinic_owner, clinic_editor, clinic_viewer

  POST /api/hearings/{hearing_id}/analyze:
    説明: AI分析実行（非同期）
    権限: system（自動実行）

  GET /api/hearings/{hearing_id}/analysis:
    説明: AI分析結果取得
    権限: clinic_owner, clinic_editor, clinic_viewer

  GET /api/hearings/{hearing_id}/recommendations:
    説明: 企業レコメンド取得
    権限: clinic_owner, clinic_editor, clinic_viewer

企業管理関連:
  GET /api/companies:
    説明: 企業一覧取得
    権限: system_admin

  POST /api/companies:
    説明: 企業作成
    権限: system_admin

  PUT /api/companies/{id}:
    説明: 企業更新
    権限: system_admin

  DELETE /api/companies/{id}:
    説明: 企業削除
    権限: system_admin

  POST /api/companies/import-csv:
    説明: CSV一括読込
    権限: system_admin

運営側分析:
  GET /api/admin/hearings:
    説明: 全クリニックヒアリング一覧・集計
    権限: system_admin
```

#### データモデル

**追加する型定義（types/index.tsに追加）**:

```typescript
// ============================================
// ヒアリング関連型定義（Phase 2追加）
// ============================================

export interface HearingResponseData {
  // 質問フォームの回答データ（詳細は実装時に確定）
  section1: {
    monthlyRevenue: number;
    staffCount: number;
    patientCount: number;
    // ... その他質問項目
  };
  section2: {
    challenges: string[];
    priorities: string[];
    // ...
  };
  section3: {
    goals: string[];
    timeline: string;
    // ...
  };
}

export interface Hearing {
  id: string;
  clinicId: string;
  lstepId?: string;
  responseData: HearingResponseData;
  isLatest: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Challenge {
  category: string;      // 課題カテゴリ（採用、マーケティング等）
  description: string;   // 課題詳細
  priority: 'high' | 'medium' | 'low';
}

export interface HearingAnalysis {
  id: string;
  hearingId: string;
  strongPoints: string[];
  challenges: Challenge[];
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  category: string;
  serviceDescription: string;
  contactEmail: string;
  websiteUrl: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  hearingAnalysisId: string;
  company: Company;
  challengeCategory: string;
  matchScore: number;  // 0-100
}
```

**データベーステーブル（Supabase）**:

```sql
-- ヒアリング回答テーブル
CREATE TABLE hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  lstep_id VARCHAR(100),
  response_data JSONB NOT NULL,
  is_latest BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI分析結果テーブル
CREATE TABLE hearing_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_id UUID REFERENCES hearings(id) ON DELETE CASCADE,
  strong_points TEXT[],
  challenges JSONB,
  analysis_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 企業マスタテーブル
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  service_description TEXT,
  contact_email VARCHAR(255),
  website_url VARCHAR(500),
  tags TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- レコメンドテーブル
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_analysis_id UUID REFERENCES hearing_analyses(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  challenge_category VARCHAR(100),
  match_score NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 実装計画

#### Phase 1: 既存機能バックエンド実装（✅ 完了 2025-12-26）

**目的**: フロントエンド10ページのバックエンドAPI実装、MVP完成

**実装成果**:
- ✅ バックエンド環境構築完了（FastAPI、Supabase接続）
- ✅ 30エンドポイント実装完了
- ✅ 10サービス実装完了
- ✅ フロントエンド・バックエンド統合完了
- ✅ TypeScriptビルドエラー0件
- ⏳ デプロイ準備完了（Vercel + Render.com）

#### Phase 2: ヒアリングシート機能実装（オプション、2-3週間）

**目的**: Phase 1完了後、ヒアリング機能を追加

**主要タスク**:
1. データベーススキーマ拡張（4テーブル）
2. 企業マスタ管理（CSV一括読込、CRUD）
3. ヒアリングフォーム（PDFベースのWebフォーム）
4. AI分析機能（Claude API統合）
5. 企業レコメンド（ルールベースマッチング）
6. ダッシュボード統合（タブUI）
7. 運営側分析機能（全クリニック集計）

**完了条件**:
- [ ] ヒアリングフォームが動作
- [ ] AI分析が実行可能
- [ ] 企業レコメンドが表示
- [ ] ダッシュボードに統合済み

---

### AI分析の仕様

**使用AI/LLM**: Claude API（Sonnet 4.5）

**分析ロジック**:
1. ヒアリング回答データ（JSON）を入力
2. Claude APIにプロンプト送信
3. 強み（配列）、課題（カテゴリ別、優先度付き）を抽出
4. 分析結果をhearing_analysesテーブルに保存

**プロンプト設計**:
- 桑畑様 + Claude Code協業で設計
- Phase 1実装中に並行準備
- Phase 2 Step 4実装前に確定

**実行タイミング**: リアルタイム分析（ヒアリング保存直後に非同期実行）

---

### 企業レコメンドの仕様

**マッチングロジック**: ルールベースマッチング（MVP版）

**スコア計算**:
- カテゴリ完全一致: +50点
- タグマッチング: +10点/1タグ（最大30点）
- 優先度加点: high +20、medium +10、low +5
- **最大100点**

**表示方法**:
- 上位5社を表示
- マッチングスコアを星（★★★★☆）で可視化
- 企業詳細（名称、カテゴリ、説明、連絡先）をカード表示

---

### Lstep連携の仕様

**連携方式**: Lstep ID連携方式

**アクセスURL**: `https://ma-pilot.com/hearing?lstep_id={ID}`

**前提条件**:
- Lstep側で各クリニックに一意のIDを発行
- MA-Pilot側でlstep_idとclinic_idのマッピングテーブルを管理

**認証フロー**:
1. Lstepから`?lstep_id={ID}`付きでアクセス
2. MA-Pilot側でlstep_idからclinic_idを取得
3. 初回アクセス時のみ簡易認証、2回目以降はシームレス

**詳細仕様**: Phase 1実装中に確定

---

### 回答データの履歴管理

**方針**: 複数回可能、履歴保存（経年変化追跡）

**理由**:
- 開業1年以内の医院が対象のため、経営状況の変化を追跡する価値が高い
- 定期ヒアリング（3ヶ月ごと）を推奨する運用
- 「課題が改善したか」をデータで検証可能

**実装**:
- hearingsテーブルで全履歴を保存
- is_latestフラグで最新回答をマーク
- ダッシュボードで「最新のみ表示」「履歴比較表示」の切替UI

---

### 制約事項・リスク

**技術的制約**:
- Claude API使用料: 1回分析あたり数円〜数十円（クリニック数×月4回で試算が必要）
- 企業データの精査・編集が必要（クライアント待ち）
- Lstep側の技術仕様確認が必要（Phase 1実装中に確定）

**ビジネス制約**:
- Phase 1完了が前提（バックエンド基盤が必須）
- 企業マスタの初期データ取得がPhase 2開始の前提

**リスクと対策**:
- AI分析精度の不確実性 → プロンプト改善、人間レビュー併用
- Claude APIレート制限 → リトライロジック、エラーハンドリング
- Lstep連携の技術的障壁 → 外部リンク方式へのフォールバック

---

### 未確定事項（Phase 1実装中に詰める）

- [ ] ヒアリングフォームの質問項目詳細（PDFのどこまでをWebフォーム化するか）
- [ ] Lstep ID連携の技術仕様（Lstep側の対応可否）
- [ ] AI分析プロンプトの詳細設計（入力・出力フォーマット）
- [ ] 企業マスタの初期データ（CSV提供時期）

---

注: 実装完了後は該当部分を削除し、コードを真実源とする

---

## 9. 印刷物受注システム（新規）

**✅ 実装完了（2025-12-26）**

**概要**:
- 目的: 歯科医院向けに診察券、名刺、リコールハガキ等の印刷物を簡単に注文できるシステムを提供
- 対象ユーザー: シカレッジ連携によるキントーン登録医院
- 印刷会社: 京葉広告
- パターン: A/B（相談フォーム）、C（再注文・自動見積もり）

**実装状況**:
- ✅ 7エンドポイント実装済み
- ✅ フロントエンド3ページ実装済み
- ✅ 見積もりPDF生成実装済み
- ✅ メール送信実装済み（MVP版: ログ出力）
- ⏳ Stripe決済連携（将来拡張）

**詳細仕様**: コード（`backend/src/api/print_orders.py`、`frontend/src/pages/PrintOrder*.tsx`）を参照

**MVP対象商品**: 診察券、名刺、リコールハガキ、A4三つ折りリーフレット、ネームプレート、その他

**注文パターン**:
- パターンA/B（相談フォーム）: メール + クリニック名のみ必須、気軽な相談向け
- パターンC（再注文）: 全項目必須、自動見積もり、PDF生成、承認フロー

**技術実装**: `frontend/src/types/index.ts`（PrintOrder、PriceTable型定義）、`backend/src/services/print_order_service.py`（見積もりロジック）、`backend/src/services/pdf_service.py`（PDF生成）参照

---
