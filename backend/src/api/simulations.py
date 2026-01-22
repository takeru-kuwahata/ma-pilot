from fastapi import APIRouter, HTTPException, Depends, Query
from ..models.simulation import Simulation, SimulationCreate, SimulationResponse, SimulationListResponse
from ..services.simulation_service import SimulationService
from ..core.database import get_supabase_client
from supabase import Client

router = APIRouter(prefix='/api/simulations', tags=['Simulations'])


def get_simulation_service(supabase: Client = Depends(get_supabase_client)) -> SimulationService:
    '''Get simulation service dependency'''
    return SimulationService(supabase)


@router.post('', response_model=SimulationResponse)
async def create_simulation(
    request: SimulationCreate,
    simulation_service: SimulationService = Depends(get_simulation_service)
):
    '''Create new simulation'''
    try:
        simulation = await simulation_service.create_simulation(request)
        return SimulationResponse(data=simulation, message='Simulation created successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('', response_model=SimulationListResponse)
async def get_simulations(
    clinic_id: str = Query(...),
    simulation_service: SimulationService = Depends(get_simulation_service)
):
    '''Get all simulations for clinic'''
    try:
        simulations = await simulation_service.get_simulations(clinic_id)
        return SimulationListResponse(data=simulations)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/{simulation_id}', response_model=SimulationResponse)
async def get_simulation(
    simulation_id: str,
    simulation_service: SimulationService = Depends(get_simulation_service)
):
    '''Get simulation by ID'''
    try:
        simulation = await simulation_service.get_simulation(simulation_id)
        return SimulationResponse(data=simulation)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
