from fastapi import APIRouter, HTTPException, Depends, Query
from ..models.dashboard import DashboardResponse
from ..services.dashboard_service import DashboardService
from ..services.clinic_service import ClinicService
from ..core.database import get_supabase_client
from ..middleware.auth import get_current_user_metadata, UserContext
from supabase import Client

router = APIRouter(prefix='/api/dashboard', tags=['Dashboard'])


def get_dashboard_service(supabase: Client = Depends(get_supabase_client)) -> DashboardService:
    '''Get dashboard service dependency'''
    return DashboardService(supabase)


def get_clinic_service(supabase: Client = Depends(get_supabase_client)) -> ClinicService:
    '''Get clinic service dependency'''
    return ClinicService(supabase)


@router.get('', response_model=DashboardResponse)
async def get_dashboard(
    clinic_id: str = Query(...),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
    clinic_service: ClinicService = Depends(get_clinic_service),
    user_context: UserContext = Depends(get_current_user_metadata)
):
    '''Get dashboard data for clinic'''
    # clinic_idがスラッグの場合、実際のIDに変換
    try:
        clinic = await clinic_service.get_clinic(clinic_id)
        actual_clinic_id = clinic.id
    except ValueError:
        raise HTTPException(status_code=404, detail='Clinic not found')

    # 権限チェック: system_adminまたは自分の医院のみアクセス可能
    if not user_context.has_clinic_access(actual_clinic_id):
        raise HTTPException(status_code=403, detail='You do not have access to this clinic')

    try:
        data = await dashboard_service.get_dashboard_data(actual_clinic_id)
        return DashboardResponse(data=data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
