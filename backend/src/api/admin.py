from fastapi import APIRouter, HTTPException, Depends
from ..models.clinic import Clinic, ClinicCreate, ClinicResponse
from ..services.clinic_service import ClinicService
from ..core.database import get_supabase_client
from supabase import Client
from typing import List, Dict, Any
from pydantic import BaseModel
import httpx
import xml.etree.ElementTree as ET
import os
import re
import urllib.parse


class CreateOperatorRequest(BaseModel):
    email: str
    password: str
    display_name: str


class OpenhouseStatusRequest(BaseModel):
    openhouse_status: str  # 'none' | 'scheduled' | 'completed'


class UpdatePasswordRequest(BaseModel):
    new_password: str


class ImportWordPressUsersRequest(BaseModel):
    users: List[Dict[str, Any]]  # [{email, display_name, clinic_name, password}, ...]

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
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Create new clinic'''
    try:
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
async def get_admin_settings(supabase: Client = Depends(get_supabase_client)):
    '''Get admin settings'''
    try:
        response = supabase.table('system_settings').select('*').execute()
        settings = {row['key']: row['value'] for row in response.data}
        return {'settings': settings}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/settings')
async def update_admin_settings(
    settings: Dict[str, str],
    supabase: Client = Depends(get_supabase_client)
):
    '''Update admin settings'''
    try:
        for key, value in settings.items():
            # Upsert (INSERT or UPDATE)
            supabase.table('system_settings').upsert({
                'key': key,
                'value': value
            }).execute()
        return {'message': 'Settings updated successfully', 'settings': settings}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/wp-connectivity-test')
async def wp_connectivity_test():
    '''Render.comからWordPress REST APIへの疎通確認（一時的なテスト用）'''
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(
                'https://si-college.net/wp-json/wp/v2/users/me',
                auth=('admin_ma', '1f2i Ikpb ACjK 2zz6 JMvn VLUI'),
            )
        return {
            'status_code': res.status_code,
            'reachable': res.status_code == 200,
            'response_preview': res.text[:200],
        }
    except Exception as e:
        return {'reachable': False, 'error': str(e)}


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


@router.put('/clinics/{clinic_id}/password')
async def update_clinic_password(
    clinic_id: str,
    request: UpdatePasswordRequest,
    supabase: Client = Depends(get_supabase_client)
):
    '''医院アカウントのパスワードを運営者が変更する'''
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail='パスワードは8文字以上で入力してください')
    try:
        # clinicsテーブルからowner_idを取得
        clinic_res = supabase.table('clinics').select('owner_id').eq('id', clinic_id).single().execute()
        if not clinic_res.data:
            raise HTTPException(status_code=404, detail='Clinic not found')
        owner_id = clinic_res.data['owner_id']

        supabase_url = os.environ.get('SUPABASE_URL', '')
        supabase_key = os.environ.get('SUPABASE_KEY', '')

        # Supabase Auth Admin APIでパスワード更新
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.put(
                f'{supabase_url}/auth/v1/admin/users/{owner_id}',
                headers={
                    'apikey': supabase_key,
                    'Authorization': f'Bearer {supabase_key}',
                    'Content-Type': 'application/json',
                },
                json={'password': request.new_password},
            )
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail=res.json())
        return {'message': 'パスワードを更新しました'}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/clinics/{clinic_id}/openhouse-status')
async def update_openhouse_status(
    clinic_id: str,
    request: OpenhouseStatusRequest,
    supabase: Client = Depends(get_supabase_client)
):
    '''内覧会ステータスを更新'''
    valid_statuses = ('none', 'scheduled', 'completed')
    if request.openhouse_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f'openhouse_status は {valid_statuses} のいずれかを指定してください')
    try:
        result = supabase.table('clinics').update(
            {'openhouse_status': request.openhouse_status}
        ).eq('id', clinic_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail='Clinic not found')
        return {'message': 'openhouse_status updated', 'data': result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/import-wordpress-users')
async def import_wordpress_users(
    request: ImportWordPressUsersRequest,
    supabase: Client = Depends(get_supabase_client)
):
    '''WordPressユーザーをMA-PilotにCSV一括インポート'''
    supabase_url = os.environ.get('SUPABASE_URL', '')
    supabase_key = os.environ.get('SUPABASE_KEY', '')
    success_count = 0
    failed_list: List[Dict[str, Any]] = []

    for user in request.users:
        email = user.get('email', '').strip()
        display_name = user.get('display_name', '').strip()
        clinic_name = user.get('clinic_name', '').strip()
        password = user.get('password', '').strip()

        if not email or not clinic_name:
            failed_list.append({'email': email, 'reason': 'emailまたはclinic_nameが空です'})
            continue

        try:
            # Supabase Authにユーザー作成
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f'{supabase_url}/auth/v1/admin/users',
                    headers={
                        'apikey': supabase_key,
                        'Authorization': f'Bearer {supabase_key}',
                        'Content-Type': 'application/json',
                    },
                    json={
                        'email': email,
                        'password': password if password else None,
                        'email_confirm': True,
                        'user_metadata': {'display_name': display_name or clinic_name},
                    },
                )

            if res.status_code not in (200, 201):
                error_detail = res.json().get('msg', res.text)
                failed_list.append({'email': email, 'reason': error_detail})
                continue

            user_id = res.json()['id']

            # clinicsテーブルに医院情報を作成（住所からジオコーディング）
            address_str = user.get('address', '')
            lat, lng = 35.6762, 139.6503
            if address_str:
                try:
                    encoded = urllib.parse.quote(address_str)
                    geo_url = f'https://geocoder.csis.u-tokyo.ac.jp/cgi-bin/simple_geocode.cgi?charset=UTF-8&addr={encoded}'
                    async with httpx.AsyncClient(timeout=10.0) as geo_client:
                        geo_resp = await geo_client.get(geo_url)
                    lat_m = re.search(r'<latitude>([\d.]+)</latitude>', geo_resp.text)
                    lng_m = re.search(r'<longitude>([\d.]+)</longitude>', geo_resp.text)
                    if lat_m and lng_m:
                        _lat, _lng = float(lat_m.group(1)), float(lng_m.group(1))
                        if 24 <= _lat <= 46 and 122 <= _lng <= 154:
                            lat, lng = _lat, _lng
                except Exception:
                    pass

            clinic_res = supabase.table('clinics').insert({
                'name': clinic_name,
                'postal_code': user.get('postal_code', ''),
                'address': address_str,
                'phone_number': user.get('phone_number', ''),
                'owner_id': user_id,
                'is_active': True,
                'latitude': lat,
                'longitude': lng,
                'openhouse_status': user.get('openhouse_status', 'none'),
            }).execute()

            clinic_id = clinic_res.data[0]['id'] if clinic_res.data else None

            # user_metadataテーブルにclinic_ownerロールで登録
            supabase.table('user_metadata').insert({
                'user_id': user_id,
                'role': 'clinic_owner',
                'clinic_id': clinic_id,
            }).execute()

            success_count += 1

        except Exception as e:
            failed_list.append({'email': email, 'reason': str(e)})

    return {
        'success_count': success_count,
        'failed_count': len(failed_list),
        'failed_list': failed_list,
    }
