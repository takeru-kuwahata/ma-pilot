from fastapi import APIRouter, HTTPException, Depends, Query
from ..models.user import InviteUserRequest, InviteUserResponse, UpdateUserRoleRequest, User
from ..services.auth_service import AuthService
from ..core.database import get_supabase_client
from supabase import Client
from typing import List

router = APIRouter(prefix='/api/staff', tags=['Staff Management'])


def get_auth_service(supabase: Client = Depends(get_supabase_client)) -> AuthService:
    '''Get auth service dependency'''
    return AuthService(supabase)


@router.get('', response_model=List[User])
async def get_staff(
    clinic_id: str = Query(...),
    supabase: Client = Depends(get_supabase_client)
):
    '''Get all staff members for clinic'''
    try:
        # Get all users for clinic
        response = supabase.table('user_metadata').select('*').eq('clinic_id', clinic_id).execute()

        staff_list = []
        for metadata in response.data:
            # Get user email from auth
            user_response = supabase.auth.admin.get_user_by_id(metadata['user_id'])
            if user_response.user:
                staff_list.append(User(
                    id=metadata['user_id'],
                    email=user_response.user.email,
                    role=metadata['role'],
                    clinic_id=metadata['clinic_id'],
                    created_at=metadata['created_at'],
                    updated_at=metadata['updated_at']
                ))

        return staff_list
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/invite', response_model=InviteUserResponse)
async def invite_staff(
    request: InviteUserRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    '''Invite new staff member'''
    try:
        result = await auth_service.invite_user(request.email, request.role, request.clinic_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/{user_id}/role')
async def update_staff_role(
    user_id: str,
    request: UpdateUserRoleRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    '''Update staff member role'''
    try:
        result = await auth_service.update_user_role(user_id, request.role)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete('/{user_id}')
async def delete_staff(
    user_id: str,
    auth_service: AuthService = Depends(get_auth_service)
):
    '''Delete staff member'''
    try:
        result = await auth_service.delete_user(user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
