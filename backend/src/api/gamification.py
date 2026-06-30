from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from ..core.database import get_db_client, get_service_role_client
from ..services.gamification_service import GamificationService
from ..services.clinic_service import ClinicService
from ..middleware.auth import get_current_user_metadata, UserContext
from pydantic import BaseModel

router = APIRouter(prefix='/api/gamification', tags=['Gamification'])


class UpdateCharacterRequest(BaseModel):
    character_type: str  # advanbi / assistant / doctor


def get_gamification_service(supabase: Client = Depends(get_service_role_client)) -> GamificationService:
    return GamificationService(supabase)


def get_clinic_service(supabase: Client = Depends(get_db_client)) -> ClinicService:
    return ClinicService(supabase)


@router.get('/{clinic_id}')
async def get_gamification(
    clinic_id: str,
    gamification_service: GamificationService = Depends(get_gamification_service),
    clinic_service: ClinicService = Depends(get_clinic_service),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''ゲーミフィケーションデータ取得（ランク・パラメーター・節目・キャラクターメッセージ）'''
    try:
        clinic = await clinic_service.get_clinic(clinic_id)
        if not clinic:
            raise HTTPException(status_code=404, detail='Clinic not found')
        if not user.has_clinic_access(str(clinic.id)):
            raise HTTPException(status_code=403, detail='Access denied')
        data = await gamification_service.get_gamification_data(str(clinic.id))
        return {'data': data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/{clinic_id}/character')
async def update_character(
    clinic_id: str,
    request: UpdateCharacterRequest,
    supabase: Client = Depends(get_service_role_client),
    clinic_service: ClinicService = Depends(get_clinic_service),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''キャラクター選択変更'''
    valid = ['advanbi', 'assistant', 'doctor']
    if request.character_type not in valid:
        raise HTTPException(status_code=400, detail=f'character_type は {valid} のいずれかを指定してください')
    try:
        clinic = await clinic_service.get_clinic(clinic_id)
        if not clinic:
            raise HTTPException(status_code=404, detail='Clinic not found')
        if not user.has_clinic_access(str(clinic.id)):
            raise HTTPException(status_code=403, detail='Access denied')
        supabase.table('clinic_gamification') \
            .update({'character_type': request.character_type}) \
            .eq('clinic_id', str(clinic.id)) \
            .execute()
        return {'message': 'キャラクターを更新しました', 'character_type': request.character_type}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
