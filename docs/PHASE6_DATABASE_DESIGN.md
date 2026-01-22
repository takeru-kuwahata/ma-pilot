# Phase 6: ヒアリングシート機能 - データベース設計書

**作成日**: 2025-12-26
**バージョン**: 1.0
**対象DBMS**: Supabase（PostgreSQL 15）

---

## 1. テーブル一覧

| テーブル名 | 用途 | レコード数（想定） |
|-----------|------|-------------------|
| hearings | ヒアリング回答データ | クリニック数 × 年4回 = 120件/30医院 |
| hearing_analyses | AI分析結果 | hearings と 1:1 = 120件/30医院 |
| companies | 企業マスタ | 100-200件（初期） |
| recommendations | 企業レコメンド結果 | 分析あたり5件 = 600件/30医院 |

---

## 2. テーブル定義

### 2.1 hearings（ヒアリング回答データ）

**用途**: クリニックのヒアリング回答を保存

**DDL（SQL）**:
```sql
CREATE TABLE hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  lstep_id VARCHAR(100),
  response_data JSONB NOT NULL,
  is_latest BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- インデックス
  CONSTRAINT hearings_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX idx_hearings_clinic_id ON hearings(clinic_id);
CREATE INDEX idx_hearings_lstep_id ON hearings(lstep_id);
CREATE INDEX idx_hearings_is_latest ON hearings(clinic_id, is_latest) WHERE is_latest = TRUE;
CREATE INDEX idx_hearings_created_at ON hearings(created_at DESC);

-- トリガー: updated_at自動更新
CREATE OR REPLACE FUNCTION update_hearings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_hearings_updated_at
  BEFORE UPDATE ON hearings
  FOR EACH ROW
  EXECUTE FUNCTION update_hearings_updated_at();
```

**カラム詳細**:

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
|---------|-----|---------|----------|------|
| id | UUID | NO | gen_random_uuid() | ヒアリングID（PK） |
| clinic_id | UUID | NO | - | 医院ID（FK: clinics.id） |
| lstep_id | VARCHAR(100) | YES | - | Lstep連携ID |
| response_data | JSONB | NO | - | ヒアリング回答データ（JSON形式） |
| is_latest | BOOLEAN | NO | TRUE | 最新回答フラグ |
| created_at | TIMESTAMP WITH TIME ZONE | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NO | NOW() | 更新日時 |

**response_data構造例**:
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

**バリデーションルール**:
- clinic_id: 既存のclinicsテーブルに存在するIDのみ
- response_data: 必須、有効なJSON形式
- is_latest: 同一clinic_idで1件のみTRUE（トリガーで制御）

---

### 2.2 hearing_analyses（AI分析結果）

**用途**: Claude APIによる分析結果を保存

**DDL（SQL）**:
```sql
CREATE TABLE hearing_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_id UUID NOT NULL REFERENCES hearings(id) ON DELETE CASCADE,
  strong_points TEXT[],
  challenges JSONB,
  analysis_status VARCHAR(20) DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 制約
  CONSTRAINT hearing_analyses_hearing_id_fkey FOREIGN KEY (hearing_id) REFERENCES hearings(id) ON DELETE CASCADE,
  CONSTRAINT hearing_analyses_hearing_id_unique UNIQUE (hearing_id)
);

-- インデックス作成
CREATE INDEX idx_hearing_analyses_hearing_id ON hearing_analyses(hearing_id);
CREATE INDEX idx_hearing_analyses_status ON hearing_analyses(analysis_status);

-- トリガー: updated_at自動更新
CREATE TRIGGER trigger_hearing_analyses_updated_at
  BEFORE UPDATE ON hearing_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_hearings_updated_at();
```

**カラム詳細**:

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
|---------|-----|---------|----------|------|
| id | UUID | NO | gen_random_uuid() | 分析ID（PK） |
| hearing_id | UUID | NO | - | ヒアリングID（FK: hearings.id、UNIQUE） |
| strong_points | TEXT[] | YES | - | 強み（文字列配列） |
| challenges | JSONB | YES | - | 課題（カテゴリ別、優先度付きJSON） |
| analysis_status | VARCHAR(20) | NO | 'pending' | 分析ステータス |
| error_message | TEXT | YES | - | エラーメッセージ（失敗時のみ） |
| created_at | TIMESTAMP WITH TIME ZONE | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NO | NOW() | 更新日時 |

**challenges構造例**:
```json
[
  {
    "category": "スタッフ採用",
    "description": "求人応募が少なく、採用が進まない",
    "priority": "high"
  },
  {
    "category": "Webマーケティング",
    "description": "SNS運用のノウハウが不足している",
    "priority": "medium"
  },
  {
    "category": "診療効率化",
    "description": "ユニット稼働率が低い",
    "priority": "low"
  }
]
```

