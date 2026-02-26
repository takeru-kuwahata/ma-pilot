from fastapi import APIRouter, HTTPException, Depends
from ..models.market_analysis import MarketAnalysis, MarketAnalysisCreate, MarketAnalysisResponse
from ..services.market_analysis_service import MarketAnalysisService
from ..services.clinic_service import ClinicService
from ..core.database import get_supabase_client
from supabase import Client

router = APIRouter(prefix='/api/market-analysis', tags=['Market Analysis'])


def get_market_analysis_service(supabase: Client = Depends(get_supabase_client)) -> MarketAnalysisService:
    '''Get market analysis service dependency'''
    return MarketAnalysisService(supabase)


def get_clinic_service(supabase: Client = Depends(get_supabase_client)) -> ClinicService:
    '''Get clinic service dependency'''
    return ClinicService(supabase)


@router.get('/{clinic_id}', response_model=MarketAnalysisResponse)
async def get_market_analysis(
    clinic_id: str,
    market_analysis_service: MarketAnalysisService = Depends(get_market_analysis_service),
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Get latest market analysis for clinic'''
    # clinic_idがスラッグの場合、実際のIDに変換
    try:
        clinic = await clinic_service.get_clinic(clinic_id)
        actual_clinic_id = clinic.id
    except ValueError:
        raise HTTPException(status_code=404, detail='Clinic not found')

    try:
        analysis = await market_analysis_service.get_market_analysis(actual_clinic_id)
        return MarketAnalysisResponse(data=analysis)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post('', response_model=MarketAnalysisResponse)
async def create_market_analysis(
    request: MarketAnalysisCreate,
    market_analysis_service: MarketAnalysisService = Depends(get_market_analysis_service),
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Create new market analysis'''
    # clinic_idがスラッグの場合、実際のIDに変換
    try:
        clinic = await clinic_service.get_clinic(request.clinic_id)
        actual_clinic_id = clinic.id
    except ValueError:
        raise HTTPException(status_code=404, detail='Clinic not found')

    try:
        # リクエストのclinic_idを実際のUUIDに置き換え
        request.clinic_id = actual_clinic_id
        analysis = await market_analysis_service.create_market_analysis(request)
        return MarketAnalysisResponse(data=analysis, message='Market analysis created successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
