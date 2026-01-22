# MA-Pilot Backend API

歯科医院経営分析システムのバックエンドAPI（FastAPI + Supabase）

## 技術スタック

- **Python**: 3.11+
- **FastAPI**: 高性能Webフレームワーク
- **Supabase**: PostgreSQL + Auth + Storage
- **Pydantic**: データバリデーション
- **WeasyPrint**: PDF生成（レポート機能）
- **Pandas**: データ分析（CSV取込）

## セットアップ

### 1. 環境変数設定

`.env`ファイルを作成（`.env.example`を参考）:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-or-service-key

# Server
PORT=8432
HOST=0.0.0.0
ENVIRONMENT=development

# CORS
FRONTEND_URL=http://localhost:3247

# Optional External APIs
E_STAT_API_KEY=
RESAS_API_KEY=
GOOGLE_MAPS_API_KEY=
```

### 2. 仮想環境作成・依存関係インストール

```bash
# 仮想環境作成
python3 -m venv venv

# 仮想環境有効化
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# 依存関係インストール
pip install -r requirements.txt
```

### 3. データベースセットアップ

Supabase SQLエディタで`supabase_schema.sql`を実行:

```sql
-- 6つのテーブルとRLSポリシーを作成
-- clinics, monthly_data, simulations, reports, market_analyses, user_metadata
```

### 4. サーバー起動

```bash
# 開発サーバー（ホットリロード有効）
python -m uvicorn main:app --host 0.0.0.0 --port 8432 --reload

# 本番サーバー
python -m uvicorn main:app --host 0.0.0.0 --port 8432
```

## API仕様

### Swagger UI

http://localhost:8432/docs

### エンドポイント一覧（30個）

#### 認証API（3個）
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `POST /api/auth/reset-password` - パスワードリセット

#### 医院データAPI（2個）
- `GET /api/clinics/{id}` - 医院情報取得
- `PUT /api/clinics/{id}` - 医院情報更新

#### 月次データAPI（5個）
- `GET /api/monthly-data` - 月次データ取得（クエリパラメータ: clinic_id, year_month）
- `POST /api/monthly-data` - 月次データ作成
- `PUT /api/monthly-data/{id}` - 月次データ更新
- `DELETE /api/monthly-data/{id}` - 月次データ削除
- `POST /api/monthly-data/import-csv` - CSV一括取込

#### ダッシュボードAPI（1個）
- `GET /api/dashboard` - ダッシュボードデータ取得（KPI、アラート、トレンド）

#### シミュレーションAPI（3個）
- `POST /api/simulations` - シミュレーション作成（逆算ロジック）
- `GET /api/simulations` - シミュレーション一覧取得
- `GET /api/simulations/{id}` - シミュレーション詳細取得

#### レポートAPI（3個）
- `POST /api/reports/generate` - レポート生成（PDF/CSV）
- `GET /api/reports` - レポート一覧取得
- `GET /api/reports/{id}/download` - レポートダウンロード

#### 診療圏分析API（2個）
- `GET /api/market-analysis/{clinic_id}` - 診療圏分析取得
- `POST /api/market-analysis` - 診療圏分析作成

#### スタッフ管理API（4個）
- `GET /api/staff` - スタッフ一覧取得
- `POST /api/staff/invite` - スタッフ招待
- `PUT /api/staff/{user_id}/role` - 権限変更
- `DELETE /api/staff/{user_id}` - スタッフ削除

#### 管理者API（7個）
- `GET /api/admin/dashboard` - 管理ダッシュボード
- `GET /api/admin/clinics` - 全医院一覧
- `POST /api/admin/clinics` - 医院作成
- `PUT /api/admin/clinics/{id}/activate` - 医院有効化
- `PUT /api/admin/clinics/{id}/deactivate` - 医院無効化
- `GET /api/admin/settings` - システム設定取得
- `PUT /api/admin/settings` - システム設定更新

## プロジェクト構造

```
backend/
├── main.py                    # FastAPIエントリーポイント
├── supabase_schema.sql        # データベーススキーマ
├── requirements.txt           # Python依存関係
├── .env                       # 環境変数（gitignore）
├── .env.example               # 環境変数サンプル
└── src/
    ├── core/
    │   ├── config.py          # 設定管理
    │   └── database.py        # Supabase接続
    ├── models/
    │   ├── user.py            # ユーザー関連モデル
    │   ├── clinic.py          # 医院モデル
    │   ├── monthly_data.py    # 月次データモデル
    │   ├── simulation.py      # シミュレーションモデル
    │   ├── report.py          # レポートモデル
    │   ├── market_analysis.py # 診療圏分析モデル
    │   └── dashboard.py       # ダッシュボードモデル
    ├── services/
    │   ├── auth_service.py
    │   ├── clinic_service.py
    │   ├── monthly_data_service.py
    │   ├── dashboard_service.py
    │   ├── simulation_service.py
    │   ├── report_service.py
    │   └── market_analysis_service.py
    └── api/
        ├── auth.py            # 認証エンドポイント
        ├── clinics.py         # 医院エンドポイント
        ├── monthly_data.py    # 月次データエンドポイント
        ├── dashboard.py       # ダッシュボードエンドポイント
        ├── simulations.py     # シミュレーションエンドポイント
        ├── reports.py         # レポートエンドポイント
        ├── market_analysis.py # 診療圏分析エンドポイント
        ├── staff.py           # スタッフ管理エンドポイント
        └── admin.py           # 管理者エンドポイント
```

## 開発ガイドライン

### コーディング規約

- **命名規則**: snake_case（Python標準）
- **型ヒント**: 必須（Pydantic + typing）
- **ドキュメント**: docstring推奨
- **フォーマット**: Black（予定）
- **リンター**: Ruff（予定）

### エラーハンドリング

```python
try:
    # ビジネスロジック
    result = await service.do_something()
    return result
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    raise HTTPException(status_code=500, detail='Internal server error')
```

### セキュリティ

- **Supabase RLS**: 有効化済み（clinic_idでのデータ分離）
- **認証**: Supabase Auth（JWT）
- **CORS**: フロントエンドURLのみ許可
- **環境変数**: .envファイル（gitignore）

## テスト

```bash
# ユニットテスト（未実装）
pytest tests/

# E2Eテスト（手動）
curl -X GET http://localhost:8432/health
```

## デプロイ

### Render.com

1. GitHubリポジトリ連携
2. 環境変数設定（Renderダッシュボード）
3. ビルドコマンド: `pip install -r requirements.txt`
4. 起動コマンド: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 注意事項

- **無料プラン**: 15分間アクセスなしで自動スリープ
- **環境変数**: `SUPABASE_URL`, `SUPABASE_KEY`, `FRONTEND_URL`を必ず設定

## トラブルシューティング

### サーバー起動エラー

```bash
# ポート8432が使用中の場合
lsof -ti:8432 | xargs kill -9

# Supabase接続エラー
# .envファイルのSUPABASE_URLとSUPABASE_KEYを確認
```

### モジュールインポートエラー

```bash
# 仮想環境が有効化されているか確認
which python  # venv/bin/pythonと表示されるはず

# 依存関係を再インストール
pip install -r requirements.txt --force-reinstall
```

## ライセンス

MIT License

## 開発者

MA-Pilot Development Team