**バリデーションルール**:
- hearing_id: 既存のhearingsテーブルに存在するIDのみ、1対1
- analysis_status: 'pending', 'processing', 'completed', 'failed'のいずれか
- strong_points: NULL許可、空配列も許可
- challenges: NULL許可、有効なJSON配列

---

### 2.3 companies（企業マスタ）

**用途**: レコメンド対象企業の情報を保存

**DDL（SQL）**:
```sql
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- インデックス
  CONSTRAINT companies_name_unique UNIQUE (name)
);

-- インデックス作成
CREATE INDEX idx_companies_category ON companies(category);
CREATE INDEX idx_companies_is_active ON companies(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_companies_tags ON companies USING GIN(tags);

-- トリガー: updated_at自動更新
CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_hearings_updated_at();
```

**カラム詳細**:

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
|---------|-----|---------|----------|------|
| id | UUID | NO | gen_random_uuid() | 企業ID（PK） |
| name | VARCHAR(255) | NO | - | 企業名（UNIQUE） |
| category | VARCHAR(100) | NO | - | カテゴリ（スタッフ採用、Webマーケティング等） |
| service_description | TEXT | YES | - | サービス説明 |
| contact_email | VARCHAR(255) | YES | - | 連絡先メールアドレス |
| website_url | VARCHAR(500) | YES | - | WebサイトURL |
| tags | TEXT[] | YES | - | タグ（検索用） |
| is_active | BOOLEAN | NO | TRUE | 有効フラグ |
| created_at | TIMESTAMP WITH TIME ZONE | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NO | NOW() | 更新日時 |

**カテゴリ例**:
- スタッフ採用
- Webマーケティング
- SNS運用
- 診療効率化
- 設備導入
- 会計・税務
- 研修・セミナー

**tags例**:
```sql
tags = ARRAY['求人広告', '歯科特化', '成果報酬型']
```

**バリデーションルール**:
- name: 必須、UNIQUE、255文字以内
- category: 必須、100文字以内
- contact_email: 有効なメール形式
- website_url: 有効なURL形式、https://推奨
- tags: NULL許可、空配列も許可

---

### 2.4 recommendations（企業レコメンド結果）

**用途**: AI分析結果に基づく企業レコメンドを保存

**DDL（SQL）**:
```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_analysis_id UUID NOT NULL REFERENCES hearing_analyses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  challenge_category VARCHAR(100),
  match_score NUMERIC(5,2) CHECK (match_score >= 0 AND match_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 制約
  CONSTRAINT recommendations_hearing_analysis_id_fkey FOREIGN KEY (hearing_analysis_id) REFERENCES hearing_analyses(id) ON DELETE CASCADE,
  CONSTRAINT recommendations_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT recommendations_unique_pair UNIQUE (hearing_analysis_id, company_id)
);

-- インデックス作成
CREATE INDEX idx_recommendations_hearing_analysis_id ON recommendations(hearing_analysis_id);
CREATE INDEX idx_recommendations_company_id ON recommendations(company_id);
CREATE INDEX idx_recommendations_match_score ON recommendations(match_score DESC);
CREATE INDEX idx_recommendations_challenge_category ON recommendations(challenge_category);
```

**カラム詳細**:

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
|---------|-----|---------|----------|------|
| id | UUID | NO | gen_random_uuid() | レコメンドID（PK） |
| hearing_analysis_id | UUID | NO | - | 分析ID（FK: hearing_analyses.id） |
| company_id | UUID | NO | - | 企業ID（FK: companies.id） |
| challenge_category | VARCHAR(100) | YES | - | 対応する課題カテゴリ |
| match_score | NUMERIC(5,2) | YES | - | マッチングスコア（0-100） |
| created_at | TIMESTAMP WITH TIME ZONE | NO | NOW() | 作成日時 |

**バリデーションルール**:
- hearing_analysis_id: 既存のhearing_analysesテーブルに存在するIDのみ
- company_id: 既存のcompaniesテーブルに存在するIDのみ
- match_score: 0〜100の範囲、小数点2桁まで
- hearing_analysis_id + company_idのペアは一意

---

## 3. ER図（テキスト形式）

