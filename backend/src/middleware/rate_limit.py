"""
レート制限ミドルウェア
slowapiを使用してAPIエンドポイントへのアクセス頻度を制限
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from typing import Callable
import logging

logger = logging.getLogger(__name__)

# Limiterのインスタンス作成（IPアドレスベース）
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=['100/minute', '1000/hour', '5000/day'],
    storage_uri='memory://',  # 本番環境ではRedis等を推奨
)


def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """
    レート制限超過時のカスタムハンドラー

    Args:
        request: リクエストオブジェクト
        exc: RateLimitExceeded例外

    Returns:
        JSONレスポンス
    """
    logger.warning(f'Rate limit exceeded for IP: {get_remote_address(request)}, Path: {request.url.path}')

    return Response(
        content='{"error": "Rate limit exceeded. Please try again later."}',
        status_code=429,
        headers={
            'Content-Type': 'application/json',
            'Retry-After': str(exc.retry_after) if hasattr(exc, 'retry_after') else '60',
        },
    )


# カスタムレート制限定義
# 認証エンドポイント: 厳しく制限
AUTH_RATE_LIMIT = '5/minute'

# 読み取り専用エンドポイント: 標準制限
READ_RATE_LIMIT = '100/minute'

# 書き込みエンドポイント: やや厳しく制限
WRITE_RATE_LIMIT = '30/minute'

# 公開エンドポイント（価格表など）: やや緩く
PUBLIC_RATE_LIMIT = '200/minute'

# 重いエンドポイント（レポート生成、PDF生成など）: 厳しく制限
HEAVY_RATE_LIMIT = '5/minute'


def apply_rate_limit(func: Callable, limit: str = None) -> Callable:
    """
    デコレータ: レート制限を適用

    Usage:
        @router.get('/api/data')
        @apply_rate_limit(limit='100/minute')
        async def get_data(request: Request):
            pass

    Args:
        func: デコレートする関数
        limit: レート制限（例: '100/minute', '10/second'）

    Returns:
        デコレートされた関数
    """
    if limit:
        return limiter.limit(limit)(func)
    return func
