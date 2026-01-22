from datetime import datetime, timedelta
from typing import Any, Optional, Dict
import logging

logger = logging.getLogger(__name__)


class TTLCache:
    """
    Time-to-Live付きキャッシュ
    頻繁に更新されないデータのキャッシュに使用
    例: 価格マスタ、設定情報など
    """

    def __init__(self, ttl_seconds: int = 300, max_size: int = 1000):
        """
        Args:
            ttl_seconds: キャッシュの有効期限（秒）
            max_size: 最大キャッシュサイズ
        """
        self._cache: Dict[str, tuple[Any, datetime]] = {}
        self._ttl = ttl_seconds
        self._max_size = max_size
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        """
        キャッシュから値を取得
        TTL内ならキャッシュヒット、期限切れならNone
        """
        if key in self._cache:
            value, timestamp = self._cache[key]
            if datetime.now() - timestamp < timedelta(seconds=self._ttl):
                self._hits += 1
                logger.debug(f'Cache HIT: {key}')
                return value
            else:
                # 期限切れアイテムを削除
                del self._cache[key]
                logger.debug(f'Cache EXPIRED: {key}')

        self._misses += 1
        logger.debug(f'Cache MISS: {key}')
        return None

    def set(self, key: str, value: Any) -> None:
        """
        キャッシュに値を設定
        """
        # キャッシュサイズ上限チェック
        if len(self._cache) >= self._max_size:
            self._evict_oldest()

        self._cache[key] = (value, datetime.now())
        logger.debug(f'Cache SET: {key}')

    def delete(self, key: str) -> bool:
        """
        キャッシュから削除
        """
        if key in self._cache:
            del self._cache[key]
            logger.debug(f'Cache DELETE: {key}')
            return True
        return False

    def clear(self) -> None:
        """
        キャッシュをクリア
        """
        self._cache.clear()
        self._hits = 0
        self._misses = 0
        logger.info('Cache CLEARED')

    def _evict_oldest(self) -> None:
        """
        最も古いキャッシュアイテムを削除（LRU的な動作）
        """
        if not self._cache:
            return

        oldest_key = min(self._cache.items(), key=lambda x: x[1][1])[0]
        del self._cache[oldest_key]
        logger.debug(f'Cache EVICTED (oldest): {oldest_key}')

    def get_stats(self) -> dict:
        """
        キャッシュ統計情報を取得
        """
        total_requests = self._hits + self._misses
        hit_rate = (self._hits / total_requests * 100) if total_requests > 0 else 0

        return {
            'size': len(self._cache),
            'max_size': self._max_size,
            'hits': self._hits,
            'misses': self._misses,
            'hit_rate': f'{hit_rate:.2f}%',
            'ttl_seconds': self._ttl,
        }

    def __len__(self) -> int:
        """キャッシュサイズ"""
        return len(self._cache)


# グローバルキャッシュインスタンス

# 価格マスタキャッシュ（1時間TTL）
price_cache = TTLCache(ttl_seconds=3600, max_size=500)

# 設定情報キャッシュ（30分TTL）
settings_cache = TTLCache(ttl_seconds=1800, max_size=100)

# 診療圏分析結果キャッシュ（24時間TTL）
market_analysis_cache = TTLCache(ttl_seconds=86400, max_size=50)
