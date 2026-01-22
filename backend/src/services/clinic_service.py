from supabase import Client
from typing import Optional
from ..models.clinic import Clinic, ClinicCreate, ClinicUpdate


class ClinicService:
    '''Clinic service'''

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def get_clinic(self, clinic_id: str) -> Clinic:
        '''Get clinic by ID'''
        try:
            response = self.supabase.table('clinics').select('*').eq('id', clinic_id).single().execute()

            if not response.data:
                raise ValueError('Clinic not found')

            return Clinic(**response.data)

        except Exception as e:
            raise ValueError(f'Failed to get clinic: {str(e)}')

    async def create_clinic(self, clinic_data: ClinicCreate) -> Clinic:
        '''Create new clinic'''
        try:
            response = self.supabase.table('clinics').insert(clinic_data.model_dump()).execute()

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

            response = self.supabase.table('clinics').update(update_data).eq('id', clinic_id).execute()

            if not response.data or len(response.data) == 0:
                raise ValueError('Clinic not found')

            return Clinic(**response.data[0])

        except Exception as e:
            raise ValueError(f'Failed to update clinic: {str(e)}')

    async def activate_clinic(self, clinic_id: str) -> Clinic:
        '''Activate clinic'''
        try:
            response = self.supabase.table('clinics').update({'is_active': True}).eq('id', clinic_id).execute()

            if not response.data or len(response.data) == 0:
                raise ValueError('Clinic not found')

            return Clinic(**response.data[0])

        except Exception as e:
            raise ValueError(f'Failed to activate clinic: {str(e)}')

    async def deactivate_clinic(self, clinic_id: str) -> Clinic:
        '''Deactivate clinic'''
        try:
            response = self.supabase.table('clinics').update({'is_active': False}).eq('id', clinic_id).execute()

            if not response.data or len(response.data) == 0:
                raise ValueError('Clinic not found')

            return Clinic(**response.data[0])

        except Exception as e:
            raise ValueError(f'Failed to deactivate clinic: {str(e)}')

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
