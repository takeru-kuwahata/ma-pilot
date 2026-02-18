from fastapi import APIRouter, HTTPException, Depends
from ..models.clinic import Clinic, ClinicCreate, ClinicResponse
from ..services.clinic_service import ClinicService
from ..core.database import get_supabase_client
from ..middleware.auth import get_current_user
from supabase import Client
from typing import List, Dict, Any
from pydantic import BaseModel
import httpx
import xml.etree.ElementTree as ET
import os


class CreateOperatorRequest(BaseModel):
    email: str
    password: str
    display_name: str

router = APIRouter(prefix='/api/admin', tags=['Admin'])


def get_clinic_service(supabase: Client = Depends(get_supabase_client)) -> ClinicService:
    '''Get clinic service dependency'''
    return ClinicService(supabase)


@router.get('/dashboard')
async def get_admin_dashboard(
    supabase: Client = Depends(get_supabase_client)
):
    '''Get admin dashboard data'''
    try:
        # Get all clinics
        clinics_response = supabase.table('clinics').select('*').execute()
        total_clinics = len(clinics_response.data)
        active_clinics = len([c for c in clinics_response.data if c.get('is_active', False)])

        # Get all users
        users_response = supabase.table('user_metadata').select('*').execute()
        total_users = len(users_response.data)

        # Get recent monthly data
        monthly_data_response = supabase.table('monthly_data').select('*').order('created_at', desc=True).limit(10).execute()

        return {
            'total_clinics': total_clinics,
            'active_clinics': active_clinics,
            'total_users': total_users,
            'recent_data_entries': len(monthly_data_response.data)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/clinics', response_model=List[Clinic])
async def get_all_clinics(
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Get all clinics'''
    try:
        clinics = await clinic_service.list_clinics()
        return clinics
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/clinics', response_model=ClinicResponse)
async def create_clinic(
    request: ClinicCreate,
    clinic_service: ClinicService = Depends(get_clinic_service),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    '''Create new clinic'''
    try:
        # owner_idが未指定の場合はリクエスト者のIDを使用
        if not request.owner_id:
            request.owner_id = str(current_user.id)
        clinic = await clinic_service.create_clinic(request)
        return ClinicResponse(data=clinic, message='Clinic created successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete('/clinics/{clinic_id}')
async def delete_clinic(
    clinic_id: str,
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Delete clinic'''
    try:
        await clinic_service.delete_clinic(clinic_id)
        return {'message': 'Clinic deleted successfully'}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/clinics/{clinic_id}/activate', response_model=ClinicResponse)
async def activate_clinic(
    clinic_id: str,
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Activate clinic'''
    try:
        clinic = await clinic_service.activate_clinic(clinic_id)
        return ClinicResponse(data=clinic, message='Clinic activated successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/clinics/{clinic_id}/deactivate', response_model=ClinicResponse)
async def deactivate_clinic(
    clinic_id: str,
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Deactivate clinic'''
    try:
        clinic = await clinic_service.deactivate_clinic(clinic_id)
        return ClinicResponse(data=clinic, message='Clinic deactivated successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/operators')
async def get_operators(supabase: Client = Depends(get_supabase_client)):
    '''Get all system_admin operators'''
    try:
        response = supabase.table('user_metadata').select('*').eq('role', 'system_admin').execute()
        operators = []
        supabase_url = os.environ.get('SUPABASE_URL', '')
        supabase_key = os.environ.get('SUPABASE_KEY', '')
        for metadata in response.data:
            try:
                # REST APIで直接ユーザー情報を取得
                user_url = f"{supabase_url}/auth/v1/admin/users/{metadata['user_id']}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    user_res = await client.get(
                        user_url,
                        headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
                    )
                if user_res.status_code == 200:
                    user_data = user_res.json()
                    auth_user_meta = user_data.get('user_metadata') or {}
                    display_name = auth_user_meta.get('display_name', '')
                    operators.append({
                        'id': metadata['user_id'],
                        'email': user_data.get('email', ''),
                        'display_name': display_name,
                        'created_at': metadata.get('created_at', ''),
                    })
            except Exception:
                pass
        return operators
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/operators')
async def create_operator(
    request: CreateOperatorRequest,
    supabase: Client = Depends(get_supabase_client)
):
    '''Create a new system_admin operator'''
    try:
        supabase_url = os.environ.get('SUPABASE_URL', '')
        supabase_key = os.environ.get('SUPABASE_KEY', '')

        # REST APIでユーザー作成
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"{supabase_url}/auth/v1/admin/users",
                headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}", "Content-Type": "application/json"},
                json={"email": request.email, "password": request.password, "email_confirm": True, "user_metadata": {"display_name": request.display_name}}
            )
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail=res.json())
        user_id = res.json()["id"]

        # user_metadataテーブルにsystem_adminロールで登録
        supabase.table('user_metadata').insert({
            'user_id': user_id,
            'role': 'system_admin',
        }).execute()

        return {
            'id': user_id,
            'email': request.email,
            'display_name': request.display_name,
            'message': 'Operator created successfully',
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete('/operators/{user_id}')
async def delete_operator(
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    '''Delete an operator'''
    try:
        supabase_url = os.environ.get('SUPABASE_URL', '')
        supabase_key = os.environ.get('SUPABASE_KEY', '')

        supabase.table('user_metadata').delete().eq('user_id', user_id).execute()

        # REST APIでAuth userを削除
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.delete(
                f"{supabase_url}/auth/v1/admin/users/{user_id}",
                headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
            )
        return {'message': 'Operator deleted successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/settings')
async def get_admin_settings():
    '''Get admin settings'''
    # Placeholder for system settings
    return {
        'settings': {
            'maintenance_mode': False,
            'max_clinics': 100,
            'data_retention_days': 365
        }
    }


@router.put('/settings')
async def update_admin_settings(settings: Dict[str, Any]):
    '''Update admin settings'''
    # Placeholder for updating system settings
    return {
        'message': 'Settings updated successfully',
        'settings': settings
    }


@router.get('/geocode')
async def geocode_address(address: str):
    '''住所から緯度経度を取得（Community Geocoder経由）'''
    try:
        url = f'https://geocoder.csis.u-tokyo.ac.jp/cgi-bin/geocode.cgi?charset=UTF8&addr={address}'
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
        root = ET.fromstring(response.text)
        lat = root.findtext('.//latitude')
        lng = root.findtext('.//longitude')
        if lat and lng and float(lat) != 0:
            return {'latitude': float(lat), 'longitude': float(lng)}
        return {'latitude': 35.6762, 'longitude': 139.6503}
    except Exception:
        return {'latitude': 35.6762, 'longitude': 139.6503}
