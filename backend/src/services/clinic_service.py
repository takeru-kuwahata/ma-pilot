import httpx
import urllib.parse
from supabase import Client
from typing import Optional
from ..models.clinic import Clinic, ClinicCreate, ClinicUpdate


class ClinicService:
    '''Clinic service'''

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def _geocode_address(self, address: str) -> Optional[tuple[float, float]]:
        '''住所から緯度経度を取得（Community Geocoder）'''
        try:
            encoded = urllib.parse.quote(address)
            url = f'https://geocoder.csis.u-tokyo.ac.jp/cgi-bin/simple_geocode.cgi?charset=UTF-8&addr={encoded}'
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                text = resp.text
                # XMLから緯度経度を抽出
                import re
                lat_match = re.search(r'<latitude>([\d.]+)</latitude>', text)
                lng_match = re.search(r'<longitude>([\d.]+)</longitude>', text)
                if lat_match and lng_match:
                    lat = float(lat_match.group(1))
                    lng = float(lng_match.group(1))
                    # 日本の範囲チェック
                    if 24 <= lat <= 46 and 122 <= lng <= 154:
                        return lat, lng
        except Exception:
            pass
        return None

    async def get_clinic(self, clinic_id: str) -> Clinic:
        '''Get clinic by ID or slug'''
        try:
            # Try UUID format first
            if len(clinic_id) == 36 and '-' in clinic_id:
                response = self.supabase.table('clinics').select('*').eq('id', clinic_id).single().execute()
            else:
                # Assume it's a slug
                response = self.supabase.table('clinics').select('*').eq('slug', clinic_id).single().execute()

            if not response.data:
                raise ValueError('Clinic not found')

            return Clinic(**response.data)

        except Exception as e:
            raise ValueError(f'Failed to get clinic: {str(e)}')

    async def create_clinic(self, clinic_data: ClinicCreate) -> Clinic:
        '''Create new clinic'''
        try:
            data = {k: v for k, v in clinic_data.model_dump().items() if v is not None}
            # 住所からジオコーディングして座標を設定
            if clinic_data.address:
                coords = await self._geocode_address(clinic_data.address)
                if coords:
                    data['latitude'], data['longitude'] = coords
            response = self.supabase.table('clinics').insert(data).execute()

            if not response.data or len(response.data) == 0:
                raise ValueError('Failed to create clinic')

            return Clinic(**response.data[0])

        except Exception as e:
            raise ValueError(f'Failed to create clinic: {str(e)}')

    async def update_clinic(self, clinic_id: str, clinic_data: ClinicUpdate) -> Clinic:
        '''Update clinic'''
        try:
            # Only update non-None fields
            update_data = {k: v for k, v in clinic_data.model_dump().items() if v is not None}

            if not update_data:
                raise ValueError('No data to update')

            # 住所が更新される場合はジオコーディングで座標も更新
            if 'address' in update_data:
                coords = await self._geocode_address(update_data['address'])
                if coords:
                    update_data['latitude'], update_data['longitude'] = coords

            self.supabase.table('clinics').update(update_data).eq('id', clinic_id).execute()

            # 更新後に再取得
            return await self.get_clinic(clinic_id)

        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f'Failed to update clinic: {str(e)}')

    async def activate_clinic(self, clinic_id: str) -> Clinic:
        '''Activate clinic'''
        try:
            self.supabase.table('clinics').update({'is_active': True}).eq('id', clinic_id).execute()
            return await self.get_clinic(clinic_id)
        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f'Failed to activate clinic: {str(e)}')

    async def deactivate_clinic(self, clinic_id: str) -> Clinic:
        '''Deactivate clinic'''
        try:
            self.supabase.table('clinics').update({'is_active': False}).eq('id', clinic_id).execute()
            return await self.get_clinic(clinic_id)
        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f'Failed to deactivate clinic: {str(e)}')

    async def delete_clinic(self, clinic_id: str) -> None:
        '''Delete clinic'''
        try:
            self.supabase.table('clinics').delete().eq('id', clinic_id).execute()
        except Exception as e:
            raise ValueError(f'Failed to delete clinic: {str(e)}')

    async def list_clinics(self, is_active: Optional[bool] = None) -> list[Clinic]:
        '''List all clinics'''
        try:
            query = self.supabase.table('clinics').select('*')

            if is_active is not None:
                query = query.eq('is_active', is_active)

            response = query.execute()

            return [Clinic(**clinic) for clinic in response.data]

        except Exception as e:
            raise ValueError(f'Failed to list clinics: {str(e)}')
