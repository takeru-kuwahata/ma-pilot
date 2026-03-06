# MA-Pilot トラブルシューティング

## よくある問題と解決方法

### ログインできない

#### 症状
- メールアドレス・パスワードを入力してもログインできない
- 「認証情報が無効です」エラーが表示される
- `401 Unauthorized` または `422 Unprocessable Entity` エラー

#### 原因と解決方法

**1. パスワードが間違っている**
- 「パスワードを忘れた方」からリセットを実行
- 大文字小文字の入力ミスに注意

**2. アカウントが無効化されている**
- システム管理者に問い合わせ
- 医院オーナーに権限確認を依頼

**3. ブラウザキャッシュの問題**
- ブラウザのキャッシュをクリア
- シークレットモード / プライベートブラウジングで試行

**4. バックエンドの環境変数問題（管理者向け）**

**症状**: `401 Unauthorized`が継続的に発生

**原因**: Supabase APIキーが誤っている（service_role keyを使用している）

**解決方法**:
```bash
# ローカル環境の場合
# backend/.env を編集
SUPABASE_KEY=eyJhbG...（anon keyに変更）

# Render.com本番環境の場合
# Renderダッシュボード → Environment Variables
# SUPABASE_KEY を anon key に変更
# Save, rebuild, and deploy
```

**anon key vs service_role key**:
- ✅ `anon key`: 認証APIで使用（フロントエンド・バックエンド認証）
- ❌ `service_role key`: 管理操作のみ使用（RLS無視、認証では使用不可）

**5. パスワードバリデーションエラー（開発者向け）**

**症状**: `422 Unprocessable Entity`エラー

**原因**: `backend/src/models/user.py`のLoginRequestモデルで厳格なパスワードバリデーションが実装されている

**解決方法**: パスワードバリデーションを緩和
```python
# backend/src/models/user.py
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    # @validatorは削除（既存パスワードとの互換性優先）
```

**6. ログイン後に真っ白な画面（404エラー）**

**症状**: ログイン成功後、画面が真っ白で`No routes matched location "/admin"`エラー

**原因**: 存在しないパス`/admin`にリダイレクトしている

**解決方法**: `frontend/src/hooks/useAuth.ts`を修正
```typescript
// 修正前
if (user.role === 'system_admin') {
  navigate('/admin');  // ❌ このルートは存在しない
}

// 修正後
if (user.role === 'system_admin') {
  navigate('/admin/dashboard');  // ✅ 正しいパス
}
```

#### トラブルシューティング手順（管理者向け）

**Step 1: エラーコードを確認**
- `422` → パスワード形式エラー（バリデーション問題）
- `401` → 認証失敗（パスワード不一致またはAPIキー問題）
- `400` → リクエスト形式エラー（コードの問題）

**Step 2: ローカル環境でテスト**
```bash
# バックエンド起動
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8432

# 別ターミナルでログインテスト
curl -X POST 'http://localhost:8432/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"kuwahata@idw-japan.net","password":"advance2026"}'
```

**Step 3: Supabaseに直接問い合わせ**
```bash
curl -X POST 'https://ecdzttcnpykmqikdlkai.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: [ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"email":"kuwahata@idw-japan.net","password":"advance2026"}'
```

成功すれば`access_token`が返る → APIキーは正しい

**Step 4: バックエンドログ確認**
- ローカル: ターミナルのログを確認
- Render: Logs タブを確認

#### 2026-02-03 修正履歴
- パスワードバリデーション削除（既存パスワード対応）
- SUPABASE_KEYをanon keyに変更（ローカル・Render両方）
- ログイン後リダイレクト先を修正（/admin → /admin/dashboard）
- コミット: `e951d63`

---

### データが表示されない

#### 症状
- ダッシュボードにデータが表示されない
- 「データがありません」メッセージが表示される

#### 原因と解決方法

**1. 月次データが未入力**
- 左メニュー→「基礎データ管理」
- 最低1ヶ月分のデータを入力

**2. 権限不足**
- 自分の権限を確認（閲覧者・編集者・オーナー）
- 医院オーナーに権限変更を依頼

**3. ネットワークエラー**
- ブラウザの開発者ツール→Networkタブでエラー確認
- バックエンドAPIが正常に応答しているか確認

---

### CSVインポートが失敗する

#### 症状
- CSVファイルをアップロードしてもエラーが表示される
- 「フォーマットエラー」メッセージが出る

#### 原因と解決方法

**1. フォーマットが間違っている**
- CSVファイルが正しい形式か確認:
  ```csv
  year_month,total_revenue,insurance_revenue,...
  2024-01,5000000,3000000,...
  ```
- カラム名が正しいか確認

**2. 文字コードの問題**
- UTF-8 BOM付きで保存
- Excelで開いて「CSV UTF-8」形式で保存し直す

**3. 数値フォーマットエラー**
- 数値にカンマや¥記号が含まれていないか確認
- 例: `5,000,000` → `5000000`

**4. 日付フォーマットエラー**
- year_monthが「YYYY-MM」形式か確認
- 例: `2024-1` → `2024-01`

