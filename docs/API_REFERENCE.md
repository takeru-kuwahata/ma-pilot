# MA-Pilot API仕様書

## 概要

MA-PilotバックエンドAPIの完全な仕様書です。全エンドポイント、リクエスト・レスポンス形式、認証要件、エラーハンドリングを記載しています。

### ベースURL

- **開発環境**: `http://localhost:8432`
- **本番環境**: `https://ma-pilot-backend.onrender.com`

### 認証方式

- **Supabase Auth**: JWT（JSON Web Token）ベースの認証
- **Headerに含める**: `Authorization: Bearer {access_token}`

### レート制限

- **無料プラン**: なし
- **将来的な制限**: 検討中（API Gateway導入時）

### 共通レスポンスフォーマット

#### 成功レスポンス
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

---

## 1. 認証API

### POST /api/auth/login

ユーザーログイン

**認証**: 不要

**リクエストボディ**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "clinic_owner",
      "clinic_id": "uuid"
    }
  }
}
```

**エラーレスポンス**:
- `401 Unauthorized`: 認証情報が無効
- `400 Bad Request`: リクエスト形式エラー

---

### POST /api/auth/logout

ログアウト

**認証**: 必須

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /api/auth/reset-password

パスワードリセット

**認証**: 不要

**リクエストボディ**:
```json
{
  "email": "user@example.com"
}
```

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

## 2. 医院データAPI

### GET /api/clinics/{clinic_id}

医院情報取得

**認証**: 必須
**権限**: clinic_viewer以上

**パスパラメータ**:
- `clinic_id` (string): 医院ID（UUID）

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "医療法人サンプル歯科",
    "postal_code": "100-0001",
    "address": "東京都千代田区...",
    "phone": "03-1234-5678",
    "email": "contact@sample-dental.jp",
    "representative_name": "山田太郎",
    "opening_date": "2020-04-01",
    "chair_count": 5,
    "staff_count": 10,
    "latitude": 35.6812,
    "longitude": 139.7671,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-12-01T00:00:00Z"
  }
}
```

**エラーレスポンス**:
- `403 Forbidden`: 権限なし
- `404 Not Found`: 医院が存在しない

---

### PUT /api/clinics/{clinic_id}

医院情報更新

**認証**: 必須
**権限**: clinic_owner以上

**パスパラメータ**:
- `clinic_id` (string): 医院ID

**リクエストボディ**:
```json
{
  "name": "医療法人サンプル歯科",
  "postal_code": "100-0001",
  "address": "東京都千代田区...",
  "phone": "03-1234-5678",
  "email": "contact@sample-dental.jp",
  "representative_name": "山田太郎",
  "chair_count": 5,
  "staff_count": 10
}
```

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Clinic updated successfully"
}
```

---

### POST /api/clinics

医院新規作成（管理者専用）

**認証**: 必須
**権限**: system_admin

**リクエストボディ**:
```json
{
  "name": "新規歯科医院",
  "postal_code": "100-0001",
  "address": "東京都千代田区...",
  "phone": "03-1234-5678",
  "email": "new@clinic.jp",
  "representative_name": "山田太郎",
  "opening_date": "2025-01-01"
}
```

**レスポンス（201 Created）**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Clinic created successfully"
}
```

---

## 3. 月次データAPI

### GET /api/monthly-data

月次データ一覧取得

**認証**: 必須
**権限**: clinic_viewer以上

**クエリパラメータ**:
- `clinic_id` (string, 必須): 医院ID
- `year_month` (string, オプション): 年月（YYYY-MM形式）
- `limit` (integer, オプション): 取得件数（デフォルト: 12）

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "clinic_id": "uuid",
      "year_month": "2024-12",
      "total_revenue": 5000000,
      "insurance_revenue": 3000000,
      "self_pay_revenue": 2000000,
      "new_patients": 50,
      "repeat_patients": 200,
      "total_patients": 250,
      "staff_cost": 2000000,
      "rent": 500000,
      "utilities": 100000,
      "material_cost": 800000,
      "other_expenses": 300000,
      "created_at": "2024-12-01T00:00:00Z",
      "updated_at": "2024-12-25T00:00:00Z"
    }
  ]
}
```

---

### POST /api/monthly-data

月次データ作成

**認証**: 必須
**権限**: clinic_editor以上

**リクエストボディ**:
```json
{
  "clinic_id": "uuid",
  "year_month": "2024-12",
  "total_revenue": 5000000,
  "insurance_revenue": 3000000,
  "self_pay_revenue": 2000000,
  "new_patients": 50,
  "repeat_patients": 200,
  "total_patients": 250,
  "staff_cost": 2000000,
  "rent": 500000,
  "utilities": 100000,
  "material_cost": 800000,
  "other_expenses": 300000
}
```

**レスポンス（201 Created）**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Monthly data created successfully"
}
```

