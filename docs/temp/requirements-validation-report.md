# Phase 6 要件理解検証レポート

**作成日**: 2026-01-29
**対象**: Phase 6 ヒアリングシート機能
**目的**: 開発者として即実装可能な部分とクライアント提供が必要な項目を明確化

---

## ✅ 明確に理解できた要件

### 1. データモデル（完全に明確）

**4テーブルの構造が完全に定義済み**:

#### 1.1 hearings（ヒアリング回答データ）
```sql
- id: UUID (PK)
- clinic_id: UUID (FK → clinics.id)
- lstep_id: VARCHAR(100) (Lstep連携ID、オプション)
- response_data: JSONB (ヒアリング回答、必須)
- is_latest: BOOLEAN (最新フラグ、デフォルトTRUE)
- created_at, updated_at: TIMESTAMP
```

**response_data構造**:
```json
{
  "section1": {
    "monthlyRevenue": 5000000,
    "staffCount": 10,
    "patientCount": 150,
    "unitCount": 4
  },
  "section2": {
    "challenges": ["スタッフ採用", "集患", "Webマーケティング"],
    "priorities": ["スタッフ採用", "Webマーケティング"]
  },
  "section3": {
    "goals": ["月商600万円達成", "スタッフ12名体制"],
    "timeline": "6ヶ月以内",
    "notes": "開業1年目、駅前立地"
  }
}
```

#### 1.2 hearing_analyses（AI分析結果）
```sql
- id: UUID (PK)
- hearing_id: UUID (FK → hearings.id, UNIQUE)
- strong_points: TEXT[] (強み、配列)
- challenges: JSONB (課題、カテゴリ別・優先度付き)
- analysis_status: VARCHAR(20) (pending/processing/completed/failed)
- error_message: TEXT (エラー時のみ)
- created_at, updated_at: TIMESTAMP
```

**challenges構造**:
```json
[
  {
    "category": "スタッフ採用",
    "description": "求人応募が少なく、採用が進まない",
    "priority": "high"
  }
]
```

#### 1.3 companies（企業マスタ）
```sql
- id: UUID (PK)
- name: VARCHAR(255) (UNIQUE)
- category: VARCHAR(100) (スタッフ採用、Webマーケティング等)
- service_description: TEXT
- contact_email: VARCHAR(255)
- website_url: VARCHAR(500)
- tags: TEXT[] (検索用タグ)
- is_active: BOOLEAN (有効フラグ)
- created_at, updated_at: TIMESTAMP
```

#### 1.4 recommendations（企業レコメンド結果）
```sql
- id: UUID (PK)
- hearing_analysis_id: UUID (FK → hearing_analyses.id)
- company_id: UUID (FK → companies.id)
- challenge_category: VARCHAR(100)
- match_score: NUMERIC(5,2) (0-100)
- created_at: TIMESTAMP
```

**インデックス**: 全14個定義済み（外部キー、検索用、部分インデックス含む）
**RLSポリシー**: 全テーブル分定義済み（clinic_id分離、system_admin特権）
**トリガー**: updated_at自動更新、is_latest自動更新

---

### 2. API仕様（完全に明確）

**12エンドポイント全て詳細設計済み**:

#### 2.1 ヒアリング関連API（6個）
1. **POST /api/hearings**
   - 用途: ヒアリング回答保存 → 非同期でAI分析開始
   - 権限: clinic_owner, clinic_editor
   - リクエスト: clinic_id, response_data, lstep_id(optional)
   - レスポンス: 保存成功 → hearing_id返却 → 非同期タスク実行

2. **GET /api/hearings**
   - 用途: ヒアリング履歴取得（ページネーション対応）
   - クエリ: clinic_id(必須), limit(10), offset(0)

3. **GET /api/hearings/latest**
   - 用途: 最新ヒアリング取得（is_latest=trueのレコード）
   - クエリ: clinic_id(必須)

