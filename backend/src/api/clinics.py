from fastapi import APIRouter, HTTPException, Depends
from ..models.clinic import Clinic, ClinicCreate, ClinicUpdate, ClinicResponse
from ..services.clinic_service import ClinicService
from ..core.database import get_supabase_client
from supabase import Client

router = APIRouter(prefix='/api/clinics', tags=['Clinics'])


def get_clinic_service(supabase: Client = Depends(get_supabase_client)) -> ClinicService:
    '''Get clinic service dependency'''
    return ClinicService(supabase)


@router.get('/{clinic_id}', response_model=ClinicResponse)
async def get_clinic(
    clinic_id: str,
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Get clinic by ID'''
    try:
        clinic = await clinic_service.get_clinic(clinic_id)
        return ClinicResponse(data=clinic)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put('/{clinic_id}', response_model=ClinicResponse)
async def update_clinic(
    clinic_id: str,
    request: ClinicUpdate,
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Update clinic'''
    try:
        clinic = await clinic_service.update_clinic(clinic_id, request)
        return ClinicResponse(data=clinic, message='Clinic updated successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
