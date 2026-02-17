from fastapi import APIRouter, HTTPException, Depends
from ..models.clinic import Clinic, ClinicCreate, ClinicResponse
from ..services.clinic_service import ClinicService
from ..core.database import get_supabase_client
from ..middleware.auth import get_current_user
from supabase import Client
from typing import List, Dict, Any
import httpx
import xml.etree.ElementTree as ET

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
