from fastapi import APIRouter, HTTPException, Depends
from ..models.clinic import Clinic, ClinicCreate, ClinicUpdate, ClinicResponse
from ..services.clinic_service import ClinicService
from ..core.database import get_supabase_client
from ..middleware.auth import get_current_user_metadata, UserContext
from supabase import Client

router = APIRouter(prefix='/api/clinics', tags=['Clinics'])


def get_clinic_service(supabase: Client = Depends(get_supabase_client)) -> ClinicService:
    '''Get clinic service dependency'''
    return ClinicService(supabase)


@router.get('/{clinic_id}', response_model=ClinicResponse)
async def get_clinic(
    clinic_id: str,
    clinic_service: ClinicService = Depends(get_clinic_service),
    user_context: UserContext = Depends(get_current_user_metadata)
):
    '''Get clinic by ID or slug'''
    try:
        # First fetch clinic (handles both UUID and slug)
        clinic = await clinic_service.get_clinic(clinic_id)

        # Then check permission using actual UUID
        if not user_context.has_clinic_access(clinic.id):
            raise HTTPException(status_code=403, detail='You do not have access to this clinic')

        return ClinicResponse(data=clinic)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put('/{clinic_id}', response_model=ClinicResponse)
async def update_clinic(
    clinic_id: str,
    request: ClinicUpdate,
    clinic_service: ClinicService = Depends(get_clinic_service),
    user_context: UserContext = Depends(get_current_user_metadata)
):
    '''Update clinic'''
    try:
        # First fetch clinic to get UUID (handles both UUID and slug)
        clinic = await clinic_service.get_clinic(clinic_id)

        # Then check permission using actual UUID
        if not user_context.can_edit_clinic_data(clinic.id):
            raise HTTPException(status_code=403, detail='You do not have permission to edit this clinic')

        # Update using actual UUID
        updated_clinic = await clinic_service.update_clinic(clinic.id, request)
        return ClinicResponse(data=updated_clinic, message='Clinic updated successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
