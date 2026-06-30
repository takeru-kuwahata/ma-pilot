from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from pydantic import BaseModel
from typing import Optional
from ..core.database import get_db_client
from ..services.consulting_service import ConsultingService
from ..services.clinic_service import ClinicService
from ..middleware.auth import get_current_user_metadata, UserContext

router = APIRouter(prefix='/api/consulting', tags=['Consulting'])


class ClinicMemoRequest(BaseModel):
    memo: Optional[str] = None


def get_consulting_service(supabase: Client = Depends(get_db_client)) -> ConsultingService:
    return ConsultingService(supabase)


def get_clinic_service(supabase: Client = Depends(get_db_client)) -> ClinicService:
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


@router.get('/{clinic_id}/memo')
async def get_clinic_memo(
    clinic_id: str,
    clinic_service: ClinicService = Depends(get_clinic_service),
    supabase: Client = Depends(get_db_client),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''院長メモ取得'''
    try:
        clinic = await clinic_service.get_clinic(clinic_id)
        if not clinic:
            raise HTTPException(status_code=404, detail='Clinic not found')
        if not user.has_clinic_access(str(clinic.id)):
            raise HTTPException(status_code=403, detail='Access denied')
        res = supabase.table('clinics').select('clinic_memo').eq('id', str(clinic.id)).single().execute()
        return {'memo': res.data.get('clinic_memo') if res.data else None}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/{clinic_id}/memo')
async def update_clinic_memo(
    clinic_id: str,
    request: ClinicMemoRequest,
    clinic_service: ClinicService = Depends(get_clinic_service),
    supabase: Client = Depends(get_db_client),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''院長メモ保存'''
    try:
        clinic = await clinic_service.get_clinic(clinic_id)
        if not clinic:
            raise HTTPException(status_code=404, detail='Clinic not found')
        if not user.has_clinic_access(str(clinic.id)):
            raise HTTPException(status_code=403, detail='Access denied')
        supabase.table('clinics').update({'clinic_memo': request.memo}).eq('id', str(clinic.id)).execute()
        return {'message': 'メモを保存しました', 'memo': request.memo}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
