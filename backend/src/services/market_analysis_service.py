from supabase import Client
from ..models.market_analysis import MarketAnalysis, MarketAnalysisCreate, PopulationData, AgeGroups, CompetitorClinic
from datetime import datetime
import random
import os
import httpx
from typing import List
import math


class MarketAnalysisService:
    '''Market analysis service'''

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.google_maps_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        self.e_stat_api_key = os.getenv('E_STAT_API_KEY')
        self.resas_api_key = os.getenv('RESAS_API_KEY')

    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        '''Calculate distance between two points using Haversine formula (returns km)'''
        R = 6371  # Earth radius in kilometers

        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return R * c

    async def _fetch_competitors_from_google_places(
        self, latitude: float, longitude: float, radius_km: float
    ) -> List[CompetitorClinic]:
        '''Fetch competitor clinics from Google Places API'''
        if not self.google_maps_api_key:
            return self._generate_mock_competitors(latitude, longitude, radius_km)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
                params = {
                    'location': f'{latitude},{longitude}',
                    'radius': int(radius_km * 1000),  # Convert to meters
                    'type': 'dentist',
                    'keyword': '歯科',
                    'key': self.google_maps_api_key
                }

                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                if data.get('status') != 'OK':
                    raise ValueError(f"Google Places API error: {data.get('status')}")

                competitors = []
                for place in data.get('results', []):
                    place_lat = place['geometry']['location']['lat']
                    place_lng = place['geometry']['location']['lng']
                    distance = self._calculate_distance(latitude, longitude, place_lat, place_lng)

                    if distance > 0 and distance <= radius_km:  # Exclude current clinic (distance=0)
                        competitors.append(CompetitorClinic(
                            name=place.get('name', 'Unknown'),
                            address=place.get('vicinity', ''),
                            latitude=place_lat,
                            longitude=place_lng,
                            distance=round(distance, 2)
                        ))

                return sorted(competitors, key=lambda x: x.distance)

        except Exception as e:
            print(f'Error fetching from Google Places API: {str(e)}')
            return self._generate_mock_competitors(latitude, longitude, radius_km)

    def _generate_mock_competitors(
        self, latitude: float, longitude: float, radius_km: float
    ) -> List[CompetitorClinic]:
        '''Generate mock competitor data when API key is not available'''
        competitors = [
            CompetitorClinic(
                name=f'Competitor Clinic {i}',
                address=f'Address {i}',
                latitude=latitude + random.uniform(-0.03, 0.03),
                longitude=longitude + random.uniform(-0.03, 0.03),
                distance=random.uniform(0.5, radius_km)
            )
            for i in range(1, random.randint(3, 8))
        ]
        return sorted(competitors, key=lambda x: x.distance)

    async def _fetch_population_data_from_estat(
        self, latitude: float, longitude: float, radius_km: float
    ) -> PopulationData:
        '''Fetch population data from e-Stat API'''
        if not self.e_stat_api_key:
            return self._generate_mock_population_data(radius_km)

        try:
            # TODO: Implement actual e-Stat API call
            # e-Stat API requires complex queries with statistical code and area code
            # For MVP, return mock data
            return self._generate_mock_population_data(radius_km)

        except Exception as e:
            print(f'Error fetching from e-Stat API: {str(e)}')
            return self._generate_mock_population_data(radius_km)

    def _generate_mock_population_data(self, radius_km: float) -> PopulationData:
        '''Generate mock population data'''
        total_population = random.randint(50000, 100000)
        return PopulationData(
            area=f'Within {radius_km}km radius',
            total_population=total_population,
            age_groups=AgeGroups(
                age0_14=int(total_population * 0.13),
                age15_64=int(total_population * 0.60),
                age65Plus=int(total_population * 0.27)
            )
        )

    async def create_market_analysis(self, request: MarketAnalysisCreate) -> MarketAnalysis:
        '''Create new market analysis'''
        try:
            # Get clinic info
            clinic = self.supabase.table('clinics').select('*').eq('id', request.clinic_id).single().execute()

            if not clinic.data:
                raise ValueError('Clinic not found')

            clinic_data = clinic.data

            # Fetch population data from e-Stat API (or mock if not available)
            population_data = await self._fetch_population_data_from_estat(
                clinic_data['latitude'],
                clinic_data['longitude'],
                request.radius_km
            )

            # Fetch competitors from Google Places API
            competitors = await self._fetch_competitors_from_google_places(
                clinic_data['latitude'],
                clinic_data['longitude'],
                request.radius_km
            )

            # Calculate estimated potential patients
            # Assume 5% of population visits dentist annually, divided by number of clinics
            num_clinics = len(competitors) + 1  # Including this clinic
            total_population = population_data.total_population
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