---

### Supabase接続エラー

#### 症状
- 「データベース接続エラー」が表示される
- APIリクエストが全て失敗する

#### 原因と解決方法

**1. 環境変数が未設定**
- `.env.local`に以下が設定されているか確認:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```

**2. APIキーの形式エラー**
- Supabase Anon Keyは`sb_publishable_`で開始
- Service Role Keyは使用しない（セキュリティリスク）

**3. Supabaseプロジェクトが停止**
- Supabaseダッシュボードでプロジェクトステータス確認
- 無料プランは7日間非アクティブで一時停止

---

### フロントエンドが起動しない

#### 症状
- `npm run dev`を実行してもエラーが出る
- ポート3247が使用できない

#### 原因と解決方法

**1. ポート競合**
```bash
# ポート3247を使用しているプロセスを終了
lsof -ti:3247 | xargs kill -9

# 別のポートで起動
npm run dev -- --port 3248
```

**2. node_modulesが破損**
```bash
rm -rf node_modules package-lock.json
npm install
```

**3. Node.jsバージョン不一致**
```bash
# Node.js 18.x以上を使用
node -v

# nvmで切り替え
nvm use 18
```

---

### バックエンドが起動しない

#### 症状
- `python main.py`を実行してもエラーが出る
- ポート8432が使用できない

#### 原因と解決方法

**1. ポート競合**
```bash
# ポート8432を使用しているプロセスを終了
lsof -ti:8432 | xargs kill -9
```

**2. Python仮想環境が無効**
```bash
# 仮想環境を有効化
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate  # Windows
```

**3. 依存パッケージ未インストール**
```bash
pip install -r requirements.txt
```

**4. 環境変数未設定**
- `backend/.env`ファイルが存在するか確認
- `.env.example`をコピーして`.env`を作成

---

### ビルドエラー

#### 症状
- `npm run build`が失敗する
- TypeScript型エラーが表示される

#### 原因と解決方法

**1. TypeScript型エラー**
```bash
# 型チェック実行
npm run type-check

# エラー箇所を修正
```

**2. ESLintエラー**
```bash
# Lint実行
npm run lint

# 自動修正
npm run lint -- --fix
```

**3. 依存パッケージのバージョン不一致**
```bash
# package-lock.jsonを削除して再インストール
rm package-lock.json
npm install
```

---

### デプロイエラー

#### 症状
- Vercel/Render.comでデプロイが失敗する
- ビルドログにエラーが表示される

#### 原因と解決方法

**1. 環境変数未設定**
- Vercel/Render.comダッシュボードで環境変数確認
- 本番環境用の値が正しく設定されているか確認

**2. ビルドコマンドエラー**
- ローカルで`npm run build`が成功するか確認
- ログを詳細に確認してエラー箇所を特定

**3. メモリ不足**
- Render.com無料プランはメモリ512MB制限
- ビルド時のメモリ使用量を削減
- Proプランへアップグレード検討

---

### パフォーマンス問題

#### 症状
- ページ表示が遅い
- グラフ描画に時間がかかる

#### 原因と解決方法

**1. 大量データ取得**
- APIリクエストで取得件数を制限
- ページネーション実装

**2. 不要な再レンダリング**
- React.memo()でコンポーネントをメモ化
- useMemo()で計算結果をキャッシュ

**3. 画像最適化不足**
- 画像をWebP形式に変換
- Lazy Loadingを実装

---

### PDF生成エラー

#### 症状
- レポート生成が失敗する
- 「PDF生成エラー」が表示される

#### 原因と解決方法

**1. WeasyPrintの依存ライブラリ不足**
```bash
# macOS
brew install pango cairo

# Ubuntu/Debian
sudo apt-get install libpango-1.0-0 libcairo2
```

**2. フォント不足**
- 日本語フォントがインストールされているか確認
- システムフォントパスを環境変数で設定

**3. テンプレートエラー**
- Jinja2テンプレートの構文エラーを確認
- ログで詳細なエラーメッセージを確認

---

### その他の問題

#### ブラウザコンソールにエラーが出る

1. ブラウザの開発者ツールを開く（F12）
2. Consoleタブでエラーメッセージ確認
3. エラーメッセージをコピーしてGoogle検索

#### APIリクエストが遅い

1. Networkタブでリクエスト時間を確認
2. バックエンドログでスロークエリを特定
3. インデックス追加・クエリ最適化

#### データが古い

1. ブラウザキャッシュをクリア
2. React Queryのキャッシュ無効化時間を短縮
3. 手動でページリロード

---

## サポート連絡先

問題が解決しない場合は、以下の情報を添えてサポートに連絡してください:

- **エラーメッセージ**: 完全なエラーメッセージをコピー
- **再現手順**: 問題が発生するまでの操作手順
- **環境情報**: ブラウザ種類・バージョン、OS
- **スクリーンショット**: エラー画面のスクリーンショット

**サポートメール**: support@ma-pilot.local
**GitHub Issues**: https://github.com/takeru-kuwahata/ma-pilot/issues

---

**最終更新**: 2025年12月26日