4. **POST /api/hearings/{hearing_id}/analyze**
   - 用途: AI分析実行（**内部API**、外部呼び出し不可）
   - 処理フロー:
     1. hearing_analysesにレコード作成（status='processing'）
     2. Claude APIにプロンプト送信
     3. レスポンスから強み・課題を抽出
     4. hearing_analyses更新（status='completed'）
     5. 企業マッチングロジック実行
     6. recommendationsテーブルにInsert

5. **GET /api/hearings/{hearing_id}/analysis**
   - 用途: AI分析結果取得
   - レスポンス: strong_points, challenges, analysis_status

6. **GET /api/hearings/{hearing_id}/recommendations**
   - 用途: 企業レコメンド取得（上位5社、スコア降順）
   - クエリ: limit(デフォルト5)

#### 2.2 企業管理API（5個）
7. **GET /api/companies** (system_admin)
8. **POST /api/companies** (system_admin)
9. **PUT /api/companies/{company_id}** (system_admin)
10. **DELETE /api/companies/{company_id}** (system_admin、ソフト削除)
11. **POST /api/companies/import-csv** (system_admin)

#### 2.3 運営側分析API（1個）
12. **GET /api/admin/hearings** (system_admin)
    - 用途: 全クリニックのヒアリング一覧・集計
    - クエリ: start_date, end_date, limit, offset
    - レスポンス: 一覧 + 集計（課題カテゴリ別）

**エラーハンドリング**: 全エンドポイントでステータスコード、エラーメッセージ形式が定義済み

---

### 3. UI仕様（完全に明確）

**3ページ + 4コンポーネントの詳細設計済み**:

#### 3.1 新規ページ（3個）
1. **HearingForm.tsx** (`/hearing`)
   - ステッパーUI（3ステップ: 基本情報 / 課題・優先事項 / 目標・計画）
   - React Hook Form + Zodバリデーション
   - 送信 → POST /api/hearings → 非同期AI分析開始

2. **HearingResult.tsx** (`/hearing/result`)
   - AI分析結果表示（AIAnalysisCard）
   - 企業レコメンド表示（CompanyRecommendationカード×5）
   - ポーリング実装（分析中のみ、5秒間隔）

3. **CompanyManagement.tsx** (`/admin/companies`)
   - 企業一覧テーブル（ページネーション対応）
   - 企業作成・編集ダイアログ
   - CSV一括読込ダイアログ

#### 3.2 新規コンポーネント（4個）
4. **HearingFormSections.tsx**
   - 3ステップのフォームセクション
   - activeStepに応じて表示切り替え

5. **AIAnalysisCard.tsx**
   - 強み（箇条書きリスト）
   - 課題（カテゴリ別、優先度Chip表示）
   - ステータス表示（処理中/完了/失敗）

6. **CompanyRecommendation.tsx**
   - 企業カード（名称、カテゴリ、説明）
   - マッチングスコア（星評価: MUI Rating）
   - 連絡先、WebサイトURLリンク

7. **Dashboard.tsx（改修）**
   - タブUI追加（「数値分析」「ヒアリング分析」）
   - 「ヒアリング分析」タブで最新分析結果表示

**状態管理**: React Query（サーバー状態）+ useState（ローカル状態）+ Zustand（グローバル認証情報）
**レスポンシブ**: MUI Grid対応（PC: 2カラム、スマホ: 1カラム）

---

### 4. Claude API統合仕様（完全に明確）

#### 4.1 基本設定
- **モデル**: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- **エンドポイント**: `https://api.anthropic.com/v1/messages`
- **認証**: x-api-keyヘッダー
- **レート制限**: 60リクエスト/分（Tier 1）
- **想定コスト**: 1回分析あたり約$0.006（0.9円）

#### 4.2 プロンプト設計
**システムプロンプト**（固定）:
```
あなたは歯科医院の経営コンサルタントです。
ヒアリング回答データを分析し、クリニックの強みと課題を抽出してください。

## 分析方針
1. 強み: 3〜5個の箇条書き
2. 課題: カテゴリ別に整理し、優先度（high/medium/low）を付与

## 出力フォーマット
JSONフォーマットで返却してください。
{
  "strong_points": ["強み1", "強み2", ...],
  "challenges": [
    {"category": "カテゴリ名", "description": "課題詳細", "priority": "high|medium|low"}
  ]
}
```

