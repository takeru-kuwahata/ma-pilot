from fastapi import APIRouter, HTTPException, Depends, Request
from ..models.user import LoginRequest, LoginResponse, PasswordResetRequest, PasswordResetResponse, RegisterRequest, RegisterResponse
from ..services.auth_service import AuthService
from ..core.database import get_supabase_client
from supabase import Client
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix='/api/auth', tags=['Authentication'])


def get_auth_service(supabase: Client = Depends(get_supabase_client)) -> AuthService:
    '''Get auth service dependency'''
    return AuthService(supabase)


@router.post('/login', response_model=LoginResponse)
async def login(
    login_request: LoginRequest,
    raw_request: Request,
    auth_service: AuthService = Depends(get_auth_service)
):
    '''Login user'''
    try:
        # デバッグ用ログ出力
        logger.info(f'Login attempt - email: {login_request.email}')
        logger.info(f'Request content-type: {raw_request.headers.get("content-type")}')

        result = await auth_service.login(login_request.email, login_request.password)
        return result
    except ValueError as e:
        logger.error(f'Login failed: {str(e)}')
        raise HTTPException(status_code=401, detail=str(e))


@router.post('/register', response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    '''Self-register a new clinic owner'''
    try:
        result = await auth_service.register(
            email=request.email,
            password=request.password,
            clinic_name=request.clinic_name,
            postal_code=request.postal_code,
            address=request.address,
            phone_number=request.phone_number,
            slug=request.slug,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/logout')
async def logout(
    auth_service: AuthService = Depends(get_auth_service)
):
    '''Logout user'''
    try:
        result = await auth_service.logout('')
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/reset-password', response_model=PasswordResetResponse)
async def reset_password(
    request: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    '''Send password reset email'''
    try:
        result = await auth_service.reset_password(request.email)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
