#!/bin/bash

# ========================================
# MA-Pilot バックエンド本番デプロイスクリプト
# Cloud Run + --set-env-vars使用（簡易構成）
# ========================================

set -e  # エラー時に即座に終了

# プロジェクト設定
PROJECT_ID="meguribi-477204"
SERVICE_NAME="ma-pilot-backend"
REGION="asia-northeast1"  # 東京リージョン
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "=========================================="
echo "MA-Pilot バックエンドデプロイ"
echo "=========================================="
echo "プロジェクト: ${PROJECT_ID}"
echo "サービス名: ${SERVICE_NAME}"
echo "リージョン: ${REGION}"
echo ""

# 現在のディレクトリ確認
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="${PROJECT_ROOT}/backend"

echo "プロジェクトルート: ${PROJECT_ROOT}"
echo "バックエンドディレクトリ: ${BACKEND_DIR}"
echo ""

# バックエンドディレクトリに移動
cd "${BACKEND_DIR}"

# .env.localから環境変数を読み込む
ENV_FILE="${PROJECT_ROOT}/.env.local"
if [ ! -f "${ENV_FILE}" ]; then
    echo "❌ エラー: ${ENV_FILE} が見つかりません"
    exit 1
fi

echo "✅ 環境変数ファイル確認: ${ENV_FILE}"

# 環境変数リストを自動生成
echo "環境変数を準備中..."
ENV_FLAGS=""
while IFS='=' read -r key value; do
  # コメント行と空行をスキップ
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue

  # 値をトリム（先頭・末尾の空白削除）
  value=$(echo "$value" | xargs)

  # VITE_SUPABASE_URL → SUPABASE_URL に変換
  if [ "$key" == "VITE_SUPABASE_URL" ]; then
    ENV_FLAGS="$ENV_FLAGS,SUPABASE_URL=$value"
    continue
  fi

  # VITE_SUPABASE_ANON_KEY → SUPABASE_KEY に変換
  if [ "$key" == "VITE_SUPABASE_ANON_KEY" ]; then
    ENV_FLAGS="$ENV_FLAGS,SUPABASE_KEY=$value"
    continue
  fi

  # VITE_プレフィックスの残りはスキップ
  if [[ "$key" =~ ^VITE_.*$ ]]; then
    continue
  fi

  # PORT環境変数はCloud Runが自動設定するのでスキップ
  if [ "$key" == "PORT" ]; then
    continue
  fi

  ENV_FLAGS="$ENV_FLAGS,$key=$value"
done < "${ENV_FILE}"

# 必須環境変数の追加（PORTはCloud Runが自動設定するため不要）
ENV_FLAGS="$ENV_FLAGS,HOST=0.0.0.0,ENVIRONMENT=production"

# 先頭のカンマを削除
ENV_FLAGS="${ENV_FLAGS:1}"

echo "✅ 環境変数準備完了"
echo ""

# Dockerイメージビルド
echo "=========================================="
echo "Step 1: Dockerイメージビルド"
echo "=========================================="
docker build -t "${IMAGE_NAME}:latest" .
echo "✅ ビルド完了"
echo ""

# Container Registryにプッシュ
echo "=========================================="
echo "Step 2: Container Registryにプッシュ"
echo "=========================================="
docker push "${IMAGE_NAME}:latest"
echo "✅ プッシュ完了"
echo ""

# Cloud Runデプロイ
echo "=========================================="
echo "Step 3: Cloud Runデプロイ"
echo "=========================================="

# 初回デプロイか既存サービスの更新かを判定
if gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} >/dev/null 2>&1; then
    echo "既存サービスを更新します..."
    DEPLOY_MODE="update"
else
    echo "新規サービスを作成します..."
    DEPLOY_MODE="create"
fi

gcloud run deploy ${SERVICE_NAME} \
  --image "${IMAGE_NAME}:latest" \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 80 \
  --timeout 5m \
  --set-env-vars="${ENV_FLAGS}" \
  --project=${PROJECT_ID}

echo "✅ デプロイ完了"
echo ""

# デプロイされたURLを取得
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --format='value(status.url)')

echo "=========================================="
echo "🎉 デプロイ成功！"
echo "=========================================="
echo "サービスURL: ${SERVICE_URL}"
echo "ヘルスチェック: ${SERVICE_URL}/health"
echo "APIドキュメント: ${SERVICE_URL}/docs（本番環境では無効化されています）"
echo ""
echo "次のステップ:"
echo "1. Vercelの環境変数 VITE_BACKEND_URL を ${SERVICE_URL} に設定"
echo "2. Vercel再デプロイを実行"
echo "=========================================="