**ユーザープロンプト**（テンプレート）:
```python
def generate_user_prompt(response_data):
    return f"""
以下のヒアリング回答データを分析してください。

## 基本情報
- 月商: {section1['monthlyRevenue']:,}円
- スタッフ数: {section1['staffCount']}人
- 月間患者数: {section1['patientCount']}人
- ユニット数: {section1['unitCount']}台

## 課題・優先事項
- 課題: {', '.join(section2['challenges'])}
- 優先事項: {', '.join(section2['priorities'])}

## 目標・計画
- 目標: {', '.join(section3['goals'])}
- 達成期限: {section3['timeline']}

上記のデータから、このクリニックの強みと課題を抽出してください。
JSONフォーマットで返却してください。
"""
```

#### 4.3 エラーハンドリング
- **レート制限（429）**: リトライロジック（指数バックオフ、最大3回）
- **タイムアウト**: 30秒
- **API障害**: status='failed', error_message保存
- **レスポンスパースエラー**: try-catch、ログ記録

#### 4.4 実装ファイル
- `backend/src/services/ai_service.py`（ClaudeApiService）
- 環境変数: CLAUDE_API_KEY, CLAUDE_MODEL, CLAUDE_MAX_TOKENS, CLAUDE_TEMPERATURE

---

### 5. CSV一括読込仕様（完全に明確）

#### 5.1 CSVフォーマット
```csv
name,category,service_description,contact_email,website_url,tags,is_active
デンタルハッピー,スタッフ採用,歯科特化の求人広告,contact@dental-happy.co.jp,https://dental-happy.co.jp,"求人広告,歯科特化",true
```

**文字コード**: UTF-8 BOM付き（Excel互換）
**最大行数**: 1,000行
**バリデーション**: 必須チェック、メール形式、URL形式、重複チェック

#### 5.2 処理フロー
1. CSVファイルアップロード（POST /api/companies/import-csv）
2. CSVパース（Python csv or PapaParse）
3. 行ごとにバリデーション
4. エラー行はスキップ、成功行のみInsert
5. 結果サマリー返却（成功XX件、失敗XX件、エラー詳細）

---

### 6. 技術的制約（明確）

#### 6.1 既存システム統合ポイント
- **Phase 5完了が前提**: バックエンド基盤（FastAPI、Supabase接続）必須
- **既存テーブル依存**: clinics.id（FK）、users.id（RLS）
- **既存認証**: Supabase Auth（JWT）

#### 6.2 技術スタック（確定）
- **フロントエンド**: React 18, TypeScript 5, MUI v6, React Query, React Hook Form, Zod
- **バックエンド**: Python 3.11+, FastAPI, Supabase SDK, requests（Claude API）
- **DB**: Supabase（PostgreSQL 15）
- **AI**: Claude Sonnet 4.5（Anthropic）

---

## ⚠️ 確認が必要な曖昧点

### 1. 技術的曖昧性

#### 1.1 AI分析失敗時の詳細な挙動
**質問**: Claude API呼び出し失敗時（タイムアウト、レート制限、API障害）、ユーザーにどう通知するか？

**選択肢**:
- A) ダッシュボードに「分析失敗」バナー表示、再実行ボタン提供
- B) メール通知（clinic_ownerに送信）
- C) 自動リトライのみ（最大3回）、失敗時はログ記録のみ
- D) エラー詳細をhearing_analysesテーブルに保存、UI上は「分析失敗」と表示

**推奨**: **D（エラー詳細保存 + UI表示）**
**理由**:
- ユーザーは「なぜ失敗したか」を知りたい
- system_adminがログ確認可能
- 再実行ボタンは実装コスト高（Phase 7送り可）

---

