# ログイン問題の修正手順

**作成日**: 2026-02-03
**問題**: Vercelにデプロイされたフロントエンドでログインができない
**原因**: フロントエンドが `localhost:8432` に接続しようとしている（環境変数未設定）

---

## ✅ 確認済み事項

- ローカル環境では正常にログイン可能
- バックエンドAPI（localhost:8432）は正常動作
- コードに問題なし
- **問題はデプロイ設定のみ**

---

## 🔧 修正手順

### Step 1: RenderのバックエンドURLを確認

1. https://dashboard.render.com/ にログイン
2. バックエンドサービスを選択
3. 画面上部に表示されているURLをコピー
   - 例: `https://ma-pilot-backend.onrender.com`
   - 例: `https://ma-lstep-backend.onrender.com`

**このURLを以下「【RenderのURL】」として使用します**

---

### Step 2: Vercelに環境変数を追加

1. https://vercel.com/dashboard にログイン
2. プロジェクト「ma-pilot」を選択
3. 画面上部の「Settings」をクリック
4. 左サイドバーの「Environment Variables」をクリック
5. 「Add New」ボタンをクリック
6. 以下を入力：

```
Name: VITE_BACKEND_URL
Value: https://【RenderのURL】
```

例：
```
Name: VITE_BACKEND_URL
Value: https://ma-pilot-backend.onrender.com
```

7. Environment の選択：
   - [x] Production
   - [x] Preview
   - [x] Development

   **3つ全てにチェックを入れる**

8. 「Save」ボタンをクリック

---

### Step 3: Vercelで再デプロイ

1. 画面上部の「Deployments」をクリック
2. 一番上の最新デプロイの右側にある「...」（3点メニュー）をクリック
3. 「Redeploy」を選択
4. 確認ダイアログで「Redeploy」をクリック

**デプロイ完了まで約2-3分待つ**

---

### Step 4: 動作確認

1. https://ma-pilot.vercel.app にアクセス
2. ログイン画面が表示されることを確認
3. 以下の認証情報でログイン：

```
メール: kuwahata@idw-japan.net
パスワード: advance2026
```

4. ログイン成功 → `/admin/dashboard` に遷移すればOK

---

## ⚠️ Render側の環境変数も確認（重要）

Renderの環境変数に `VITE_` プレフィックスが付いている場合、それは誤りです。

### 正しいRender環境変数

以下の環境変数が設定されているか確認してください：

```
SUPABASE_URL=https://ecdzttcnpykmqikdlkai.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（長いトークン）
PORT=8432
HOST=0.0.0.0
ENVIRONMENT=production
FRONTEND_URL=https://ma-pilot.vercel.app
```

**注意**: `VITE_SUPABASE_URL` や `VITE_SUPABASE_KEY` は削除してください（フロントエンド用のため）

---

## 🛡️ 再発防止策

### デプロイ前チェックリスト

今後、デプロイする際は以下を必ず確認：

- [ ] Vercelの `VITE_BACKEND_URL` が本番URL（localhostでない）
- [ ] Renderの環境変数に `VITE_` プレフィックスがない
- [ ] ローカル環境で動作確認済み
- [ ] デプロイ後、本番環境でログインテスト実施

---

## 📞 トラブルシューティング

### ログインボタンを押しても反応しない

**ブラウザの開発者ツールで確認**：

1. F12キーを押す
2. 「Console」タブを開く
3. エラーメッセージを確認

よくあるエラー：

```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:8432/api/auth/login
```

→ `VITE_BACKEND_URL` が未設定またはlocalhost

```
Failed to load resource: the server responded with a status of 502
```

→ Renderのバックエンドがスリープ中（起動に30秒-1分かかる）

### Renderのバックエンドが起動しない

1. Render Dashboard → サービス選択 → Logs
2. エラーメッセージを確認
3. 環境変数が正しく設定されているか確認

---

## 📝 参考情報

- Vercel環境変数ドキュメント: https://vercel.com/docs/projects/environment-variables
- Render環境変数ドキュメント: https://docs.render.com/environment-variables
- FastAPI CORS設定: https://fastapi.tiangolo.com/tutorial/cors/

---

**質問・不明点があれば、このファイルに追記してください。**
