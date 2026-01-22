"""
セキュリティイベント・監査ログユーティリティ
重要な操作をSupabaseのsecurity_audit_logsテーブルに記録
"""
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from fastapi import Request
from supabase import Client

logger = logging.getLogger(__name__)


class SecurityEventType(str, Enum):
    """セキュリティイベントタイプ"""

    LOGIN = 'login'
    LOGOUT = 'logout'
    FAILED_AUTH = 'failed_auth'
    DATA_ACCESS = 'data_access'
    DATA_MODIFICATION = 'data_modification'
    PERMISSION_CHANGE = 'permission_change'
    ACCOUNT_CREATED = 'account_created'
    ACCOUNT_DELETED = 'account_deleted'
    PASSWORD_RESET = 'password_reset'
    SUSPICIOUS_ACTIVITY = 'suspicious_activity'


async def log_security_event(
    supabase: Client,
    event_type: SecurityEventType,
    user_id: Optional[str] = None,
    table_name: Optional[str] = None,
    record_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> bool:
    """
    セキュリティイベントをデータベースに記録

    Args:
        supabase: Supabaseクライアント
        event_type: イベントタイプ
        user_id: ユーザーID（オプション）
        table_name: 操作対象のテーブル名（オプション）
        record_id: 操作対象のレコードID（オプション）
        details: 追加詳細情報（JSON形式）
        ip_address: IPアドレス
        user_agent: ユーザーエージェント

    Returns:
        成功したかどうか
    """
    try:
        # security_audit_logsテーブルにInsert
        audit_log_data = {
            'event_type': event_type.value,
            'user_id': user_id,
            'table_name': table_name,
            'record_id': record_id,
            'details': details or {},
            'ip_address': ip_address,
            'user_agent': user_agent,
            'created_at': datetime.utcnow().isoformat(),
        }

        supabase.table('security_audit_logs').insert(audit_log_data).execute()

        # ローカルログにも記録
        logger.info(
            f'Security event logged: {event_type.value} | '
            f'User: {user_id or "anonymous"} | '
            f'Table: {table_name or "N/A"} | '
            f'IP: {ip_address or "N/A"}'
        )

        return True

    except Exception as e:
        # ログ記録失敗時はローカルログのみ
        logger.error(f'Failed to log security event to database: {str(e)}')
        logger.warning(
            f'Security event (local only): {event_type.value} | '
            f'User: {user_id or "anonymous"} | '
            f'Details: {details}'
        )
        return False


async def log_api_access(
    request: Request,
    supabase: Client,
    user_id: Optional[str] = None,
    response_status: Optional[int] = None,
) -> None:
    """
    APIアクセスを記録（重要なエンドポイントのみ）

    Args:
        request: Requestオブジェクト
        supabase: Supabaseクライアント
        user_id: ユーザーID（認証済みの場合）
        response_status: レスポンスステータスコード
    """
    try:
        # 記録対象のエンドポイントパターン
        important_patterns = ['/api/clinics', '/api/monthly-data', '/api/admin', '/api/reports']

        # パスが記録対象かチェック
        should_log = any(pattern in str(request.url.path) for pattern in important_patterns)

        if not should_log:
            return

        # IPアドレス取得
        ip_address = request.client.host if request.client else None

        # ユーザーエージェント取得
        user_agent = request.headers.get('user-agent', 'Unknown')

        # 詳細情報
        details = {
            'method': request.method,
            'path': str(request.url.path),
            'query_params': dict(request.query_params),
            'response_status': response_status,
        }

        await log_security_event(
            supabase=supabase,
            event_type=SecurityEventType.DATA_ACCESS,
            user_id=user_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    except Exception as e:
        logger.error(f'Failed to log API access: {str(e)}')


def get_client_ip(request: Request) -> Optional[str]:
    """
    クライアントIPアドレスを取得（プロキシ対応）

    Args:
        request: Requestオブジェクト

    Returns:
        IPアドレス
    """
    # X-Forwarded-Forヘッダー（プロキシ経由の場合）
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        # カンマ区切りの最初のIPを取得
        return forwarded_for.split(',')[0].strip()

    # X-Real-IPヘッダー（nginx等）
    real_ip = request.headers.get('X-Real-IP')
    if real_ip:
        return real_ip

    # 直接接続の場合
    if request.client:
        return request.client.host

    return None