#### 1.2 並行アクセス時の制御
**質問**: 複数クリニックが同時にヒアリングを実施し、AI分析が並行実行された場合の制御は？

**選択肢**:
- A) 制限なし（Claude APIレート制限60/分まで並行実行可能）
- B) キュー管理（Semaphore使用、同時実行数10に制限）
- C) Redis等のジョブキュー（Celery導入）

**推奨**: **B（Semaphore、同時10）**
**理由**:
- MVP版ではRedis導入は過剰
- Semaphoreで十分制御可能
- 30医院×月4回=120回/月 → 1日平均4回程度、並行10で十分

---

#### 1.3 大量データ時のページネーション・ソート
**質問**: ヒアリング履歴が100件以上になった場合のUI表示は？

**選択肢**:
- A) ページネーション実装（limit=10, offset対応）
- B) 無限スクロール
- C) 最新10件のみ表示（「もっと見る」ボタン）

**推奨**: **A（ページネーション）**
**理由**:
- APIはすでにlimit/offset対応
- MUI Paginationコンポーネント利用可能
- 無限スクロールは実装コスト高

---

#### 1.4 空データ時のUI表示
**質問**: ヒアリング未実施時、ダッシュボード「ヒアリング分析」タブで何を表示するか？

**選択肢**:
- A) 「まだヒアリングを実施していません」メッセージ + 「ヒアリングを実施する」ボタン
- B) 空白（何も表示しない）
- C) サンプルデータ表示（デモ用）

**推奨**: **A（メッセージ + ボタン）**
**理由**:
- ユーザーガイダンスが明確
- アーカイブ設計書（COMPONENT_DESIGN.md line 536-541）で既に定義済み

---

### 2. 仕様的曖昧性

#### 2.1 ヒアリングフォームの質問項目詳細
**質問**: section1-3の質問項目は具体的にどこまで実装するか？

**現状**:
- section1: monthlyRevenue, staffCount, patientCount, unitCount（確定）
- section2: challenges（複数選択）、priorities（複数選択）（確定）
- section3: goals（複数選択）、timeline、notes（確定）

**曖昧点**:
- section1に「開業年（openingYear）」「立地（location）」を追加するか？
- section2に「課題詳細（challengeDetails）」自由記述欄を追加するか？
- challengesの選択肢リストは何か？（例: スタッフ採用、集患、Webマーケティング、診療効率化、設備導入、会計・税務、研修・セミナー）

**推奨**:
- section1: **openingYear, locationを追加**（AI分析精度向上に有用）
- section2: **challengeDetailsを追加**（自由記述、オプション）
- challenges選択肢: **7カテゴリ固定**（companies.categoryと同期）

**最終確定**: クライアント確認必要（優先度: 中）

---

#### 2.2 AI分析プロンプトの最終版
**質問**: 現在のプロンプトテンプレートで十分か？

**現状**: システムプロンプト + ユーザープロンプト定義済み

**曖昧点**:
- 強みの抽出基準は？（例: 「駅前立地」は強みか？）
- 課題の優先度判定基準は？（例: 「スタッフ採用」が最優先事項ならhigh？）

**推奨**:
- **Phase 6-A（モックデータ）で仮プロンプト実装**
- **Phase 6-B（Claude API統合）で実際に分析実行し、プロンプト改善**
- クライアントレビュー後、最終版確定

**最終確定**: Phase 6-B実装中に調整可能

---

#### 2.3 企業レコメンドのスコアリングロジック
**質問**: マッチングスコア（0-100）の計算方法は？

**現状**: ルールベースマッチング方針のみ定義

**曖昧点**:
- カテゴリ完全一致: 50点
- タグマッチング: 10点×N（最大30点）
- 優先度加点: high=20, medium=10, low=5

**推奨**: **上記ロジックで実装（Phase 6-A）**

**最終確定**: Phase 6-C（本番データ投入後）にクライアントレビュー、調整可能

---

#### 2.4 権限制御の細かい仕様
**質問**: clinic_editorは自医院のヒアリング履歴を削除できるか？

