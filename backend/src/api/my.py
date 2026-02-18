from fastapi import APIRouter, HTTPException, Depends
from ..core.database import get_supabase_client
from ..middleware.auth import get_current_user
from supabase import Client
from pydantic import BaseModel
from typing import Dict, Any
import httpx
import os


class UpdateDisplayNameRequest(BaseModel):
    display_name: str


class UpdatePasswordRequest(BaseModel):
    new_password: str


router = APIRouter(prefix='/api/my', tags=['My'])


@router.put('/display-name')
async def update_display_name(
    request: UpdateDisplayNameRequest,
    supabase: Client = Depends(get_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    '''Update current user display name'''
    try:
        supabase_url = os.environ.get('SUPABASE_URL', '')
        supabase_key = os.environ.get('SUPABASE_KEY', '')
        user_id = str(current_user.id)

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.put(
                f"{supabase_url}/auth/v1/admin/users/{user_id}",
                headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"},
                json={"user_metadata": {"display_name": request.display_name}}
            )
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail=res.json())
        return {'message': 'Display name updated successfully', 'display_name': request.display_name}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/password')
async def update_password(
    request: UpdatePasswordRequest,
    supabase: Client = Depends(get_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    '''Update current user password'''
    try:
        if len(request.new_password) < 6:
            raise HTTPException(status_code=400, detail='Password must be at least 6 characters')

        supabase_url = os.environ.get('SUPABASE_URL', '')
        supabase_key = os.environ.get('SUPABASE_KEY', '')
        user_id = str(current_user.id)

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.put(
                f"{supabase_url}/auth/v1/admin/users/{user_id}",
                headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"},
                json={"password": request.new_password}
            )
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail=res.json())
        return {'message': 'Password updated successfully'}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
