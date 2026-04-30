from supabase import create_client, Client
from functools import lru_cache
from .config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """Get cached Supabase client instance"""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


def get_service_role_client() -> Client:
    """認証セッションの影響を受けないservice_role専用クライアント（DDL/管理操作用）"""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)
