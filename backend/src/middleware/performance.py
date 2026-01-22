import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


class PerformanceMiddleware(BaseHTTPMiddleware):
    """
    パフォーマンス計測ミドルウェア
    - リクエスト処理時間を計測
    - 遅いリクエストを警告ログに記録
    - レスポンスヘッダーに処理時間を追加
    """

    def __init__(self, app: ASGIApp, slow_request_threshold: float = 1.0):
        """
        Args:
            app: ASGIアプリケーション
            slow_request_threshold: 遅いリクエストとみなす閾値（秒）
        """
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold

    async def dispatch(self, request: Request, call_next):
        # 処理時間計測開始
        start_time = time.time()

        # リクエスト処理
        response = await call_next(request)

        # 処理時間計算
        process_time = time.time() - start_time

        # レスポンスヘッダーに処理時間を追加
        response.headers['X-Process-Time'] = f'{process_time:.3f}'

        # ログ出力
        log_data = {
            'method': request.method,
            'path': request.url.path,
            'status': response.status_code,
            'time': f'{process_time:.3f}s',
        }

        # 遅いリクエストを警告
        if process_time > self.slow_request_threshold:
            logger.warning(
                f'SLOW REQUEST: {request.method} {request.url.path} '
                f'took {process_time:.3f}s (threshold: {self.slow_request_threshold}s)'
            )
        else:
            logger.info(
                f'{request.method} {request.url.path} '
                f'[{response.status_code}] {process_time:.3f}s'
            )

        return response
