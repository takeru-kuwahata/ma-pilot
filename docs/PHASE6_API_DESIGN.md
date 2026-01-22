# Phase 6: ヒアリングシート機能 - API設計書

**作成日**: 2025-12-26
**バージョン**: 1.0
**ベースURL**: `http://localhost:8432` (開発), `https://api.ma-pilot.com` (本番)

---

## 1. エンドポイント一覧

| No | メソッド | パス | 用途 | 権限 |
|----|---------|------|------|------|
| 1 | POST | /api/hearings | ヒアリング回答を保存 | clinic_owner, clinic_editor |
| 2 | GET | /api/hearings | ヒアリング履歴取得 | clinic_owner, clinic_editor, clinic_viewer |
| 3 | GET | /api/hearings/latest | 最新ヒアリング取得 | clinic_owner, clinic_editor, clinic_viewer |
| 4 | POST | /api/hearings/{hearing_id}/analyze | AI分析実行（内部API） | system |
| 5 | GET | /api/hearings/{hearing_id}/analysis | AI分析結果取得 | clinic_owner, clinic_editor, clinic_viewer |
| 6 | GET | /api/hearings/{hearing_id}/recommendations | 企業レコメンド取得 | clinic_owner, clinic_editor, clinic_viewer |
| 7 | GET | /api/companies | 企業一覧取得 | system_admin |
| 8 | POST | /api/companies | 企業作成 | system_admin |
| 9 | PUT | /api/companies/{company_id} | 企業更新 | system_admin |
| 10 | DELETE | /api/companies/{company_id} | 企業削除 | system_admin |
| 11 | POST | /api/companies/import-csv | CSV一括読込 | system_admin |
| 12 | GET | /api/admin/hearings | 全クリニックヒアリング一覧・集計 | system_admin |

---

## 2. エンドポイント詳細

### 2.1 POST /api/hearings

**用途**: ヒアリング回答を保存し、AI分析を非同期で開始

**権限**: `clinic_owner`, `clinic_editor`

**リクエスト**:
```json
{
  "clinic_id": "uuid",
  "lstep_id": "string (optional)",
  "response_data": {
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
}
```

**レスポンス（成功）**:
```json
{
  "data": {
    "id": "uuid",
    "clinic_id": "uuid",
    "lstep_id": "string",
    "response_data": { ... },
    "is_latest": true,
    "created_at": "2025-12-26T10:00:00Z",
    "updated_at": "2025-12-26T10:00:00Z"
  },
  "message": "ヒアリングを保存しました。AI分析を開始します。"
}
```

**レスポンス（エラー）**:
```json
{
  "error": "ValidationError",
  "message": "response_dataは必須です",
  "statusCode": 400
}
```

**処理フロー**:
1. リクエストボディバリデーション
2. hearingsテーブルにInsert（is_latest=trueで保存）
3. 非同期タスク起動（POST /api/hearings/{id}/analyze）
4. レスポンス返却

---

### 2.2 GET /api/hearings

**用途**: クリニックのヒアリング履歴を取得

**権限**: `clinic_owner`, `clinic_editor`, `clinic_viewer`

**クエリパラメータ**:
- `clinic_id` (required): UUID
- `limit` (optional): number (default: 10)
- `offset` (optional): number (default: 0)

**リクエスト例**:
```
GET /api/hearings?clinic_id=uuid&limit=10&offset=0
```

