"""
認証・認可ミドルウェア
Supabase Auth JWTトークンを検証し、ユーザー情報とロールを取得
"""
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from functools import wraps
import logging

from ..core.database import get_supabase_client

logger = logging.getLogger(__name__)

# HTTPベアラートークン認証スキーム
security = HTTPBearer()


class UserContext:
    """ユーザーコンテキスト情報を保持するクラス"""

    def __init__(
        self,
        user_id: str,
        email: str,
        role: Optional[str] = None,
        clinic_id: Optional[str] = None,
    ):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.clinic_id = clinic_id

    def is_system_admin(self) -> bool:
        """システム管理者かどうか"""
        return self.role == 'system_admin'

    def is_clinic_owner(self) -> bool:
        """クリニックオーナーかどうか"""
        return self.role == 'clinic_owner'

    def is_clinic_editor(self) -> bool:
        """クリニック編集者かどうか"""
        return self.role == 'clinic_editor'

    def is_clinic_viewer(self) -> bool:
        """クリニック閲覧者かどうか"""
        return self.role == 'clinic_viewer'

    def has_clinic_access(self, target_clinic_id: str) -> bool:
        """指定されたクリニックへのアクセス権限があるか"""
        if self.is_system_admin():
            return True
        return self.clinic_id == target_clinic_id

    def can_edit_clinic_data(self, target_clinic_id: str) -> bool:
        """指定されたクリニックのデータを編集できるか"""
        if self.is_system_admin():
            return True
        if self.clinic_id != target_clinic_id:
            return False
        return self.role in ['clinic_owner', 'clinic_editor']


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase_client),
) -> Dict[str, Any]:
    """
    JWTトークンから現在のユーザー情報を取得

    Args:
        credentials: HTTPベアラートークン
        supabase: Supabaseクライアント

    Returns:
        ユーザー情報辞書

    Raises:
        HTTPException: 認証失敗時
    """
    try:
        # Supabase Auth でトークンを検証
        user_response = supabase.auth.get_user(credentials.credentials)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid authentication credentials',
                headers={'WWW-Authenticate': 'Bearer'},
            )

        return user_response.user

    except Exception as e:
        logger.error(f'Authentication error: {str(e)}')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Could not validate credentials',
            headers={'WWW-Authenticate': 'Bearer'},
        )


async def get_current_user_metadata(
    user: Dict[str, Any] = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> UserContext:
    """
    現在のユーザーのメタデータ（ロール、クリニックID）を取得

    Args:
        user: 現在のユーザー情報
        supabase: Supabaseクライアント

    Returns:
        UserContextオブジェクト

    Raises:
        HTTPException: ユーザーメタデータ取得失敗時
    """
    try:
        # user_metadata テーブルからロールとクリニックIDを取得
        response = supabase.table('user_metadata').select('role, clinic_id').eq('user_id', user.id).single().execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='User metadata not found. Please contact administrator.',
            )

        return UserContext(
            user_id=user.id,
            email=user.email,
            role=response.data.get('role'),
            clinic_id=response.data.get('clinic_id'),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Error fetching user metadata: {str(e)}')
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to retrieve user metadata',
        )


def require_role(*allowed_roles: str):
    """
    指定されたロールを持つユーザーのみアクセスを許可するデコレータ

    Usage:
        @require_role('system_admin', 'clinic_owner')
        async def some_endpoint(user_context: UserContext = Depends(get_current_user_metadata)):
            pass

    Args:
        *allowed_roles: 許可するロール（可変長引数）

    Returns:
        依存性関数
    """

    async def role_checker(
        user_context: UserContext = Depends(get_current_user_metadata),
    ) -> UserContext:
        if user_context.role not in allowed_roles:
            logger.warning(
                f'Access denied for user {user_context.user_id} '
                f'with role {user_context.role}. Required: {allowed_roles}'
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f'Insufficient permissions. Required role: {", ".join(allowed_roles)}',
            )
        return user_context

    return role_checker


def require_clinic_access(clinic_id_param: str = 'clinic_id'):
    """
    指定されたクリニックへのアクセス権限を持つユーザーのみアクセスを許可

    Usage:
        @router.get('/clinics/{clinic_id}')
        async def get_clinic(
            clinic_id: str,
            user_context: UserContext = Depends(require_clinic_access('clinic_id'))
        ):
            pass

    Args:
        clinic_id_param: パスパラメータまたはクエリパラメータのキー名

    Returns:
        依存性関数
    """

    async def clinic_access_checker(
        request: Request,
        user_context: UserContext = Depends(get_current_user_metadata),
    ) -> UserContext:
        # パスパラメータまたはクエリパラメータからクリニックIDを取得
        target_clinic_id = request.path_params.get(clinic_id_param) or request.query_params.get(clinic_id_param)

        if not target_clinic_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Missing required parameter: {clinic_id_param}',
            )

        if not user_context.has_clinic_access(target_clinic_id):
            logger.warning(
                f'Access denied for user {user_context.user_id} '
                f'to clinic {target_clinic_id}'
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You do not have access to this clinic',
            )

        return user_context

    return clinic_access_checker


def require_clinic_edit_permission(clinic_id_param: str = 'clinic_id'):
    """
    指定されたクリニックのデータ編集権限を持つユーザーのみアクセスを許可

    Usage:
        @router.put('/clinics/{clinic_id}/monthly-data')
        async def update_monthly_data(
            clinic_id: str,
            user_context: UserContext = Depends(require_clinic_edit_permission('clinic_id'))
        ):
            pass

    Args:
        clinic_id_param: パスパラメータまたはクエリパラメータのキー名

    Returns:
        依存性関数
    """

    async def clinic_edit_checker(
        request: Request,
        user_context: UserContext = Depends(get_current_user_metadata),
    ) -> UserContext:
        # パスパラメータまたはクエリパラメータからクリニックIDを取得
        target_clinic_id = request.path_params.get(clinic_id_param) or request.query_params.get(clinic_id_param)

        if not target_clinic_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Missing required parameter: {clinic_id_param}',
            )

        if not user_context.can_edit_clinic_data(target_clinic_id):
            logger.warning(
                f'Edit permission denied for user {user_context.user_id} '
                f'to clinic {target_clinic_id}'
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You do not have permission to edit this clinic data',
            )

        return user_context

    return clinic_edit_checker


# Optional認証（トークンがなくてもOK、あれば検証）
async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    supabase: Client = Depends(get_supabase_client),
) -> Optional[UserContext]:
    """
    オプショナル認証: トークンがある場合は検証、ない場合はNoneを返す

    公開APIエンドポイント（価格表、印刷物受注フォーム等）で使用

    Args:
        credentials: HTTPベアラートークン（オプショナル）
        supabase: Supabaseクライアント

    Returns:
        UserContextまたはNone
    """
    if not credentials:
        return None

    try:
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response or not user_response.user:
            return None

        # メタデータ取得
        metadata_response = (
            supabase.table('user_metadata')
            .select('role, clinic_id')
            .eq('user_id', user_response.user.id)
            .single()
            .execute()
        )

        if metadata_response.data:
            return UserContext(
                user_id=user_response.user.id,
                email=user_response.user.email,
                role=metadata_response.data.get('role'),
                clinic_id=metadata_response.data.get('clinic_id'),
            )

        return None

    except Exception as e:
        logger.debug(f'Optional authentication failed: {str(e)}')
        return None
