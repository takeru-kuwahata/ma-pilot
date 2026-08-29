# Cloud Run デプロイ手順

2026-08-29 に Render.com から移行。通常は `main` への push で GitHub Actions が自動デプロイするため、この手順書は**手動デプロイ・障害対応・移管作業**のときに使う。

## 構成

| 項目 | 値 |
|---|---|
| GCPプロジェクト | `ma-pilot-prod`（MA-Pilot専用） |
| サービス名 | `ma-pilot-backend` |
| リージョン | `asia-northeast1`（東京） |
| URL | https://ma-pilot-backend-536185990243.asia-northeast1.run.app |
| スペック | min-instances=1 / 1vCPU / メモリ1GB / CPUブースト有効 / timeout 300s |
| イメージ | `asia-northeast1-docker.pkg.dev/ma-pilot-prod/ma-pilot/backend` |
| 請求先 | 請求先アカウント2（`01E88F-528585-CAA2FC`） |

**専用プロジェクトにした理由**: 将来クライアント（メディカルアドバンス社）へ**請求先を付け替えるだけで移管**できるようにするため。他案件と同居させるとMA-Pilotだけを分離できない。

## 自動デプロイ（通常運用）

`main` へ push すると `.github/workflows/deploy.yml` の `deploy-backend` ジョブが動く。

- 認証は **Workload Identity Federation**（サービスアカウント鍵ファイル不要）
- `takeru-kuwahata/ma-pilot` リポジトリからのみ認証可能（attribute-condition で制限）
- CI は `--image` のみ更新する。**環境変数・シークレットはCloud Run側の設定を引き継ぐ**ため、CIの変更で消える心配はない

デプロイ後は自動でヘルスチェックが走る。失敗したらジョブが赤くなる。

## 手動デプロイ

```bash
# アカウント確認（meguribi用SAになっていることがある）
gcloud config set account kuwahata@idw-japan.net

cd backend
IMG="asia-northeast1-docker.pkg.dev/ma-pilot-prod/ma-pilot/backend:$(git rev-parse --short HEAD)"
docker build --platform linux/amd64 -t "$IMG" .
docker push "$IMG"
gcloud run deploy ma-pilot-backend --image="$IMG" \
  --project=ma-pilot-prod --region=asia-northeast1 --platform=managed
```

## 環境変数・シークレット

**平文env**（`--set-env-vars`）: `ENVIRONMENT` / `FRONTEND_URL` / `SUPABASE_URL` / `RESEND_FROM_EMAIL` / `SMTP_*` / `WORDPRESS_API_URL` / `WORDPRESS_API_USERNAME` / `LOG_LEVEL`

**Secret Manager**（`--set-secrets`）: `SUPABASE_KEY` / `STRIPE_SECRET_KEY` / `RESEND_API_KEY` / `E_STAT_API_KEY` / `GOOGLE_MAPS_API_KEY` / `WORDPRESS_API_PASSWORD`

シークレットを更新する場合:

```bash
printf '<新しい値>' | gcloud secrets versions add <NAME> --data-file=- --project=ma-pilot-prod
gcloud run services update ma-pilot-backend --project=ma-pilot-prod --region=asia-northeast1  # 再起動で反映
```

### 🔐 再発行できない機密（クライアント提供）

`RESEND_API_KEY`（medical-advance.com のDKIM認証済み）/ `STRIPE_SECRET_KEY`（**sk_live_＝本番決済**）/ `WORDPRESS_API_PASSWORD` / `SUPABASE_KEY`（service_role）は**メディカルアドバンス社の資産で弊社では再発行できない**。

保全先（三重）:
1. パスワードマネージャー（「MA-Pilot / 〜」で登録）
2. `~/Library/Application Support/ma-pilot-secrets/`（権限700/600・Dropbox外・Git管理外）
3. Secret Manager

## ⚠️ Dockerfileの必須要素（削除禁止）

Renderは `env: python` のネイティブビルドで動いていたためDockerfileが未検証だった。Cloud Run移行時に以下4件の欠陥を修正済み。**消すと壊れる**。

| 要素 | 無いとどうなるか |
|---|---|
| `fonts-noto-cjk` | **PDFの日本語が豆腐（□）になる**。テンプレートは `Noto Sans JP` 指定・Webフォント読み込み無しでOSフォント依存 |
| `libffi8` | cffi の実行時依存。起動失敗 |
| `--proxy-headers --forwarded-allow-ips='*'` | Cloud RunはHTTPSを終端しHTTPで転送するため `HTTPSRedirectMiddleware` が**無限307ループ** |
| `allowed_hosts` の `*.run.app`（config.py） | `TrustedHostMiddleware` が全リクエストを**400拒否** |

PDF検証方法:
```bash
pdffonts <PDF>              # Noto-Sans-JP が embedded か
pdftotext <PDF> - | head    # 日本語が抽出できるか
```

## ロールバック

### Cloud Run内でのリビジョン切り戻し

```bash
gcloud run revisions list --service=ma-pilot-backend --project=ma-pilot-prod --region=asia-northeast1
gcloud run services update-traffic ma-pilot-backend --to-revisions=<REVISION>=100 \
  --project=ma-pilot-prod --region=asia-northeast1
```

### Renderへ戻す（〜2026-09-12頃まで可能）

Renderは稼働継続中なので、Vercelの環境変数を戻して再デプロイするだけ。

```bash
# vercel CLIの env add は非対話環境で値が空になる罠がある → API経由が確実
TOKEN=$(python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/Library/Application Support/com.vercel.cli/auth.json')))['token'])")
curl -X POST "https://api.vercel.com/v10/projects/prj_nqm17XscxatQYVDmNI4khAYoR9J5/env?teamId=team_OD6Y6uMcNUtBk0MELg3mgGic" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"key":"VITE_BACKEND_URL","value":"https://ma-pilot.onrender.com","type":"encrypted","target":["production"]}'
```

設定後は必ず `npx vercel env pull` で実値を確認すること（空文字で保存される事故が実際に起きた）。

## Artifact Registry

クリーンアップポリシー設定済み（最新10世代保持・未タグ7日で削除）。

**Why**: 既存プロジェクト `meguribi-477204` では削除ポリシー未設定のため568イメージ・69.6GBが10ヶ月蓄積し、月額約$6.9（年$83）が発生していた。同じ轍を踏まないよう最初から設定した。

```bash
gcloud artifacts repositories describe ma-pilot --location=asia-northeast1 --project=ma-pilot-prod
```

## 将来: クライアントへの移管

2ヶ月後（2026年10月頃）にメディカルアドバンス社へ移管予定。

1. 先方のGCP請求先アカウントを用意してもらう
2. `gcloud billing projects link ma-pilot-prod --billing-account=<先方のID>` で請求先を付け替え
3. 弊社アカウントには IAM で editor 権限を残す → Claude Code / GitHub からの改修を継続できる
4. **リソースの移設は不要**（プロジェクトごと移るため）

Supabase・Vercel も同様に組織移管が可能。ドメイン取得後にDNSを紐付ける。
