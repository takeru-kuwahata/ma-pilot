from fastapi import APIRouter, HTTPException, Depends
from ..models.user import LoginRequest, LoginResponse, PasswordResetRequest, PasswordResetResponse
from ..services.auth_service import AuthService
from ..core.database import get_supabase_client
from supabase import Client

router = APIRouter(prefix='/api/auth', tags=['Authentication'])


def get_auth_service(supabase: Client = Depends(get_supabase_client)) -> AuthService:
    '''Get auth service dependency'''
    return AuthService(supabase)


@router.post('/login', response_model=LoginResponse)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    '''Login user'''
    try:
        result = await auth_service.login(request.email, request.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


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