**現状**:
- clinic_viewer: 閲覧のみ
- clinic_editor: 閲覧・編集
- clinic_owner: 閲覧・編集・削除

**曖昧点**:
- clinic_editorの「編集」は何を指すか？（ヒアリング回答の再編集？）
- clinic_ownerの「削除」は物理削除かソフト削除か？

**推奨**:
- clinic_editor: **ヒアリング回答の作成のみ可能（編集・削除不可）**
- clinic_owner: **ヒアリング回答の削除可能（物理削除）**
- 理由: ヒアリング履歴は経年変化追跡のため、編集は不可とする

**最終確定**: クライアント確認必要（優先度: 低）

---

### 3. データ仕様の曖昧性

#### 3.1 企業マスタのCSVフォーマット（最終確定版）
**質問**: 初期データのCSVフォーマットは確定しているか？

**現状**:
- カラム定義: 確定（7カラム）
- サンプルCSV: 3行のサンプルあり

**曖昧点**:
- 実際の企業データのCSVは誰が作成するか？
- 50社分のデータはいつ提供されるか？

**推奨**:
- **Phase 6-A開始前にクライアントに確認**
- 未提供の場合: **サンプルデータ50件を自動生成して開発進行**（架空企業でOK）

**最終確定**: Phase 6-A開始前（優先度: 高）

---

#### 3.2 ヒアリング回答のJSONスキーマ（最終確定版）
**質問**: response_dataのJSONスキーマは確定しているか？

**現状**:
- section1: monthlyRevenue, staffCount, patientCount, unitCount（確定）
- section2: challenges, priorities（確定）
- section3: goals, timeline, notes（確定）

**曖昧点**:
- section1にopeningYear, locationを追加するか？（上記2.1と同じ）
- 各フィールドの型定義は？（number, string, string[]）

**推奨**:
- **TypeScript型定義を作成**（frontend/src/types/phase6.ts）
- **Pydantic型定義を作成**（backend/src/types/phase6.py）
- **両者を同期**

**最終確定**: Phase 6-A（Step 1）で実装時に確定可能

---

#### 3.3 AI分析結果のJSONスキーマ（最終確定版）
**質問**: challenges配列の要素数は何件まで許容するか？

**現状**:
- strong_points: 3〜5個（プロンプトで指定）
- challenges: カテゴリ別、優先度付き（件数不明）

**曖昧点**:
- challengesが10件以上返ってきた場合、全て保存するか？上位5件のみか？
- challengesの最大件数制限は？

**推奨**:
- **全て保存**（件数制限なし）
- **UI表示時に上位5件のみ表示**（優先度high優先、降順ソート）

**最終確定**: Phase 6-B（Claude API統合）で実際のレスポンス確認後、調整可能

---

## 🚧 クライアント提供が必要な項目

### 即座に必要（Phase 6-B開始前）

#### ☑️ Claude APIキー
- **提供元**: Anthropic Console（https://console.anthropic.com/）
- **登録方法**:
  1. Anthropic Console登録（クレジットカード必要）
  2. APIキー生成（`sk-ant-api03-...`形式）
  3. 月次利用上限設定（推奨: $10/月）
- **納期**: Phase 6-A完了後、Phase 6-B開始前（約1週間後）
- **代替案**: なし（MVP版でClaude API必須）

---

### Phase 6-C開始前に必要

#### ☑️ 企業マスタCSVデータ（50-100件）
- **フォーマット**: `docs/PHASE6_COMPANY_CSV_FORMAT.md`記載のCSV形式
- **必須カラム**: name, category, service_description, contact_email, website_url, tags, is_active
- **サンプル**:
```csv
name,category,service_description,contact_email,website_url,tags,is_active
デンタルハッピー,スタッフ採用,歯科特化の求人広告,contact@dental-happy.co.jp,https://dental-happy.co.jp,"求人広告,歯科特化",true
```
- **納期**: Phase 6-C開始前（Phase 6-A完了後、約2週間後）
- **代替案**: **サンプルデータ50件を自動生成**（架空企業で開発継続可能）

