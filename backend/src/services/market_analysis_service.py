from supabase import Client
from ..models.market_analysis import MarketAnalysis, MarketAnalysisCreate, PopulationData, AgeGroups, CompetitorClinic
from datetime import datetime
import random


class MarketAnalysisService:
    '''Market analysis service'''

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_market_analysis(self, request: MarketAnalysisCreate) -> MarketAnalysis:
        '''Create new market analysis'''
        try:
            # Get clinic info
            clinic = self.supabase.table('clinics').select('*').eq('id', request.clinic_id).single().execute()

            if not clinic.data:
                raise ValueError('Clinic not found')

            clinic_data = clinic.data

            # TODO: Implement actual API calls to e-Stat and Google Maps
            # For now, generate mock data

            # Mock population data
            total_population = random.randint(50000, 100000)
            population_data = PopulationData(
                area=f'Within {request.radius_km}km radius',
                total_population=total_population,
                age_groups=AgeGroups(
                    age0_14=int(total_population * 0.13),
                    age15_64=int(total_population * 0.60),
                    age65Plus=int(total_population * 0.27)
                )
            )

            # Mock competitors
            competitors = [
                CompetitorClinic(
                    name=f'Competitor Clinic {i}',
                    address=f'Address {i}',
                    latitude=clinic_data['latitude'] + random.uniform(-0.03, 0.03),
                    longitude=clinic_data['longitude'] + random.uniform(-0.03, 0.03),
                    distance=random.uniform(0.5, request.radius_km)
                )
                for i in range(1, random.randint(3, 8))
            ]

            # Calculate estimated potential patients
            # Assume 5% of population visits dentist annually, divided by number of clinics
            num_clinics = len(competitors) + 1  # Including this clinic
            estimated_potential_patients = int((total_population * 0.05) / num_clinics / 12)  # Monthly

            # Calculate market share
            market_share = 100.0 / num_clinics

            # Prepare data for database
            analysis_data = {
                'clinic_id': request.clinic_id,
                'radius_km': request.radius_km,
                'population_data': population_data.model_dump(),
                'competitors': [c.model_dump() for c in competitors],
                'estimated_potential_patients': estimated_potential_patients,
                'market_share': market_share,
                'analysis_date': datetime.now().isoformat()
            }

            response = self.supabase.table('market_analyses').insert(analysis_data).execute()

            if not response.data or len(response.data) == 0:
                raise ValueError('Failed to create market analysis')

            # Parse result
            db_data = response.data[0]
            return MarketAnalysis(
                id=db_data['id'],
                clinic_id=db_data['clinic_id'],
                radius_km=db_data['radius_km'],
                population_data=PopulationData(**db_data['population_data']),
                competitors=[CompetitorClinic(**c) for c in db_data['competitors']],
                estimated_potential_patients=db_data['estimated_potential_patients'],
                market_share=db_data['market_share'],
                analysis_date=db_data['analysis_date'],
                created_at=db_data['created_at'],
                updated_at=db_data['updated_at']
            )

        except Exception as e:
            raise ValueError(f'Failed to create market analysis: {str(e)}')

    async def get_market_analysis(self, clinic_id: str) -> MarketAnalysis:
        '''Get latest market analysis for clinic'''
        try:
            response = self.supabase.table('market_analyses').select('*').eq('clinic_id', clinic_id).order('created_at', desc=True).limit(1).execute()

            if not response.data or len(response.data) == 0:
                raise ValueError('Market analysis not found')

            data = response.data[0]
            return MarketAnalysis(
                id=data['id'],
                clinic_id=data['clinic_id'],
                radius_km=data['radius_km'],
                population_data=PopulationData(**data['population_data']),
                competitors=[CompetitorClinic(**c) for c in data['competitors']],
                estimated_potential_patients=data['estimated_potential_patients'],
                market_share=data['market_share'],
                analysis_date=data['analysis_date'],
                created_at=data['created_at'],
                updated_at=data['updated_at']
            )

        except Exception as e:
            raise ValueError(f'Failed to get market analysis: {str(e)}')