**エラーレスポンス**:
- `400 Bad Request`: バリデーションエラー
- `409 Conflict`: 同じ年月のデータが既に存在

---

### PUT /api/monthly-data/{id}

月次データ更新

**認証**: 必須
**権限**: clinic_editor以上

**パスパラメータ**:
- `id` (string): 月次データID

**リクエストボディ**: POST /api/monthly-dataと同じ

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Monthly data updated successfully"
}
```

---

### DELETE /api/monthly-data/{id}

月次データ削除

**認証**: 必須
**権限**: clinic_owner以上

**パスパラメータ**:
- `id` (string): 月次データID

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "message": "Monthly data deleted successfully"
}
```

---

### POST /api/monthly-data/import-csv

CSV一括取込

**認証**: 必須
**権限**: clinic_editor以上

**リクエスト**: `multipart/form-data`

**フォームデータ**:
- `file` (file): CSVファイル（UTF-8 BOM付き推奨）
- `clinic_id` (string): 医院ID

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": {
    "total_rows": 12,
    "success_count": 10,
    "error_count": 2,
    "errors": [
      {
        "row": 5,
        "error": "Invalid year_month format"
      }
    ]
  },
  "message": "CSV import completed"
}
```

---

## 4. ダッシュボードAPI

### GET /api/dashboard

ダッシュボードデータ取得

**認証**: 必須
**権限**: clinic_viewer以上

**クエリパラメータ**:
- `clinic_id` (string, 必須): 医院ID

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": {
    "kpis": {
      "total_revenue": 5000000,
      "revenue_growth": 5.2,
      "total_patients": 250,
      "patient_growth": 3.5,
      "avg_revenue_per_patient": 20000,
      "operating_profit": 1500000,
      "profit_margin": 30.0
    },
    "alerts": [
      {
        "type": "warning",
        "message": "新患数が先月比10%減少しています",
        "priority": "high"
      }
    ],
    "recent_data": [ ... ]
  }
}
```

---

## 5. シミュレーションAPI

### POST /api/simulations

シミュレーション実行

**認証**: 必須
**権限**: clinic_editor以上

**リクエストボディ**:
```json
{
  "clinic_id": "uuid",
  "target_revenue": 8000000,
  "target_profit": 2500000,
  "timeframe_months": 12,
  "parameters": {
    "current_chair_count": 5,
    "current_staff_count": 10,
    "avg_revenue_per_patient": 20000
  }
}
```

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "clinic_id": "uuid",
    "target_revenue": 8000000,
    "target_profit": 2500000,
    "required_patients": 400,
    "required_chairs": 7,
    "required_staff": 14,
    "strategies": [
      {
        "category": "equipment",
        "description": "チェア2台増設",
        "cost": 5000000,
        "expected_impact": "月間患者数+30%"
      }
    ],
    "created_at": "2024-12-26T00:00:00Z"
  }
}
```

---

### GET /api/simulations

シミュレーション履歴取得

**認証**: 必須
**権限**: clinic_viewer以上

**クエリパラメータ**:
- `clinic_id` (string, 必須): 医院ID
- `limit` (integer, オプション): 取得件数（デフォルト: 10）

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": [ ... ]
}
```

---

### GET /api/simulations/{id}

シミュレーション詳細取得

**認証**: 必須
**権限**: clinic_viewer以上

**パスパラメータ**:
- `id` (string): シミュレーションID

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 6. レポートAPI

### POST /api/reports/generate

レポート生成

**認証**: 必須
**権限**: clinic_viewer以上

