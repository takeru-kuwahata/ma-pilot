from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from src.core import get_settings
from src.middleware.rate_limit import limiter, custom_rate_limit_handler
from src.middleware import PerformanceMiddleware
from src.api import (
    print_orders_router,
    auth_router,
    clinics_router,
    monthly_data_router,
    dashboard_router,
    simulations_router,
    reports_router,
    market_analysis_router,
    staff_router,
    admin_router,
    my_router,
)
import logging

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# 設定読み込み
settings = get_settings()

# FastAPIアプリケーション
app = FastAPI(
    title='MA-Pilot Backend API',
    description='歯科医院経営分析システム（印刷物受注システム含む）',
    version='1.0.0',
    docs_url='/docs' if not settings.is_production() else None,  # 本番環境ではドキュメント非公開
    redoc_url='/redoc' if not settings.is_production() else None,
)

# レート制限設定
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)

# パフォーマンス計測ミドルウェア
app.add_middleware(PerformanceMiddleware, slow_request_threshold=1.0)

# Gzip圧縮ミドルウェア（1KB以上のレスポンスを圧縮）
app.add_middleware(GZipMiddleware, minimum_size=1000)

# セキュリティヘッダーミドルウェア
@app.middleware('http')
async def add_security_headers(request: Request, call_next):
    """セキュリティヘッダーを追加するミドルウェア"""
    response = await call_next(request)

    # セキュリティヘッダー設定
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    # 本番環境のみHSTSを有効化
    if settings.is_production():
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    # CSP（Content Security Policy）設定
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' https://*.supabase.co;"
    )

    return response

# HTTPS リダイレクト（本番環境のみ）
if settings.is_production():
    app.add_middleware(HTTPSRedirectMiddleware)

# 信頼できるホストの制限
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.allowed_hosts,
)

# CORS設定
allowed_origins = [
    settings.frontend_url,
    'http://localhost:3247',
    'http://localhost:3248',
]

# 本番環境ではVercelプレビュー環境も許可
if settings.is_production() or settings.environment == 'staging':
    allowed_origins.extend([
        'https://ma-pilot.vercel.app',
        'https://ma-pilot-git-*.vercel.app',  # Gitブランチプレビュー
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allow_headers=['*'],
    expose_headers=['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    max_age=3600,  # プリフライトリクエストのキャッシュ（1時間）
)

# ルーター登録
app.include_router(print_orders_router)
app.include_router(auth_router)
app.include_router(clinics_router)
app.include_router(monthly_data_router)
app.include_router(dashboard_router)
app.include_router(simulations_router)
app.include_router(reports_router)
app.include_router(market_analysis_router)
app.include_router(staff_router)
app.include_router(admin_router)
app.include_router(my_router)


# ヘルスチェック
@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {
        "status": "healthy",
        "environment": settings.environment,
        "version": "1.0.0",
    }


# ルート
@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "MA-Pilot Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True if settings.environment == "development" else False,
    )