```
┌─────────────────┐
│    clinics      │ (既存テーブル)
│─────────────────│
│ PK: id          │
│     name        │
│     ...         │
└────────┬────────┘
         │ 1:N
         ↓
┌─────────────────┐
│    hearings     │
│─────────────────│
│ PK: id          │
│ FK: clinic_id   │
│     lstep_id    │
│     response_data│
│     is_latest   │
│     created_at  │
│     updated_at  │
└────────┬────────┘
         │ 1:1
         ↓
┌─────────────────────┐
│ hearing_analyses    │
│─────────────────────│
│ PK: id              │
│ FK: hearing_id (U)  │
│     strong_points   │
│     challenges      │
│     analysis_status │
│     error_message   │
│     created_at      │
│     updated_at      │
└────────┬────────────┘
         │ 1:N
         ↓
┌─────────────────────┐
│ recommendations     │
│─────────────────────│
│ PK: id              │
│ FK: hearing_analysis_id│
│ FK: company_id      │
│     challenge_category│
│     match_score     │
│     created_at      │
└─────────┬───────────┘
          │ N:1
          ↓
     ┌─────────────┐
     │  companies  │
     │─────────────│
     │ PK: id      │
     │     name (U)│
     │     category│
     │     service_description│
     │     contact_email│
     │     website_url│
     │     tags     │
     │     is_active│
     │     created_at│
     │     updated_at│
     └─────────────┘
```

**リレーション説明**:
- **clinics → hearings**: 1対多（1医院は複数回ヒアリング可能）
- **hearings → hearing_analyses**: 1対1（1回答に1分析）
- **hearing_analyses → recommendations**: 1対多（1分析に複数企業レコメンド）
- **companies → recommendations**: 1対多（1企業は複数の分析でレコメンド可能）

---

## 4. インデックス設計

### 4.1 主キーインデックス（自動作成）

全テーブルで`id`カラムにPRIMARY KEY制約によるインデックス作成済み。

### 4.2 外部キーインデックス

| テーブル | カラム | インデックス名 | 理由 |
|---------|--------|---------------|------|
| hearings | clinic_id | idx_hearings_clinic_id | 医院別ヒアリング一覧取得の高速化 |
| hearings | lstep_id | idx_hearings_lstep_id | Lstep ID検索の高速化 |
| hearing_analyses | hearing_id | idx_hearing_analyses_hearing_id | ヒアリング→分析結果の取得高速化 |
| recommendations | hearing_analysis_id | idx_recommendations_hearing_analysis_id | 分析→レコメンド取得の高速化 |
| recommendations | company_id | idx_recommendations_company_id | 企業別レコメンド履歴取得の高速化 |

### 4.3 検索用インデックス

| テーブル | カラム | インデックス名 | 理由 |
|---------|--------|---------------|------|
| hearings | (clinic_id, is_latest) | idx_hearings_is_latest | 最新ヒアリング取得の高速化（部分インデックス） |
| hearings | created_at | idx_hearings_created_at | 日時ソートの高速化（DESC） |
| hearing_analyses | analysis_status | idx_hearing_analyses_status | ステータス別絞り込みの高速化 |
| companies | category | idx_companies_category | カテゴリ別検索の高速化 |
| companies | is_active | idx_companies_is_active | 有効企業のみ取得の高速化（部分インデックス） |
| companies | tags | idx_companies_tags | タグ検索の高速化（GINインデックス） |
| recommendations | match_score | idx_recommendations_match_score | スコア降順ソートの高速化（DESC） |
| recommendations | challenge_category | idx_recommendations_challenge_category | 課題カテゴリ別絞り込みの高速化 |

---

## 5. RLS（Row Level Security）設定

### 5.1 hearings テーブル

**ポリシー名**: `clinic_users_own_hearings`

**対象ロール**: `authenticated`

**SELECT ポリシー**:
```sql
CREATE POLICY clinic_users_own_hearings_select ON hearings
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin'
    )
  );
```

**INSERT ポリシー**:
```sql
CREATE POLICY clinic_users_own_hearings_insert ON hearings
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid() AND role IN ('clinic_owner', 'clinic_editor')
    )
  );
```

**UPDATE ポリシー**:
```sql
CREATE POLICY clinic_users_own_hearings_update ON hearings
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid() AND role IN ('clinic_owner', 'clinic_editor')
    )
  );
```

**DELETE ポリシー**:
```sql
CREATE POLICY clinic_users_own_hearings_delete ON hearings
  FOR DELETE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid() AND role = 'clinic_owner'
    )
  );
```

### 5.2 hearing_analyses テーブル

**ポリシー名**: `clinic_users_own_analyses`

**SELECT ポリシー**:
```sql
CREATE POLICY clinic_users_own_analyses_select ON hearing_analyses
  FOR SELECT
  USING (
    hearing_id IN (
      SELECT h.id FROM hearings h
      INNER JOIN users u ON h.clinic_id = u.clinic_id
      WHERE u.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin'
    )
  );
```

**INSERT/UPDATE ポリシー**: システム内部処理のみ（APIサーバー経由）

### 5.3 companies テーブル

**ポリシー名**: `all_users_read_companies`

**SELECT ポリシー**:
```sql
CREATE POLICY all_users_read_companies ON companies
  FOR SELECT
  USING (is_active = TRUE);
```

