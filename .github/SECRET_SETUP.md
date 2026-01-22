# GitHub Secrets セットアップガイド

このドキュメントでは、GitHub ActionsでCI/CDを実行するために必要なSecretsの設定方法を説明します。

## 必須Secrets一覧

GitHubリポジトリの Settings > Secrets and variables > Actions で以下のSecretsを追加してください。

### Vercel関連（フロントエンド）

#### `VERCEL_TOKEN`
- **説明**: Vercelアカウントのアクセストークン
- **取得方法**:
  1. https://vercel.com/account/tokens にアクセス
  2. "Create Token" をクリック
  3. トークン名を入力（例: "GitHub Actions"）
  4. Scopeは "Full Account" を選択
  5. 生成されたトークンをコピー

#### `VERCEL_ORG_ID`
- **説明**: Vercel Organization ID
- **取得方法**:
  1. Vercelプロジェクトの Settings > General に移動
  2. "Organization ID" をコピー
  3. または `.vercel/project.json` の `orgId` フィールドからコピー

#### `VERCEL_PROJECT_ID`
- **説明**: Vercelプロジェクト ID
- **取得方法**:
  1. Vercelプロジェクトの Settings > General に移動
  2. "Project ID" をコピー
  3. または `.vercel/project.json` の `projectId` フィールドからコピー

### Render.com関連（バックエンド）

#### `RENDER_DEPLOY_HOOK`
- **説明**: Render.comのDeploy Hook URL
- **取得方法**:
  1. Render.comダッシュボードでWeb Serviceを選択
  2. Settings > Deploy Hook に移動
  3. "Create Deploy Hook" をクリック
  4. 名前を入力（例: "GitHub Actions"）
  5. 生成されたURLをコピー

#### `BACKEND_URL`
- **説明**: デプロイ後のバックエンドURL（ヘルスチェック用）
- **例**: `https://ma-pilot-backend.onrender.com`

### Supabase関連

#### `VITE_SUPABASE_URL`
- **説明**: Supabase プロジェクトURL
- **取得方法**:
  1. https://app.supabase.com にアクセス
  2. プロジェクトを選択
  3. Settings > API > Project URL をコピー

#### `VITE_SUPABASE_ANON_KEY`
- **説明**: Supabase Anonymous Key（公開可能）
- **取得方法**:
  1. Settings > API > Project API keys
  2. "anon" "public" キーをコピー

## セットアップ手順

### 1. GitHubリポジトリでSecretsを追加

```bash
# GitHubリポジトリページで
Settings > Secrets and variables > Actions > New repository secret
```

### 2. 各Secretを入力

| Secret名 | 値の例 |
|---------|--------|
| `VERCEL_TOKEN` | `abc123...` |
| `VERCEL_ORG_ID` | `team_xyz...` |
| `VERCEL_PROJECT_ID` | `prj_abc...` |
| `RENDER_DEPLOY_HOOK` | `https://api.render.com/deploy/srv_...` |
| `BACKEND_URL` | `https://ma-pilot-backend.onrender.com` |
| `VITE_SUPABASE_URL` | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` |

### 3. 設定確認

すべてのSecretsを追加したら、Actions タブで以下を確認:

1. 緑色のチェックマーク: すべての環境変数が正しく設定されている
2. エラーメッセージ: 不足している環境変数を確認

## トラブルシューティング

### Vercelデプロイが失敗する

- `VERCEL_TOKEN` が正しいか確認
- `VERCEL_ORG_ID` と `VERCEL_PROJECT_ID` が正しいか確認
- Vercelプロジェクトが存在するか確認

### Render.comデプロイが失敗する

- `RENDER_DEPLOY_HOOK` が正しいか確認
- Render.comでWeb Serviceが作成されているか確認
- Deploy Hookが有効か確認

### ビルドが失敗する

- `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` が正しいか確認
- Supabaseプロジェクトがアクティブか確認

## セキュリティ注意事項

- **絶対に** Secretsをコードにハードコードしないでください
- **絶対に** Secretsをコミットしないでください
- **絶対に** Secretsをプルリクエストのコメントに貼り付けないでください
- Secretsは環境変数として渡され、ログには `***` として表示されます
- 定期的にトークンをローテーションしてください

## 更新方法

Secretsを更新する場合:

1. Settings > Secrets and variables > Actions
2. 更新したいSecretをクリック
3. "Update secret" をクリック
4. 新しい値を入力
5. "Update secret" をクリック

## 参考リンク

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Render Deploy Hooks](https://render.com/docs/deploy-hooks)