---

#### ☑️ ヒアリング質問項目の最終確定
- **対象**: section1-3の質問項目詳細
- **曖昧点**:
  - section1にopeningYear, locationを追加するか？
  - section2のchallenges選択肢リストは何か？（例: 7カテゴリ固定）
  - section2にchallengeDetails自由記述欄を追加するか？
- **納期**: Phase 6-A開始前（1週間以内）
- **代替案**: **仮定義で実装開始**（後で調整可能）

---

### オプション（Phase 7送り可）

#### ☑️ Lstep連携仕様確定
- **連携方式**: Lstep ID連携方式（URLパラメータ `?lstep_id={ID}`）
- **前提条件**:
  - Lstep側で各クリニックに一意のIDを発行
  - MA-Pilot側でlstep_idとclinic_idのマッピングテーブル管理
- **曖昧点**:
  - Lstep側の対応可否
  - lstep_idの形式（UUID? 独自形式?）
  - 認証フロー詳細（初回アクセス時の簡易認証方法）
- **納期**: Phase 6完了後でも可（Phase 7で追加実装可能）
- **代替案**: **Lstep連携なしでMVP版リリース**（手動ログイン運用）

---

#### ☑️ Lstep側の対応状況確認
- **確認事項**:
  - Lstep側でヒアリングフォームへの誘導リンク設置可能か？
  - lstep_id発行可能か？
  - MA-Pilot側への認証情報連携可能か？
- **納期**: Phase 6完了後でも可
- **代替案**: **外部リンク方式**（Lstep → MA-Pilot手動ログイン）

---

## 📋 開発戦略

### Phase 6-A: 即実装可能（2週間）
**クライアント依存なし、モックデータで完結**

#### Step 1: DB・型定義（1-2日）
- **実装内容**:
  - [ ] Supabaseテーブル4個作成（hearings, hearing_analyses, companies, recommendations）
  - [ ] インデックス14個作成
  - [ ] RLSポリシー設定（全テーブル）
  - [ ] トリガー作成（updated_at自動更新、is_latest自動更新）
  - [ ] TypeScript型定義（frontend/src/types/phase6.ts）
  - [ ] Python型定義（backend/src/types/phase6.py）

- **成果物**:
  - `PHASE6_DATABASE_DESIGN.md`記載のDDL実行完了
  - 型定義ファイル2個作成完了

- **テスト**:
  - Supabase Studio上でテーブル作成確認
  - RLSポリシー動作確認（SELECT/INSERT/UPDATE/DELETE）

---

#### Step 2: 企業管理（2-3日）
- **実装内容**:
  - [ ] バックエンドAPI 5個実装（GET/POST/PUT/DELETE /api/companies, POST /api/companies/import-csv）
  - [ ] CSV一括読込機能実装（CSVパース、バリデーション、エラーハンドリング）
  - [ ] CompanyManagement.tsx実装（企業一覧テーブル、作成・編集ダイアログ、CSV読込ダイアログ）
  - [ ] サンプルデータ50件生成（架空企業）

- **成果物**:
  - バックエンドAPI 5エンドポイント動作確認完了
  - CompanyManagement.tsx動作確認完了
  - サンプルデータ50件登録完了

- **テスト**:
  - 企業CRUD操作（正常系・異常系）
  - CSV一括読込（正常系・異常系）

---

#### Step 3: ヒアリングフォーム骨格（3-4日）
- **実装内容**:
  - [ ] バックエンドAPI 3個実装（POST/GET /api/hearings, GET /api/hearings/latest）
  - [ ] HearingForm.tsx実装（ステッパーUI、3ステップフォーム）
  - [ ] HearingFormSections.tsx実装（section1-3の入力フォーム）
  - [ ] React Hook Form + Zodバリデーション実装
  - [ ] サンプル質問項目でモックアップ

