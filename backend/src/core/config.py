from pydantic_settings import BaseSettings
from pydantic import validator, Field
from functools import lru_cache
from typing import List
import re


class Settings(BaseSettings):
    """Application settings with enhanced validation"""

    # Supabase
    supabase_url: str = Field(..., description='Supabase project URL')
    supabase_key: str = Field(..., description='Supabase anon/service key')

    # Server
    port: int = Field(default=8432, ge=1, le=65535, description='Server port')
    host: str = Field(default='0.0.0.0', description='Server host')
    environment: str = Field(default='development', description='Environment (development/staging/production)')

    # CORS
    frontend_url: str = Field(default='http://localhost:3247', description='Frontend URL for CORS')

    # Security
    allowed_hosts: List[str] = Field(
        default=[
            'localhost',
            '127.0.0.1',
            'ma-pilot.vercel.app',
            '*.vercel.app',  # Vercelプレビュー環境
            '*.onrender.com',  # Render.comバックエンド
        ],
        description='Allowed hosts for TrustedHostMiddleware',
    )

    # Optional API Keys
    e_stat_api_key: str = Field(default='', description='e-Stat API key (optional)')
    resas_api_key: str = Field(default='', description='RESAS API key (optional)')
    google_maps_api_key: str = Field(default='', description='Google Maps API key (optional)')

    @validator('supabase_url')
    def validate_supabase_url(cls, v: str) -> str:
        """Supabase URLのバリデーション: HTTPS必須"""
        if not v:
            raise ValueError('SUPABASE_URL is required')
        if not v.startswith('https://'):
            raise ValueError('SUPABASE_URL must use HTTPS (https://)')
        if not v.endswith('.supabase.co'):
            raise ValueError('SUPABASE_URL must be a valid Supabase project URL (*.supabase.co)')
        return v

    @validator('supabase_key')
    def validate_supabase_key(cls, v: str) -> str:
        """Supabase Keyのバリデーション: 長さチェック"""
        if not v:
            raise ValueError('SUPABASE_KEY is required')
        # Relaxed validation for development/testing
        if len(v) < 20:
            raise ValueError('SUPABASE_KEY appears to be invalid (too short)')
        return v

    @validator('environment')
    def validate_environment(cls, v: str) -> str:
        """環境変数のバリデーション"""
        allowed_envs = ['development', 'staging', 'production']
        if v not in allowed_envs:
            raise ValueError(f'ENVIRONMENT must be one of: {", ".join(allowed_envs)}')
        return v

    @validator('frontend_url')
    def validate_frontend_url(cls, v: str) -> str:
        """フロントエンドURLのバリデーション"""
        if not v:
            raise ValueError('FRONTEND_URL is required')
        # 開発環境はHTTP許可、本番はHTTPS必須
        if not v.startswith(('http://', 'https://')):
            raise ValueError('FRONTEND_URL must start with http:// or https://')
        return v

    @validator('allowed_hosts')
    def validate_allowed_hosts(cls, v: List[str]) -> List[str]:
        """許可ホストのバリデーション"""
        if not v:
            raise ValueError('ALLOWED_HOSTS must contain at least one host')
        return v

    @validator('port')
    def validate_port(cls, v: int) -> int:
        """ポート番号のバリデーション"""
        if v < 1 or v > 65535:
            raise ValueError('PORT must be between 1 and 65535')
        return v

    def is_production(self) -> bool:
        """本番環境かどうか"""
        return self.environment == 'production'

    def is_development(self) -> bool:
        """開発環境かどうか"""
        return self.environment == 'development'

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance with validation"""
    try:
        settings = Settings()
        return settings
    except Exception as e:
        raise RuntimeError(f'Failed to load settings: {str(e)}')
