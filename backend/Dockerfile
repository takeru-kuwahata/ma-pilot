# マルチステージビルド（イメージサイズ削減）
FROM python:3.12-slim AS builder

# 作業ディレクトリ設定
WORKDIR /app

# システムパッケージ更新とビルドツールインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# 依存関係のみ先にインストール（キャッシュ最適化）
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ソースコードのコピー
COPY . .

# 本番用の最小イメージ
FROM python:3.12-slim

# 作業ディレクトリ設定
WORKDIR /app

# WeasyPrint用のシステムライブラリインストール
# fonts-noto-cjk: PDFテンプレートが 'Noto Sans JP' を指定しており、
#   これが無いと日本語が豆腐（□）になる（slimイメージに和文フォントは非同梱）
# libffi8: cffi の実行時依存（builderの libffi-dev はビルド時のみ）
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libharfbuzz0b \
    libffi8 \
    shared-mime-info \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# ビルド成果物のみコピー
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app /app

# ⚠️ 環境変数はDockerfileに絶対に記載しない
# Cloud Runの--set-env-varsまたはSecret Managerで設定

# ポート公開（Cloud RunはPORT環境変数を自動設定）
EXPOSE 8080

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import os,urllib.request; urllib.request.urlopen('http://localhost:'+os.environ.get('PORT','8080')+'/health')" || exit 1

# アプリケーション起動
# Cloud RunはPORT環境変数を提供するため、それを使用
# JSONフォーマットでCMDを記述（シグナルハンドリング対応）
# --proxy-headers / --forwarded-allow-ips:
#   Cloud RunはHTTPSを終端しコンテナへHTTPで転送する。これが無いと
#   HTTPSRedirectMiddleware がスキームをhttpと判定し無限307ループになる
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --proxy-headers --forwarded-allow-ips='*'"]