**リクエストボディ**:
```json
{
  "clinic_id": "uuid",
  "report_type": "monthly",
  "year_month": "2024-12",
  "format": "pdf",
  "template": "standard"
}
```

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": {
    "report_id": "uuid",
    "download_url": "https://...",
    "expires_at": "2025-01-01T00:00:00Z"
  },
  "message": "Report generated successfully"
}
```

---

### GET /api/reports

レポート一覧取得

**認証**: 必須
**権限**: clinic_viewer以上

**クエリパラメータ**:
- `clinic_id` (string, 必須): 医院ID
- `limit` (integer, オプション): 取得件数（デフォルト: 20）

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "clinic_id": "uuid",
      "report_type": "monthly",
      "year_month": "2024-12",
      "format": "pdf",
      "file_url": "https://...",
      "created_at": "2024-12-25T00:00:00Z"
    }
  ]
}
```

---

### GET /api/reports/{id}/download

レポートダウンロード

**認証**: 必須
**権限**: clinic_viewer以上

**パスパラメータ**:
- `id` (string): レポートID

**レスポンス（200 OK）**: PDFまたはCSVファイル

---

## 7. 診療圏分析API

### GET /api/market-analysis/{clinic_id}

診療圏分析データ取得

**認証**: 必須
**権限**: clinic_viewer以上

**パスパラメータ**:
- `clinic_id` (string): 医院ID

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": {
    "population": {
      "total": 50000,
      "age_groups": {
        "0-14": 5000,
        "15-64": 30000,
        "65+": 15000
      }
    },
    "competitors": [
      {
        "name": "ABC歯科",
        "distance": 500,
        "latitude": 35.6812,
        "longitude": 139.7671
      }
    ],
    "area_analysis": {
      "radius_km": 2,
      "household_count": 20000,
      "avg_income": 6000000
    }
  }
}
```

---

### POST /api/market-analysis

診療圏分析実行

**認証**: 必須
**権限**: clinic_editor以上

**リクエストボディ**:
```json
{
  "clinic_id": "uuid",
  "radius_km": 2,
  "analysis_type": "detailed"
}
```

**レスポンス（201 Created）**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Market analysis completed"
}
```

---

## 8. スタッフ管理API

### GET /api/staff

スタッフ一覧取得

**認証**: 必須
**権限**: clinic_owner以上

**クエリパラメータ**:
- `clinic_id` (string, 必須): 医院ID

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "staff@example.com",
      "role": "clinic_editor",
      "name": "山田花子",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/staff/invite

スタッフ招待

**認証**: 必須
**権限**: clinic_owner以上

**リクエストボディ**:
```json
{
  "clinic_id": "uuid",
  "email": "newstaff@example.com",
  "role": "clinic_editor",
  "name": "山田花子"
}
```

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "message": "Invitation email sent to newstaff@example.com"
}
```

---

### PUT /api/staff/{user_id}/role

スタッフ権限変更

**認証**: 必須
**権限**: clinic_owner以上

**パスパラメータ**:
- `user_id` (string): ユーザーID

**リクエストボディ**:
```json
{
  "role": "clinic_viewer"
}
```

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "message": "User role updated successfully"
}
```

---

### DELETE /api/staff/{user_id}

スタッフ削除

**認証**: 必須
**権限**: clinic_owner以上

**パスパラメータ**:
- `user_id` (string): ユーザーID

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "message": "User removed successfully"
}
```

---

## 9. 管理者API

### GET /api/admin/dashboard

管理ダッシュボードデータ取得

**認証**: 必須
**権限**: system_admin

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": {
    "total_clinics": 50,
    "active_clinics": 45,
    "total_users": 200,
    "total_revenue": 250000000,
    "recent_activities": [ ... ]
  }
}
```

---

### GET /api/admin/clinics

全医院一覧取得

**認証**: 必須
**権限**: system_admin

**クエリパラメータ**:
- `limit` (integer, オプション): 取得件数（デフォルト: 50）
- `offset` (integer, オプション): オフセット（デフォルト: 0）

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": [ ... ],
  "total": 50
}
```

---

### PUT /api/admin/clinics/{id}/activate

医院有効化

**認証**: 必須
**権限**: system_admin

**パスパラメータ**:
- `id` (string): 医院ID

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "message": "Clinic activated successfully"
}
```

---

### PUT /api/admin/clinics/{id}/deactivate

医院無効化

**認証**: 必須
**権限**: system_admin

