# デプロイ手順書

## 前提条件

- GitHubリポジトリ: https://github.com/takeru-kuwahata/ma-pilot
- Vercelプロジェクト: https://vercel.com/takeru-kuwahatas-projects/ma-pilot
- Render.comサービス: https://dashboard.render.com/web/srv-cvmitldsvqrc73c18v40

## 🚀 確実なデプロイ手順

### 1. コード変更後のコミット＆プッシュ

```bash
# フロントエンド変更の場合
cd /Users/kuwahatatakeru/医療DW\ Dropbox/21_AI/MA-Lstep
git add frontend/
git commit -m "feat: 機能追加の説明"
git push origin main

# バックエンド変更の場合
git add backend/
git commit -m "feat: 機能追加の説明"
git push origin main
```

### 2. Vercel（フロントエンド）デプロイ確認

#### 方法A: 自動デプロイ確認（推奨）

1. https://vercel.com/takeru-kuwahatas-projects/ma-pilot/deployments にアクセス
2. 最新のコミットが "Building" 状態になっていることを確認
3. 2-3分待って "Ready" 状態になることを確認

#### 方法B: 手動デプロイトリガー（自動デプロイされない場合）

1. https://vercel.com/takeru-kuwahatas-projects/ma-pilot/deployments にアクセス
2. 最新のコミットの右側にある「...」メニューをクリック
3. **"Redeploy"** を選択
4. ポップアップで **"Redeploy"** ボタンをクリック
5. 2-3分待って "Ready" 状態になることを確認

#### 方法C: Vercel CLI使用（最も確実）

```bash
cd /Users/kuwahatatakeru/医療DW\ Dropbox/21_AI/MA-Lstep
vercel --prod --cwd frontend
```

### 3. Render.com（バックエンド）デプロイ確認

#### 自動デプロイ確認

1. https://dashboard.render.com/web/srv-cvmitldsvqrc73c18v40 にアクセス
2. "Events" タブで最新のデプロイが "Live" 状態になっていることを確認
3. GitHubプッシュから5-10分で自動デプロイ完了

#### 手動デプロイトリガー（自動デプロイされない場合）

1. https://dashboard.render.com/web/srv-cvmitldsvqrc73c18v40 にアクセス
2. 右上の **"Manual Deploy"** → **"Deploy latest commit"** をクリック
3. 5-10分待ってデプロイ完了を確認

### 4. デプロイ確認チェックリスト

#### フロントエンド確認

- [ ] https://ma-pilot.vercel.app にアクセスできる
- [ ] ログイン画面が表示される
- [ ] ページをリロードしても404エラーにならない
- [ ] 左メニューに「印刷物発注」が表示される
- [ ] ブラウザのDevToolsでコンソールエラーがない

#### バックエンド確認

- [ ] https://ma-pilot.onrender.com/health にアクセスして `{"status":"ok"}` が返る
- [ ] https://ma-pilot.onrender.com/docs でSwagger UIが表示される

#### 統合確認

- [ ] ログイン機能が動作する（admin@ma-pilot.local / DevAdmin2025!）
- [ ] ダッシュボードにデータが表示される
- [ ] 各ページ（基礎データ管理、診療圏分析等）にアクセスできる

## 🔧 トラブルシューティング

### 問題1: Vercelデプロイが自動で開始されない

**原因**: GitHubとVercelの連携が切れている

**解決策**:
1. https://vercel.com/takeru-kuwahatas-projects/ma-pilot/settings/git にアクセス
2. "Connect Git Repository" が表示されていれば再接続
3. 再接続後、手動デプロイをトリガー

### 問題2: ページリロードで404エラー

**原因**: vercel.jsonのSPAルーティング設定が反映されていない

**解決策**:
1. `frontend/vercel.json` が正しく設定されているか確認
2. Vercelダッシュボードで "Redeploy" を実行
3. キャッシュクリアのため、ブラウザのハードリロード（Cmd+Shift+R）

### 問題3: 古いコードがデプロイされている

**原因**: Vercelのビルドキャッシュ

**解決策**:
1. Vercelダッシュボードで Settings → General → Build & Development Settings
2. "Override" をONにして、以下を設定:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Deployments → 最新デプロイ → Redeploy → **"Redeploy without cache"** を選択

### 問題4: Root Directory設定が間違っている

**現象**: Vercel CLIで `The provided path "~/医療DW Dropbox/21_AI/MA-Lstep/frontend/frontend" does not exist` エラー

**解決策**:
1. https://vercel.com/takeru-kuwahatas-projects/ma-pilot/settings にアクセス
2. "General" → "Root Directory" を確認
3. 値を `frontend` に設定（`frontend/frontend` になっていたら修正）
4. Save → Redeploy

### 問題5: 環境変数が反映されない

**解決策**:
1. https://vercel.com/takeru-kuwahatas-projects/ma-pilot/settings/environment-variables にアクセス
2. 以下の3つが設定されているか確認:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BACKEND_URL`
3. 設定後、必ず Redeploy を実行

## 📝 デプロイ後の確認スクリプト

```bash
#!/bin/bash

echo "=== MA-Pilot デプロイ確認 ==="

echo ""
echo "1. フロントエンド確認..."
curl -s -o /dev/null -w "%{http_code}" https://ma-pilot.vercel.app
if [ $? -eq 0 ]; then
  echo "✅ フロントエンドアクセス可能"
else
  echo "❌ フロントエンドアクセス不可"
fi

echo ""
echo "2. バックエンドヘルスチェック..."
curl -s https://ma-pilot.onrender.com/health | grep -q "ok"
if [ $? -eq 0 ]; then
  echo "✅ バックエンド正常"
else
  echo "❌ バックエンドエラー"
fi

echo ""
echo "3. 最新コミット確認..."
cd /Users/kuwahatatakeru/医療DW\ Dropbox/21_AI/MA-Lstep
git log --oneline -1
```

## 🎯 ベストプラクティス

1. **コミットメッセージ規約**:
   - `feat:` 新機能追加
   - `fix:` バグ修正
   - `docs:` ドキュメント更新
   - `refactor:` リファクタリング

2. **デプロイ前チェック**:
   - ローカルでビルド成功を確認: `npm run build`
   - TypeScriptエラー0件: `npm run build`の出力確認
   - Gitステータス確認: `git status`

3. **デプロイ後確認**:
   - Vercel Deployments画面で "Ready" 状態を確認
   - 本番URLで動作確認
   - ブラウザのDevToolsでエラーログ確認

4. **緊急時のロールバック**:
   - Vercel Deploymentsで前回の成功したデプロイを見つける
   - "Promote to Production" をクリック
   - 即座に前バージョンに戻る
