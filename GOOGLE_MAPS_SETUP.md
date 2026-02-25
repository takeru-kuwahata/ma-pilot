# Google Maps API 設定ガイド

## 現在の状況

Google Maps APIキーは既に取得・設定済みですが、**請求アカウントが未設定**のため、地図が正しく表示されません。

## エラー内容

```
Google Maps JavaScript API error: BillingNotEnabledMapError
このページでは Google マップが正しく読み込まれませんでした。
```

## 解決方法

### 1. Google Cloud Consoleにアクセス

https://console.cloud.google.com/

### 2. 請求アカウントを設定

1. **左上のメニュー** → **お支払い** をクリック
2. 「請求先アカウントをリンク」または「請求を有効にする」をクリック
3. クレジットカード情報を入力
   - 初回登録時は **$300の無料クレジット** が付与されます
   - **無料枠**: 月28,500回のマップ読み込みまで無料
   - 無料枠を超えない限り請求は発生しません

### 3. Maps JavaScript APIを有効化

1. **APIとサービス** → **ライブラリ** をクリック
2. 「Maps JavaScript API」を検索
3. 「有効にする」をクリック
4. 同様に以下のAPIも有効化：
   - **Places API**（競合歯科医院検索に使用）
   - **Geocoding API**（住所→座標変換に使用）

### 4. APIキーの制限設定（推奨）

セキュリティのため、APIキーに制限を設定することを推奨します：

1. **APIとサービス** → **認証情報** をクリック
2. 既存のAPIキーをクリック
3. **アプリケーションの制限**:
   - 「HTTPリファラー（ウェブサイト）」を選択
   - 以下のドメインを追加:
     - `https://ma-pilot.vercel.app/*`
     - `http://localhost:3247/*`（開発環境）

4. **APIの制限**:
   - 「キーを制限」を選択
   - 以下のAPIのみ許可:
     - Maps JavaScript API
     - Places API
     - Geocoding API

### 5. 設定確認

設定完了後、5〜10分待ってから以下のページで動作確認：

https://ma-pilot.vercel.app/clinic/kanda-ekisoba/market-analysis

## 料金について

### 無料枠（毎月リセット）

- **Maps JavaScript API**: 28,500回のマップ読み込み
- **Places API**:
  - テキスト検索: 無料枠なし（$32/1,000リクエスト）
  - Nearby Search: 無料枠なし（$32/1,000リクエスト）
- **Geocoding API**: 40,000リクエスト

### 想定コスト（月間）

MA-Pilotの想定利用状況（医院数50、各医院が月10回アクセス）:

- **Maps JavaScript API**: 500回 → **無料**
- **Places API**: 50回（初回分析時のみ） → **約$1.60/月**
- **Geocoding API**: 50回（新規医院登録時のみ） → **無料**

**月額コスト見込み: $1〜2程度**

### コスト削減策

現在実装済み:
- 診療圏分析データは初回のみ作成、2回目以降はキャッシュ使用
- Places API呼び出しは分析実行時のみ（ページ表示では呼ばない）

## トラブルシューティング

### 「このAPIキーの使用は許可されていません」

→ APIキーの制限設定で、HTTPリファラーが正しく設定されているか確認

### 地図が表示されるが、ピンが表示されない

→ Places APIが有効化されているか確認

### 「このプロジェクトには請求先アカウントが必要です」

→ 請求アカウントをリンクする必要があります（上記手順2を実施）

## 参考リンク

- [Google Maps Platform 料金](https://mapsplatform.google.com/pricing/)
- [Google Cloud 無料枠](https://cloud.google.com/free)
- [Maps JavaScript API ドキュメント](https://developers.google.com/maps/documentation/javascript)