**レスポンス（成功）**:
```json
{
  "data": [
    {
      "id": "uuid",
      "clinic_id": "uuid",
      "lstep_id": "string",
      "response_data": { ... },
      "is_latest": true,
      "created_at": "2025-12-26T10:00:00Z",
      "updated_at": "2025-12-26T10:00:00Z",
      "analysis": {
        "id": "uuid",
        "analysis_status": "completed"
      }
    }
  ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

---

### 2.3 GET /api/hearings/latest

**用途**: クリニックの最新ヒアリングを取得

**権限**: `clinic_owner`, `clinic_editor`, `clinic_viewer`

**クエリパラメータ**:
- `clinic_id` (required): UUID

**リクエスト例**:
```
GET /api/hearings/latest?clinic_id=uuid
```

**レスポンス（成功）**:
```json
{
  "data": {
    "id": "uuid",
    "clinic_id": "uuid",
    "lstep_id": "string",
    "response_data": { ... },
    "is_latest": true,
    "created_at": "2025-12-26T10:00:00Z",
    "updated_at": "2025-12-26T10:00:00Z",
    "analysis": {
      "id": "uuid",
      "analysis_status": "completed",
      "strong_points": ["駅前立地で集患力が高い", "スタッフの定着率が良好"],
      "challenges": [
        {
          "category": "スタッフ採用",
          "description": "求人応募が少なく、採用が進まない",
          "priority": "high"
        }
      ]
    }
  }
}
```

**レスポンス（エラー - 最新ヒアリングなし）**:
```json
{
  "error": "NotFound",
  "message": "最新のヒアリングが見つかりません",
  "statusCode": 404
}
```

---

### 2.4 POST /api/hearings/{hearing_id}/analyze

**用途**: AI分析実行（内部API、非同期タスク）

**権限**: `system`（内部処理のみ、外部からの直接呼び出し不可）

**リクエスト**: なし（hearing_idから回答データを取得）

**処理フロー**:
1. hearingsテーブルからresponse_data取得
2. hearing_analysesにレコード作成（status='processing'）
3. Claude APIにプロンプト送信
4. レスポンスから強み・課題を抽出
5. hearing_analysesを更新（status='completed'、strong_points、challenges）
6. 企業マッチングロジック実行
7. recommendationsテーブルにInsert

**エラーハンドリング**:
- Claude APIエラー → status='failed'、error_message保存
- タイムアウト（30秒） → status='failed'
- リトライロジック（最大3回、指数バックオフ）

---

### 2.5 GET /api/hearings/{hearing_id}/analysis

**用途**: AI分析結果取得

**権限**: `clinic_owner`, `clinic_editor`, `clinic_viewer`

**パスパラメータ**:
- `hearing_id` (required): UUID

**リクエスト例**:
```
GET /api/hearings/uuid/analysis
```

**レスポンス（成功）**:
```json
{
  "data": {
    "id": "uuid",
    "hearing_id": "uuid",
    "strong_points": [
      "駅前立地で集患力が高い",
      "スタッフの定着率が良好"
    ],
    "challenges": [
      {
        "category": "スタッフ採用",
        "description": "求人応募が少なく、採用が進まない",
        "priority": "high"
      },
      {
        "category": "Webマーケティング",
        "description": "SNS運用のノウハウが不足している",
        "priority": "medium"
      }
    ],
    "analysis_status": "completed",
    "created_at": "2025-12-26T10:01:00Z",
    "updated_at": "2025-12-26T10:01:30Z"
  }
}
```

**レスポンス（エラー - 分析未完了）**:
```json
{
  "error": "NotReady",
  "message": "AI分析が完了していません（ステータス: processing）",
  "statusCode": 202
}
```

---

### 2.6 GET /api/hearings/{hearing_id}/recommendations

**用途**: 企業レコメンド取得

**権限**: `clinic_owner`, `clinic_editor`, `clinic_viewer`

**パスパラメータ**:
- `hearing_id` (required): UUID

**クエリパラメータ**:
- `limit` (optional): number (default: 5)

**リクエスト例**:
```
GET /api/hearings/uuid/recommendations?limit=5
```

**レスポンス（成功）**:
```json
{
  "data": [
    {
      "id": "uuid",
      "hearing_analysis_id": "uuid",
      "challenge_category": "スタッフ採用",
      "match_score": 85.5,
      "created_at": "2025-12-26T10:02:00Z",
      "company": {
        "id": "uuid",
        "name": "デンタルハッピー",
        "category": "スタッフ採用",
        "service_description": "歯科特化の求人広告サービス",
        "contact_email": "contact@dental-happy.co.jp",
        "website_url": "https://dental-happy.co.jp",
        "tags": ["求人広告", "歯科特化", "成果報酬型"]
      }
    }
  ],
  "total": 5
}
```

---

### 2.7 GET /api/companies

**用途**: 企業一覧取得

**権限**: `system_admin`

**クエリパラメータ**:
- `category` (optional): string
- `is_active` (optional): boolean (default: true)
- `limit` (optional): number (default: 50)
- `offset` (optional): number (default: 0)

**リクエスト例**:
```
GET /api/companies?category=スタッフ採用&is_active=true&limit=50&offset=0
```

**レスポンス（成功）**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "デンタルハッピー",
      "category": "スタッフ採用",
      "service_description": "歯科特化の求人広告サービス",
      "contact_email": "contact@dental-happy.co.jp",
      "website_url": "https://dental-happy.co.jp",
      "tags": ["求人広告", "歯科特化", "成果報酬型"],
      "is_active": true,
      "created_at": "2025-12-01T10:00:00Z",
      "updated_at": "2025-12-01T10:00:00Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

---

### 2.8 POST /api/companies

**用途**: 企業作成

**権限**: `system_admin`

**リクエスト**:
```json
{
  "name": "デンタルハッピー",
  "category": "スタッフ採用",
  "service_description": "歯科特化の求人広告サービス",
  "contact_email": "contact@dental-happy.co.jp",
  "website_url": "https://dental-happy.co.jp",
  "tags": ["求人広告", "歯科特化", "成果報酬型"],
  "is_active": true
}
```

**レスポンス（成功）**:
```json
{
  "data": {
    "id": "uuid",
    "name": "デンタルハッピー",
    "category": "スタッフ採用",
    "service_description": "歯科特化の求人広告サービス",
    "contact_email": "contact@dental-happy.co.jp",
    "website_url": "https://dental-happy.co.jp",
    "tags": ["求人広告", "歯科特化", "成果報酬型"],
    "is_active": true,
    "created_at": "2025-12-26T10:00:00Z",
    "updated_at": "2025-12-26T10:00:00Z"
  },
  "message": "企業を作成しました"
}
```

**レスポンス（エラー - 重複）**:
```json
{
  "error": "Conflict",
  "message": "同名の企業が既に存在します",
  "statusCode": 409
}
```

---

### 2.9 PUT /api/companies/{company_id}

**用途**: 企業更新

**権限**: `system_admin`

**パスパラメータ**:
- `company_id` (required): UUID

**リクエスト**:
```json
{
  "name": "デンタルハッピー（更新後）",
  "category": "スタッフ採用",
  "service_description": "歯科特化の求人広告サービス（新規機能追加）",
  "contact_email": "contact@dental-happy.co.jp",
  "website_url": "https://dental-happy.co.jp",
  "tags": ["求人広告", "歯科特化", "成果報酬型", "新規タグ"],
  "is_active": true
}
```

**レスポンス（成功）**:
```json
{
  "data": {
    "id": "uuid",
    "name": "デンタルハッピー（更新後）",
    "category": "スタッフ採用",
    "service_description": "歯科特化の求人広告サービス（新規機能追加）",
    "contact_email": "contact@dental-happy.co.jp",
    "website_url": "https://dental-happy.co.jp",
    "tags": ["求人広告", "歯科特化", "成果報酬型", "新規タグ"],
    "is_active": true,
    "created_at": "2025-12-26T10:00:00Z",
    "updated_at": "2025-12-26T11:00:00Z"
  },
  "message": "企業を更新しました"
}
```

---

### 2.10 DELETE /api/companies/{company_id}

**用途**: 企業削除（ソフト削除: is_active=false）

**権限**: `system_admin`

**パスパラメータ**:
- `company_id` (required): UUID

**リクエスト例**:
```
DELETE /api/companies/uuid
```

**レスポンス（成功）**:
```json
{
  "message": "企業を削除しました（is_active=false）"
}
```

**レスポンス（エラー - 企業が存在しない）**:
```json
{
  "error": "NotFound",
  "message": "企業が見つかりません",
  "statusCode": 404
}
```

---

### 2.11 POST /api/companies/import-csv

**用途**: CSV一括読込

**権限**: `system_admin`

**リクエスト（multipart/form-data）**:
- `file`: CSV file (UTF-8 BOM付き推奨)

**CSVフォーマット**:
```csv
name,category,service_description,contact_email,website_url,tags,is_active
デンタルハッピー,スタッフ採用,歯科特化の求人広告サービス,contact@dental-happy.co.jp,https://dental-happy.co.jp,"求人広告,歯科特化,成果報酬型",true
```

**レスポンス（成功）**:
```json
{
  "data": {
    "success": 50,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "error": "nameは必須です"
      },
      {
        "row": 15,
        "error": "同名の企業が既に存在します"
      }
    ]
  },
  "message": "CSV一括読込が完了しました（成功: 50件、失敗: 2件）"
}
```

**処理フロー**:
1. CSVファイルをパース（PapaParse or Python csv）
2. 行ごとにバリデーション
3. エラー行はスキップ、成功行のみInsert/Update
4. 取込結果サマリーを返却

---

### 2.12 GET /api/admin/hearings

**用途**: 全クリニックのヒアリング一覧・集計

**権限**: `system_admin`

**クエリパラメータ**:
- `start_date` (optional): ISO 8601形式（例: 2025-01-01）
- `end_date` (optional): ISO 8601形式（例: 2025-12-31）
- `limit` (optional): number (default: 50)
- `offset` (optional): number (default: 0)

**リクエスト例**:
```
GET /api/admin/hearings?start_date=2025-01-01&end_date=2025-12-31&limit=50&offset=0
```

**レスポンス（成功）**:
```json
{
  "data": {
    "hearings": [
      {
        "id": "uuid",
        "clinic_id": "uuid",
        "clinic_name": "山田歯科医院",
        "created_at": "2025-12-26T10:00:00Z",
        "analysis": {
          "analysis_status": "completed",
          "challenges_count": 3
        }
      }
    ],
    "total": 120,
    "limit": 50,
    "offset": 0,
    "aggregation": {
      "total_hearings": 120,
      "completed_analyses": 115,
      "failed_analyses": 3,
      "pending_analyses": 2,
      "challenge_categories": {
        "スタッフ採用": 45,
        "Webマーケティング": 38,
        "診療効率化": 25,
        "設備導入": 12
      }
    }
  }
}
```

---

## 3. エラーハンドリング

### 3.1 HTTPステータスコード

| コード | 意味 | 使用例 |
|-------|------|--------|
| 200 | OK | 正常レスポンス |
| 201 | Created | 新規作成成功 |
| 202 | Accepted | AI分析処理中 |
| 400 | Bad Request | バリデーションエラー |
| 401 | Unauthorized | 認証失敗 |
| 403 | Forbidden | 権限不足 |
| 404 | Not Found | リソースが存在しない |
| 409 | Conflict | 重複エラー |
| 429 | Too Many Requests | レート制限超過 |
| 500 | Internal Server Error | サーバーエラー |
| 503 | Service Unavailable | Claude API障害 |

### 3.2 エラーレスポンス形式

```json
{
  "error": "ValidationError",
  "message": "clinic_idは必須です",
  "statusCode": 400,
  "details": {
    "field": "clinic_id",
    "constraint": "required"
  }
}
```

---

## 4. 認証・認可

### 4.1 認証方式

**Supabase Auth**:
- JWTトークンをAuthorizationヘッダーに付与
- `Authorization: Bearer {token}`

**Lstep ID連携**:
- URLパラメータ `?lstep_id={ID}` でアクセス
- lstep_idからclinic_idを取得
- 初回アクセス時のみ簡易認証

### 4.2 権限チェック

各エンドポイントで以下を検証:
1. JWTトークンの有効性
2. ユーザーのrole（UserRole）
3. clinic_idの一致（自医院データのみアクセス可能）

---

## 5. レート制限

### 5.1 API レート制限

| エンドポイント | 制限 | 理由 |
|--------------|------|------|
| POST /api/hearings | 10リクエスト/時 | AI分析コスト管理 |
| POST /api/companies/import-csv | 5リクエスト/時 | サーバー負荷軽減 |
| その他 | 100リクエスト/分 | 標準レート制限 |

### 5.2 Claude API レート制限

**Anthropic制限**: 60リクエスト/分

**対策**:
- リトライロジック（指数バックオフ）
- キュー管理（同時実行数制限）

---

## 6. パフォーマンス要件

### 6.1 応答時間目標

| エンドポイント | 目標応答時間 |
|--------------|------------|
| GET /api/hearings | < 500ms |
| GET /api/hearings/latest | < 500ms |
| GET /api/hearings/{id}/analysis | < 500ms |
| GET /api/hearings/{id}/recommendations | < 1s |
| POST /api/hearings | < 2s（AI分析は非同期） |
| POST /api/companies/import-csv | < 10s（100件） |

---

## 7. セキュリティ

### 7.1 入力バリデーション

- **SQLインジェクション対策**: Supabase SDK使用（生SQL禁止）
- **XSS対策**: React標準のエスケープ機能
- **CSRF対策**: SameSite Cookie設定

### 7.2 機密情報保護

- **Claude APIキー**: 環境変数で管理、ログ出力禁止
- **ヒアリング回答データ**: RLSで完全分離
- **AI分析結果**: RLSで完全分離

---

**作成者**: Claude Code
**最終更新日**: 2025-12-26
