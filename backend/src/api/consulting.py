from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from ..core.database import get_supabase_client
from ..services.consulting_service import ConsultingService
from ..services.clinic_service import ClinicService
from ..middleware.auth import get_current_user_metadata, UserContext

router = APIRouter(prefix='/api/consulting', tags=['Consulting'])


def get_consulting_service(supabase: Client = Depends(get_supabase_client)) -> ConsultingService:
    return ConsultingService(supabase)


def get_clinic_service(supabase: Client = Depends(get_supabase_client)) -> ClinicService:
    return ClinicService(supabase)


@router.get('/{clinic_id}')
async def get_consulting_report(
    clinic_id: str,
    consulting_service: ConsultingService = Depends(get_consulting_service),
    clinic_service: ClinicService = Depends(get_clinic_service),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''経営健診レポート取得（スコアリング＋診断パターン＋提案＋レコメンド）'''
    try:
        clinic = await clinic_service.get_clinic(clinic_id)
        if not clinic:
            raise HTTPException(status_code=404, detail='Clinic not found')
        if not user.has_clinic_access(str(clinic.id)):
            raise HTTPException(status_code=403, detail='Access denied')
        report = await consulting_service.get_consulting_report(str(clinic.id))
        return {'data': report}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