- **成果物**:
  - バックエンドAPI 3エンドポイント動作確認完了
  - HearingForm.tsx動作確認完了
  - フォーム入力〜送信の一連の流れ動作確認完了

- **テスト**:
  - フォーム入力〜送信テスト
  - バリデーションテスト（必須項目、数値範囲）

---

#### Step 4: AI分析骨格（2-3日）
- **実装内容**:
  - [ ] バックエンドAPI 2個実装（POST /api/hearings/{id}/analyze, GET /api/hearings/{id}/analysis）
  - [ ] **モックレスポンス実装**（Claude API呼び出しなし、固定JSON返却）
  - [ ] AIAnalysisCard.tsx実装（強み・課題表示、ステータス表示）
  - [ ] 分析結果表示UI実装

- **成果物**:
  - バックエンドAPI 2エンドポイント動作確認完了（モックレスポンス）
  - AIAnalysisCard.tsx動作確認完了

- **テスト**:
  - モック分析結果表示テスト

---

#### Step 5: ダッシュボード統合（2-3日）
- **実装内容**:
  - [ ] Dashboard.tsx改修（タブUI追加）
  - [ ] HearingResult.tsx実装（分析結果詳細ページ）
  - [ ] CompanyRecommendation.tsx実装（企業カード表示、星評価）
  - [ ] 企業レコメンドAPI実装（GET /api/hearings/{id}/recommendations、モックレスポンス）

- **成果物**:
  - Dashboard.tsx動作確認完了（タブ切り替え）
  - HearingResult.tsx動作確認完了
  - CompanyRecommendation.tsx動作確認完了

- **テスト**:
  - タブ切り替えテスト
  - 最新ヒアリング表示テスト
  - 企業レコメンド表示テスト（モックデータ）

---

**Phase 6-A完了時点**:
- ✅ UIフロー全体が動作（モックデータ）
- ✅ クライアントレビュー可能（実際のヒアリング実施〜結果表示まで体験可能）
- ✅ Claude APIキー取得の準備期間（次週Phase 6-B開始までに取得）

---

### Phase 6-B: Claude API統合（3-4日）
**前提: Claude APIキー取得済み**

#### 実装内容
- [ ] ClaudeApiService実装（Python、requests使用）
- [ ] プロンプトテンプレート実装（システムプロンプト + ユーザープロンプト）
- [ ] レスポンスパース処理実装
- [ ] エラーハンドリング実装（レート制限、タイムアウト、API障害）
- [ ] リトライロジック実装（指数バックオフ、最大3回）
- [ ] 環境変数設定（.env.local、Render.com）
- [ ] AI分析処理実装（実API呼び出し）

#### 成果物
- ClaudeApiService動作確認完了
- 実際のヒアリング回答でAI分析実行成功
- プロンプト最適化完了（クライアントレビュー後）

#### テスト
- Claude API呼び出しテスト（正常系・異常系）
- プロンプト生成テスト
- レスポンスパーステスト
- エラーハンドリングテスト

---

### Phase 6-C: 本番データ投入（1-2日）
**前提: 企業マスタCSV、質問項目最終版提供済み**

#### 実装内容
- [ ] 企業マスタ本番データ投入（CSV一括読込）
- [ ] ヒアリング質問項目調整（section1-3の最終確定）
- [ ] E2Eテスト（全機能統合テスト）

#### 成果物
- 企業マスタ本番データ50件以上登録完了
- ヒアリング質問項目最終版実装完了
- 全機能統合テスト完了

#### テスト
- E2Eテスト（ヒアリング実施〜AI分析〜企業レコメンド表示）

---

## 🎯 次のアクション

### 開発者として即座に実施可能

#### 1. Phase 6-A（即実装可能）の実装計画策定
- **タスク**: Step 1〜5の詳細タスク分解
- **見積もり**: 各ステップ1-3日、合計2週間
- **開始条件**: なし（即開始可能）

#### 2. Step 1（DB・型定義）から実装開始
- **優先度**: 最高（全ステップの前提）
- **所要時間**: 1-2日
- **成果物**: テーブル4個、型定義2ファイル

