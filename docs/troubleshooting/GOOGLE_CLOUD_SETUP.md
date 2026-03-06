# Google Cloud セットアップ手順書

## 現在のステータス

**⏳ Google Cloud Project Quota 承認待ち**

- 申請日: 2026-03-01
- フォローアップ: 2026-03-05
- ステータス: Google からの返信待ち（通常1-3営業日）

## 問題の詳細

### Google Places API エラー

診療圏分析機能で Google Places API を呼び出すと `REQUEST_DENIED` エラーが発生:

```
Error fetching from Google Places API: Google Places API error: REQUEST_DENIED
```

**原因**: Google Cloud のプロジェクト数上限（デフォルト: 5プロジェクト）に達しているため、新規プロジェクトを作成できず、請求アカウントを設定できない。

### 現在の回避策

Google Cloud quota 承認までは、診療圏分析機能は**モックデータ**を返す:

- **人口データ**: ランダム生成（50,000〜100,000人）
- **競合歯科医院**: "Competitor Clinic 1", "Competitor Clinic 2", ... のダミーデータ

## Google Cloud 承認後の作業手順

### 1. 請求アカウントの設定

1. **Google Cloud Console** にアクセス: https://console.cloud.google.com/
2. **新規プロジェクト作成**:
   - プロジェクト名: `ma-pilot-production` (推奨)
   - 組織: なし（個人アカウント）
3. **請求アカウントの作成・リンク**:
   - 左メニュー → 「お支払い」
   - 「請求先アカウントをリンク」
   - クレジットカード情報を入力
4. **Places API を有効化**:
   - 「APIとサービス」→「ライブラリ」
   - "Places API" を検索
   - 「有効にする」をクリック
5. **Maps JavaScript API を有効化**:
   - 同じく「ライブラリ」から "Maps JavaScript API" を検索
   - 「有効にする」をクリック

### 2. API キーの制限設定（セキュリティ対策）

1. **APIとサービス** → **認証情報**
2. 既存の API キー `AIzaSyDbipuFtqbS98KOU5ew2deNKvtOvtpz3-I` をクリック
3. **アプリケーションの制限**:
   - 「HTTPリファラー」を選択
   - 許可するリファラー:
     ```
     https://ma-pilot.vercel.app/*
     http://localhost:3247/*
     ```
4. **API の制限**:
   - 「キーを制限」を選択
   - 以下のAPIのみを許可:
     - Maps JavaScript API
     - Places API
5. **保存**

### 3. 環境変数の確認

既に設定済みのため、確認のみ:

#### Frontend (Vercel)
- `VITE_GOOGLE_MAPS_API_KEY`: `AIzaSyDbipuFtqbS98KOU5ew2deNKvtOvtpz3-I`

#### Backend (Render.com)
- `GOOGLE_MAPS_API_KEY`: `AIzaSyDbipuFtqbS98KOU5ew2deNKvtOvtpz3-I`

### 4. 既存の診療圏分析データを削除

モックデータが保存されているため、Supabase で削除:

```sql
-- Supabase SQL Editor で実行
DELETE FROM market_analyses WHERE clinic_id = '52c56af7-f888-4384-8e54-6c4c5a2e699d';
```

### 5. 動作確認

1. **診療圏分析ページ** を開く: https://ma-pilot.vercel.app/clinic/kanda-ekisoba/market-analysis
2. **「分析を実行」ボタン** をクリック
3. **Render.com のログ** を確認:
   - ✅ 成功: `HTTP Request: GET https://maps.googleapis.com/maps/api/place/nearbysearch/json ... "HTTP/1.1 200 OK"`
   - ❌ 失敗: `Error fetching from Google Places API: ...`
4. **実際のデータが表示されるか確認**:
   - 競合歯科医院が実在の医院名になっている
   - 距離が正確
   - 地図の位置が神田駅周辺（北緯35.6762, 東経139.6503）

### 6. 想定される実データ

神田駅周辺（半径2km）の実際の競合歯科医院数:
- **予想**: 50〜100院以上（東京都心部のため）
- **現在のモックデータ**: 2〜5院（明らかに不正確）

## トラブルシューティング

### `REQUEST_DENIED` エラーが継続する場合

1. **Places API が有効化されているか確認**:
   - Google Cloud Console → APIとサービス → ダッシュボード
   - "Places API" が有効になっているか確認
2. **請求アカウントがリンクされているか確認**:
   - お支払い → 請求先アカウント
   - プロジェクトに請求先が設定されているか確認
3. **API キーの制限を一時的に解除**:
   - 認証情報 → API キー
   - 「アプリケーションの制限」を「なし」に変更
   - 「API の制限」を「制限なし」に変更
   - 動作確認後、再度制限を設定

### 費用について

- **Maps JavaScript API**: 月28,000マップロードまで無料
- **Places API (Nearby Search)**: 月5,000リクエストまで無料
- **想定利用量**: 月100リクエスト程度（ほぼ無料枠内）

## 関連ファイル

- バックエンド実装: `/backend/src/services/market_analysis_service.py`
- フロントエンド実装: `/frontend/src/pages/MarketAnalysis.tsx`
- Google Maps コンポーネント: `/frontend/src/components/GoogleMap.tsx`

## 次のステップ

Google Cloud quota 承認待ちの間は、**印刷物の複数注文機能** の実装を進める。