**パスパラメータ**:
- `id` (string): 医院ID

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "message": "Clinic deactivated successfully"
}
```

---

### GET /api/admin/settings

システム設定取得

**認証**: 必須
**権限**: system_admin

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": {
    "email_templates": { ... },
    "api_keys": { ... },
    "feature_flags": { ... }
  }
}
```

---

### PUT /api/admin/settings

システム設定更新

**認証**: 必須
**権限**: system_admin

**リクエストボディ**:
```json
{
  "email_templates": { ... },
  "feature_flags": { ... }
}
```

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

## 10. 印刷物受注API

### POST /api/print-orders

注文作成

**認証**: 不要（MVP版）

**リクエストボディ**:
```json
{
  "clinic_name": "サンプル歯科",
  "email": "clinic@example.com",
  "pattern": "consultation",
  "product_type": "診察券",
  "quantity": 500,
  "specifications": "角丸3mm",
  "delivery_date": "2025-01-15",
  "design_required": true,
  "notes": "デザイン相談希望"
}
```

**レスポンス（201 Created）**:
```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "order_number": "PO-20250101-001",
    "estimated_price": 19500,
    "order_status": "submitted"
  }
}
```

---

### GET /api/print-orders

注文履歴取得

**認証**: 不要（MVP版）

**クエリパラメータ**:
- `email` (string, 必須): メールアドレス

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": [ ... ]
}
```

---

### GET /api/print-orders/{id}

注文詳細取得

**認証**: 不要（MVP版）

**パスパラメータ**:
- `id` (string): 注文ID

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": { ... }
}
```

---

### POST /api/print-orders/estimate

見積もり計算

**認証**: 不要（MVP版）

**リクエストボディ**:
```json
{
  "product_type": "診察券",
  "quantity": 500,
  "specifications": "角丸3mm"
}
```

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": {
    "estimated_price": 19500,
    "breakdown": {
      "design_fee": 0,
      "print_cost": 19500,
      "delivery_fee": 0
    }
  }
}
```

---

### POST /api/print-orders/{id}/approve

見積もり承認

**認証**: 不要（MVP版）

**パスパラメータ**:
- `id` (string): 注文ID

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "message": "Order approved successfully"
}
```

---

### GET /api/print-orders/{id}/estimate-pdf

見積もりPDF取得

**認証**: 不要（MVP版）

**パスパラメータ**:
- `id` (string): 注文ID

**レスポンス（200 OK）**: PDFファイル

---

### GET /api/price-tables

価格表一覧取得

**認証**: 不要

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "product_type": "診察券",
      "quantity": 500,
      "price": 19500,
      "design_fee": 5000,
      "is_active": true
    }
  ]
}
```

---

### GET /api/price-tables/{price_table_id}

価格表詳細取得

**認証**: 不要

**パスパラメータ**:
- `price_table_id` (string): 価格表ID

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "product_type": "診察券",
    "quantity": 500,
    "price": 19500,
    "design_fee": 5000,
    "is_active": true
  }
}
```

**エラーレスポンス**:
- `404 Not Found`: 価格表が存在しない

---

### PUT /api/price-tables/{id}

価格表更新（管理者専用）

**認証**: 必須
**権限**: system_admin

**パスパラメータ**:
- `id` (string): 価格表ID

**リクエストボディ**:
```json
{
  "price": 20000
}
```

**レスポンス（200 OK）**:
```json
{
  "success": true,
  "message": "Price table updated successfully"
}
```

---

## エラーコード一覧

| コード | 説明 |
|--------|------|
| `UNAUTHORIZED` | 認証が必要 |
| `FORBIDDEN` | 権限不足 |
| `NOT_FOUND` | リソースが見つからない |
| `VALIDATION_ERROR` | バリデーションエラー |
| `CONFLICT` | データの競合 |
| `INTERNAL_ERROR` | サーバー内部エラー |
| `EXTERNAL_API_ERROR` | 外部API連携エラー |
| `DATABASE_ERROR` | データベースエラー |

---

## レート制限（将来実装予定）

| エンドポイント | 制限 |
|--------------|------|
| /api/auth/* | 10回/分 |
| /api/reports/generate | 5回/時 |
| その他 | 100回/分 |

---

**最終更新**: 2025年12月26日
