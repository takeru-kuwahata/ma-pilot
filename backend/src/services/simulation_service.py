from supabase import Client
from typing import List
from ..models.simulation import Simulation, SimulationCreate, SimulationInput, SimulationResult
import math


class SimulationService:
    '''Simulation service'''

    def __init__(self, supabase: Client):
        self.supabase = supabase

    def _calculate_simulation(self, input_data: SimulationInput) -> SimulationResult:
        '''Calculate simulation result'''

        # Extract input parameters
        target_revenue = input_data.target_revenue
        target_profit = input_data.target_profit
        avg_revenue_per_patient = input_data.assumed_average_revenue_per_patient
        personnel_cost_rate = input_data.assumed_personnel_cost_rate / 100  # Convert to decimal
        material_cost_rate = input_data.assumed_material_cost_rate / 100  # Convert to decimal
        fixed_cost = input_data.assumed_fixed_cost

        # Calculate required patients to achieve target revenue
        required_patients = math.ceil(target_revenue / avg_revenue_per_patient)

        # Estimate costs
        estimated_personnel_cost = target_revenue * personnel_cost_rate
        estimated_material_cost = target_revenue * material_cost_rate
        total_variable_cost = estimated_personnel_cost + estimated_material_cost
        total_cost = total_variable_cost + fixed_cost

        # Calculate estimated profit
        estimated_profit = target_revenue - total_cost

        # Profit margin
        profit_margin = (estimated_profit / target_revenue * 100) if target_revenue > 0 else 0

        # Estimate required treatments (assume 1.2 treatments per patient on average)
        required_treatments = math.ceil(required_patients * 1.2)

        # Generate strategies
        strategies = []

        if estimated_profit < target_profit:
            deficit = target_profit - estimated_profit
            strategies.append(f'Increase revenue by ¥{deficit:,.0f} to achieve target profit')
            strategies.append(f'Reduce costs by ¥{deficit:,.0f}')
            strategies.append('Increase self-pay treatment ratio')

        strategies.append(f'Acquire {required_patients} patients per month')
        strategies.append(f'Perform {required_treatments} treatments per month')

        if personnel_cost_rate > 0.5:
            strategies.append('Consider optimizing personnel cost (currently > 50% of revenue)')

        return SimulationResult(
            required_patients=required_patients,
            required_treatments=required_treatments,
            estimated_revenue=target_revenue,
            estimated_profit=estimated_profit,
            profit_margin=profit_margin,
            strategies=strategies
        )

    async def create_simulation(self, data: SimulationCreate) -> Simulation:
        '''Create new simulation'''
        try:
            # Calculate result
            result = self._calculate_simulation(data.input)

            # Prepare data for database
            simulation_data = {
                'clinic_id': data.clinic_id,
                'title': data.title,
                'input': data.input.model_dump(),
                'result': result.model_dump()
            }

            response = self.supabase.table('simulations').insert(simulation_data).execute()

            if not response.data or len(response.data) == 0:
                raise ValueError('Failed to create simulation')

            # Parse result
            db_data = response.data[0]
            return Simulation(
                id=db_data['id'],
                clinic_id=db_data['clinic_id'],
                title=db_data['title'],
                input=SimulationInput(**db_data['input']),
                result=SimulationResult(**db_data['result']),
                created_at=db_data['created_at'],
                updated_at=db_data['updated_at']
            )

        except Exception as e:
            raise ValueError(f'Failed to create simulation: {str(e)}')

    async def get_simulations(self, clinic_id: str) -> List[Simulation]:
        '''Get all simulations for clinic'''
        try:
            response = self.supabase.table('simulations').select('*').eq('clinic_id', clinic_id).order('created_at', desc=True).execute()

            simulations = []
            for data in response.data:
                simulations.append(Simulation(
                    id=data['id'],
                    clinic_id=data['clinic_id'],
                    title=data['title'],
                    input=SimulationInput(**data['input']),
                    result=SimulationResult(**data['result']),
                    created_at=data['created_at'],
                    updated_at=data['updated_at']
                ))

            return simulations

        except Exception as e:
            raise ValueError(f'Failed to get simulations: {str(e)}')

    async def get_simulation(self, simulation_id: str) -> Simulation:
        '''Get simulation by ID'''
        try:
            response = self.supabase.table('simulations').select('*').eq('id', simulation_id).single().execute()

            if not response.data:
                raise ValueError('Simulation not found')

            data = response.data
            return Simulation(
                id=data['id'],
                clinic_id=data['clinic_id'],
                title=data['title'],
                input=SimulationInput(**data['input']),
                result=SimulationResult(**data['result']),
                created_at=data['created_at'],
                updated_at=data['updated_at']
            )

        except Exception as e:
            raise ValueError(f'Failed to get simulation: {str(e)}')