#### 3. クライアント提供リストの整理・送付
- **対象**: 上記「🚧 クライアント提供が必要な項目」セクション
- **納期目安**:
  - Claude APIキー: 1週間後（Phase 6-B開始前）
  - 企業マスタCSV: 2週間後（Phase 6-C開始前）
  - ヒアリング質問項目: 1週間以内（Phase 6-A開始前、ただし仮定義で開発継続可能）

---

### クライアント提供待ち

#### 1. Claude APIキー（Phase 6-B開始前）
- **取得先**: https://console.anthropic.com/
- **登録方法**: クレジットカード登録、APIキー生成
- **月次利用上限**: $10/月推奨（120回分析で約$0.72、余裕を持って設定）
- **納期**: Phase 6-A完了後、約1週間後

#### 2. 企業マスタCSV（Phase 6-C開始前）
- **フォーマット**: `docs/PHASE6_COMPANY_CSV_FORMAT.md`参照
- **件数**: 50-100件
- **納期**: Phase 6-B完了後、約2週間後
- **代替案**: サンプルデータ50件で開発継続可能

#### 3. ヒアリング質問項目最終版（Phase 6-C開始前）
- **対象**: section1-3の質問項目詳細
- **納期**: Phase 6-A開始前（1週間以内）
- **代替案**: 仮定義で実装開始、後で調整可能

---

## 📊 開発スケジュール概算

```
Week 1-2: Phase 6-A（即実装可能）
  Day 1-2:   Step 1（DB・型定義）
  Day 3-5:   Step 2（企業管理）
  Day 6-9:   Step 3（ヒアリングフォーム骨格）
  Day 10-12: Step 4（AI分析骨格、モック）
  Day 13-15: Step 5（ダッシュボード統合）
  → クライアントレビュー、Claude APIキー取得

Week 3: Phase 6-B（Claude API統合）
  Day 1-2:   ClaudeApiService実装
  Day 3:     プロンプト最適化
  Day 4:     エラーハンドリング・テスト
  → 企業マスタCSV提供待ち

Week 4: Phase 6-C（本番データ投入）
  Day 1:     企業マスタ本番データ投入
  Day 2:     ヒアリング質問項目最終調整
  Day 3-5:   E2Eテスト、バグ修正
  → Phase 6完了

合計: 3-4週間
```

---

## 🔍 要件理解度サマリー

### 完全に理解できた要件（実装可能）
- ✅ データモデル（4テーブル、完全定義済み）
- ✅ API仕様（12エンドポイント、完全定義済み）
- ✅ UI仕様（3ページ + 4コンポーネント、完全定義済み）
- ✅ Claude API統合仕様（プロンプト、エラーハンドリング含む）
- ✅ CSV一括読込仕様（フォーマット、バリデーション含む）
- ✅ 技術スタック、技術的制約

### 曖昧だが対応可能な要件（仮実装→調整）
- ⚠️ AI分析失敗時の詳細な挙動 → **仮実装（エラー詳細保存 + UI表示）**
- ⚠️ 並行アクセス時の制御 → **仮実装（Semaphore、同時10）**
- ⚠️ ヒアリング質問項目詳細 → **仮実装（7カテゴリ固定）**
- ⚠️ 企業レコメンドのスコアリングロジック → **仮実装（ルールベース）**

### クライアント提供待ち（代替案あり）
- 🚧 Claude APIキー → **Phase 6-B前に取得**（代替案: なし）
- 🚧 企業マスタCSV → **Phase 6-C前に提供**（代替案: サンプルデータ50件）
- 🚧 ヒアリング質問項目最終版 → **Phase 6-A前に確認**（代替案: 仮定義）

### オプション（Phase 7送り可）
- 🔄 Lstep連携仕様確定 → **Phase 7で追加実装可能**

---

**作成者**: Claude Code（ブルーランプエージェント）
**最終更新日**: 2026-01-29
**レポート作成時間**: 約30分（7ファイル、3,500行分析）
