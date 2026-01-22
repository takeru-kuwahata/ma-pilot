from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class SimulationInput(BaseModel):
    '''Simulation input parameters'''
    target_revenue: float
    target_profit: float
    assumed_average_revenue_per_patient: float
    assumed_personnel_cost_rate: float
    assumed_material_cost_rate: float
    assumed_fixed_cost: float


class SimulationResult(BaseModel):
    '''Simulation result'''
    required_patients: int
    required_treatments: int
    estimated_revenue: float
    estimated_profit: float
    profit_margin: float
    strategies: List[str]


class Simulation(BaseModel):
    '''Simulation model'''
    id: str
    clinic_id: str
    title: str
    input: SimulationInput
    result: SimulationResult
    created_at: datetime
    updated_at: datetime


class SimulationCreate(BaseModel):
    '''Create simulation request'''
    clinic_id: str
    title: str
    input: SimulationInput


class SimulationResponse(BaseModel):
    '''Simulation response'''
    data: Simulation
    message: Optional[str] = None


class SimulationListResponse(BaseModel):
    '''Simulation list response'''
    data: List[Simulation]
    message: Optional[str] = None
