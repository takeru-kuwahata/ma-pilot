#!/bin/bash

# MA-Pilot デプロイセットアップスクリプト
# このスクリプトは初回デプロイの準備を自動化します

set -e

echo "========================================="
echo "MA-Pilot デプロイセットアップ"
echo "========================================="
echo ""

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 必須コマンドチェック
echo "1. 必須コマンドをチェック中..."
MISSING_COMMANDS=()

if ! command -v git &> /dev/null; then
    MISSING_COMMANDS+=("git")
fi

if ! command -v node &> /dev/null; then
    MISSING_COMMANDS+=("node")
fi

if ! command -v npm &> /dev/null; then
    MISSING_COMMANDS+=("npm")
fi

if ! command -v python3 &> /dev/null; then
    MISSING_COMMANDS+=("python3")
fi

if [ ${#MISSING_COMMANDS[@]} -ne 0 ]; then
    echo -e "${RED}エラー: 以下のコマンドがインストールされていません:${NC}"
    printf '%s\n' "${MISSING_COMMANDS[@]}"
    exit 1
fi

echo -e "${GREEN}✓ 必須コマンドが揃っています${NC}"
echo ""

# 2. GitHubリポジトリ確認
echo "2. GitHubリポジトリをチェック中..."
if ! git remote get-url origin &> /dev/null; then
    echo -e "${RED}エラー: GitHubリモートリポジトリが設定されていません${NC}"
    echo "以下のコマンドでリポジトリを設定してください:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    exit 1
fi

REPO_URL=$(git remote get-url origin)
echo -e "${GREEN}✓ リポジトリ: ${REPO_URL}${NC}"
echo ""

# 3. フロントエンド環境変数チェック
echo "3. フロントエンド環境変数をチェック中..."
if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}警告: frontend/.env.local が見つかりません${NC}"
    echo "frontend/.env.example をコピーして frontend/.env.local を作成してください"
    echo ""
    read -p ".env.localを今すぐ作成しますか？ (y/n): " CREATE_FRONTEND_ENV
    if [ "$CREATE_FRONTEND_ENV" = "y" ]; then
        cp frontend/.env.example frontend/.env.local
        echo -e "${GREEN}✓ frontend/.env.local を作成しました${NC}"
        echo -e "${YELLOW}⚠ frontend/.env.local を編集して、Supabase URLとAPIキーを設定してください${NC}"
        echo ""
    fi
else
    echo -e "${GREEN}✓ frontend/.env.local が存在します${NC}"
fi
echo ""

# 4. バックエンド環境変数チェック
echo "4. バックエンド環境変数をチェック中..."
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}警告: backend/.env が見つかりません${NC}"
    echo "backend/.env.example をコピーして backend/.env を作成してください"
    echo ""
    read -p ".envを今すぐ作成しますか？ (y/n): " CREATE_BACKEND_ENV
    if [ "$CREATE_BACKEND_ENV" = "y" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✓ backend/.env を作成しました${NC}"
        echo -e "${YELLOW}⚠ backend/.env を編集して、Supabase URLとAPIキーを設定してください${NC}"
        echo ""
    fi
else
    echo -e "${GREEN}✓ backend/.env が存在します${NC}"
fi
echo ""

# 5. フロントエンド依存関係インストール
echo "5. フロントエンド依存関係をインストール中..."
cd frontend
if npm ci; then
    echo -e "${GREEN}✓ フロントエンド依存関係のインストール完了${NC}"
else
    echo -e "${YELLOW}⚠ npm ci が失敗しました。npm install を試行します...${NC}"
    npm install
    echo -e "${GREEN}✓ フロントエンド依存関係のインストール完了${NC}"
fi
cd ..
echo ""

# 6. バックエンド依存関係インストール
echo "6. バックエンド依存関係をインストール中..."
cd backend

if [ ! -d "venv" ]; then
    echo "仮想環境を作成中..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
echo -e "${GREEN}✓ バックエンド依存関係のインストール完了${NC}"
deactivate
cd ..
echo ""

# 7. フロントエンドビルドテスト
echo "7. フロントエンドビルドテストを実行中..."
cd frontend
if npm run build; then
    echo -e "${GREEN}✓ フロントエンドビルド成功${NC}"
else
    echo -e "${RED}エラー: フロントエンドビルドが失敗しました${NC}"
    cd ..
    exit 1
fi
cd ..
echo ""

# 8. バックエンド起動テスト
echo "8. バックエンド起動テストをスキップ（環境変数未設定の可能性）"
echo ""

# 9. デプロイ準備完了
echo "========================================="
echo -e "${GREEN}デプロイ準備が完了しました！${NC}"
echo "========================================="
echo ""
echo "次のステップ:"
echo ""
echo "【必須】Supabaseセットアップ"
echo "  1. https://app.supabase.com でプロジェクト作成"
echo "  2. SQL Editorで backend/supabase_schema.sql を実行"
echo "  3. Settings > API で URL と API Key を取得"
echo ""
echo "【必須】Vercelデプロイ"
echo "  1. https://vercel.com/new でプロジェクトをインポート"
echo "  2. Root Directory: 'frontend' を設定"
echo "  3. Environment Variables を設定:"
echo "     - VITE_SUPABASE_URL"
echo "     - VITE_SUPABASE_ANON_KEY"
echo "     - VITE_BACKEND_URL (Render.comのURL)"
echo ""
echo "【必須】Render.comデプロイ"
echo "  1. https://dashboard.render.com/new で Web Service を作成"
echo "  2. Root Directory: 'backend' を設定"
echo "  3. Environment Variables を設定:"
echo "     - SUPABASE_URL"
echo "     - SUPABASE_KEY (service_role key)"
echo "     - FRONTEND_URL (VercelのURL)"
echo ""
echo "【推奨】自動デプロイ設定"
echo "  - Vercel: GitHub連携で自動設定"
echo "  - Render.com: Auto-Deploy を有効化"
echo "  - 以降は 'git push origin main' でデプロイ"
echo ""
echo "詳細は docs/DEPLOYMENT_GUIDE.md を参照してください"
echo ""
