from fastapi import APIRouter, HTTPException, Depends
from ..models.market_analysis import MarketAnalysis, MarketAnalysisCreate, MarketAnalysisResponse
from ..services.market_analysis_service import MarketAnalysisService
from ..core.database import get_supabase_client
from supabase import Client

router = APIRouter(prefix='/api/market-analysis', tags=['Market Analysis'])


def get_market_analysis_service(supabase: Client = Depends(get_supabase_client)) -> MarketAnalysisService:
    '''Get market analysis service dependency'''
    return MarketAnalysisService(supabase)


@router.get('/{clinic_id}', response_model=MarketAnalysisResponse)
async def get_market_analysis(
    clinic_id: str,
    market_analysis_service: MarketAnalysisService = Depends(get_market_analysis_service)
):
    '''Get latest market analysis for clinic'''
    try:
        analysis = await market_analysis_service.get_market_analysis(clinic_id)
        return MarketAnalysisResponse(data=analysis)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post('', response_model=MarketAnalysisResponse)
async def create_market_analysis(
    request: MarketAnalysisCreate,
    market_analysis_service: MarketAnalysisService = Depends(get_market_analysis_service)
):
    '''Create new market analysis'''
    try:
        analysis = await market_analysis_service.create_market_analysis(request)
        return MarketAnalysisResponse(data=analysis, message='Market analysis created successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