**INSERT/UPDATE/DELETE ポリシー**: `system_admin`のみ
```sql
CREATE POLICY admin_manage_companies ON companies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin'
    )
  );
```

### 5.4 recommendations テーブル

**ポリシー名**: `clinic_users_own_recommendations`

**SELECT ポリシー**:
```sql
CREATE POLICY clinic_users_own_recommendations_select ON recommendations
  FOR SELECT
  USING (
    hearing_analysis_id IN (
      SELECT ha.id FROM hearing_analyses ha
      INNER JOIN hearings h ON ha.hearing_id = h.id
      INNER JOIN users u ON h.clinic_id = u.clinic_id
      WHERE u.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin'
    )
  );
```

**INSERT/UPDATE/DELETE ポリシー**: システム内部処理のみ（APIサーバー経由）

---

## 6. トリガー設計

### 6.1 updated_at自動更新トリガー

**対象テーブル**: hearings, hearing_analyses, companies

**トリガー関数**:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**トリガー作成**:
```sql
CREATE TRIGGER trigger_hearings_updated_at
  BEFORE UPDATE ON hearings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_hearing_analyses_updated_at
  BEFORE UPDATE ON hearing_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 6.2 is_latest フラグ自動更新トリガー

**用途**: 新しいヒアリングが作成された際、同一clinic_idの既存ヒアリングのis_latestをFALSEに変更

**トリガー関数**:
```sql
CREATE OR REPLACE FUNCTION update_hearings_is_latest()
RETURNS TRIGGER AS $$
BEGIN
  -- 同一clinic_idの既存ヒアリングのis_latestをFALSEに更新
  UPDATE hearings
  SET is_latest = FALSE
  WHERE clinic_id = NEW.clinic_id AND id != NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**トリガー作成**:
```sql
CREATE TRIGGER trigger_hearings_is_latest
  AFTER INSERT ON hearings
  FOR EACH ROW
  EXECUTE FUNCTION update_hearings_is_latest();
```

---

## 7. データマイグレーション計画

### 7.1 Phase 6開始前の準備

1. **テーブル作成**:
   - 上記DDLを実行してテーブル作成
   - インデックス作成
   - RLSポリシー設定
   - トリガー作成

2. **企業マスタ初期データ投入**:
   - CSV一括読込機能でデータ投入
   - 最低50社の初期データ必要

### 7.2 Phase 5 → Phase 6 移行時

**影響を受ける既存テーブル**: なし（新規テーブルのみ）

**ダウンタイム**: 不要（新機能追加のみ）

---

## 8. バックアップ・リストア戦略

### 8.1 バックアップ方針

**Supabase自動バックアップ**:
- 日次バックアップ（Supabase Pro以上）
- Point-in-time Recovery（PITRサポート）

**手動バックアップ**:
- 企業マスタ: 週次CSV出力
- ヒアリングデータ: 月次CSV出力

### 8.2 リストア手順

**テーブル単位リストア**:
```sql
-- 企業マスタのリストア例
TRUNCATE companies CASCADE;
-- CSV一括読込APIでデータ復元
```

---

## 9. パフォーマンス最適化

### 9.1 想定データ量と対策

| テーブル | 1年後想定レコード数 | 対策 |
|---------|-------------------|------|
| hearings | 1,200件（30医院×4回×1年） | インデックス最適化済み |
| hearing_analyses | 1,200件 | 1:1リレーション、問題なし |
| companies | 200件 | インデックス最適化済み |
| recommendations | 6,000件（1,200×5社） | match_scoreインデックスで高速化 |

### 9.2 N+1問題対策

**ヒアリング一覧 + 分析結果取得**:
```sql
SELECT h.*, ha.*
FROM hearings h
LEFT JOIN hearing_analyses ha ON h.id = ha.hearing_id
WHERE h.clinic_id = ?
ORDER BY h.created_at DESC;
```

**企業レコメンド + 企業詳細取得**:
```sql
SELECT r.*, c.*
FROM recommendations r
INNER JOIN companies c ON r.company_id = c.id
WHERE r.hearing_analysis_id = ?
ORDER BY r.match_score DESC
LIMIT 5;
```

---

## 10. セキュリティ考慮事項

### 10.1 機密データ保護

- **ヒアリング回答データ（response_data）**: clinic_idでのRLS完全分離
- **AI分析結果（challenges）**: clinic_idでのRLS完全分離
- **企業マスタ**: 全クリニックで共有（公開情報のみ）

### 10.2 データ削除ポリシー

- **CASCADE削除**: clinic削除 → hearings → hearing_analyses → recommendations すべて削除
- **企業削除**: is_active = FALSEでソフト削除（過去のレコメンド保持）

---

**作成者**: Claude Code
**最終更新日**: 2025-12-26
