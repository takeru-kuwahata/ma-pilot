from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class AgeGroups(BaseModel):
    '''Age group distribution'''
    age0_14: int
    age15_64: int
    age65Plus: int


class PopulationData(BaseModel):
    '''Population data'''
    area: str
    total_population: int
    age_groups: AgeGroups


class CompetitorClinic(BaseModel):
    '''Competitor clinic information'''
    name: str
    address: str
    latitude: float
    longitude: float
    distance: float  # km


class MarketAnalysis(BaseModel):
    '''Market analysis model'''
    id: str
    clinic_id: str
    radius_km: float
    population_data: PopulationData
    competitors: List[CompetitorClinic]
    estimated_potential_patients: int
    market_share: float
    analysis_date: datetime
    created_at: datetime
    updated_at: datetime


class MarketAnalysisCreate(BaseModel):
    '''Create market analysis request'''
    clinic_id: str
    radius_km: float = 3.0


class MarketAnalysisResponse(BaseModel):
    '''Market analysis response'''
    data: MarketAnalysis
    message: Optional[str] = None
