from supabase import Client
from typing import List, Optional
from ..models.monthly_data import MonthlyData, MonthlyDataCreate, MonthlyDataUpdate, CsvImportResult
import csv
from io import StringIO


class MonthlyDataService:
    '''Monthly data service'''

    def __init__(self, supabase: Client):
        self.supabase = supabase

    def _calculate_totals(self, data: dict) -> dict:
        '''Calculate total revenue and total patients'''
        data['total_revenue'] = data.get('insurance_revenue', 0) + data.get('self_pay_revenue', 0)
        data['total_patients'] = data.get('new_patients', 0) + data.get('returning_patients', 0)

        # Calculate average revenue per patient
        if data['total_patients'] > 0:
            data['average_revenue_per_patient'] = data['total_revenue'] / data['total_patients']
        else:
            data['average_revenue_per_patient'] = 0

        return data

    async def get_monthly_data(self, clinic_id: str, year_month: Optional[str] = None) -> List[MonthlyData]:
        '''Get monthly data for clinic'''
        try:
            query = self.supabase.table('monthly_data').select('*').eq('clinic_id', clinic_id)

            if year_month:
                query = query.eq('year_month', year_month)

            response = query.order('year_month', desc=True).execute()

            return [MonthlyData(**data) for data in response.data]

        except Exception as e:
            raise ValueError(f'Failed to get monthly data: {str(e)}')

    async def create_monthly_data(self, data: MonthlyDataCreate) -> MonthlyData:
        '''Create new monthly data'''
        try:
            # Calculate totals
            data_dict = self._calculate_totals(data.model_dump())

            response = self.supabase.table('monthly_data').insert(data_dict).execute()

            if not response.data or len(response.data) == 0:
                raise ValueError('Failed to create monthly data')

            return MonthlyData(**response.data[0])

        except Exception as e:
            raise ValueError(f'Failed to create monthly data: {str(e)}')

    async def update_monthly_data(self, data_id: str, data: MonthlyDataUpdate) -> MonthlyData:
        '''Update monthly data'''
        try:
            # Only update non-None fields
            update_data = {k: v for k, v in data.model_dump().items() if v is not None}

            if not update_data:
                raise ValueError('No data to update')

            # Recalculate totals if revenue or patient fields are updated
            if any(k in update_data for k in ['insurance_revenue', 'self_pay_revenue', 'new_patients', 'returning_patients']):
                # Get current data
                current = self.supabase.table('monthly_data').select('*').eq('id', data_id).single().execute()
                if current.data:
                    merged_data = {**current.data, **update_data}
                    update_data = self._calculate_totals(merged_data)
                    # Remove timestamps to avoid conflict
                    update_data.pop('created_at', None)
                    update_data.pop('updated_at', None)
                    update_data.pop('id', None)
                    update_data.pop('clinic_id', None)
                    update_data.pop('year_month', None)

            response = self.supabase.table('monthly_data').update(update_data).eq('id', data_id).execute()

            if not response.data or len(response.data) == 0:
                raise ValueError('Monthly data not found')

            return MonthlyData(**response.data[0])

        except Exception as e:
            raise ValueError(f'Failed to update monthly data: {str(e)}')

    async def delete_monthly_data(self, data_id: str) -> dict:
        '''Delete monthly data'''
        try:
            response = self.supabase.table('monthly_data').delete().eq('id', data_id).execute()

            if not response.data or len(response.data) == 0:
                raise ValueError('Monthly data not found')

            return {'message': 'Monthly data deleted successfully'}

        except Exception as e:
            raise ValueError(f'Failed to delete monthly data: {str(e)}')

    async def import_csv(self, clinic_id: str, csv_content: str) -> CsvImportResult:
        '''Import monthly data from CSV'''
        success_count = 0
        failed_count = 0
        errors = []

        try:
            # Parse CSV
            csv_file = StringIO(csv_content)
            reader = csv.DictReader(csv_file)

            for row_num, row in enumerate(reader, start=2):  # Start at 2 because row 1 is header
                try:
                    # Validate and parse row
                    monthly_data = MonthlyDataCreate(
                        clinic_id=clinic_id,
                        year_month=row['year_month'],
                        insurance_revenue=float(row.get('insurance_revenue', 0)),
                        self_pay_revenue=float(row.get('self_pay_revenue', 0)),
                        personnel_cost=float(row.get('personnel_cost', 0)),
                        material_cost=float(row.get('material_cost', 0)),
                        fixed_cost=float(row.get('fixed_cost', 0)),
                        other_cost=float(row.get('other_cost', 0)),
                        new_patients=int(row.get('new_patients', 0)),
                        returning_patients=int(row.get('returning_patients', 0)),
                        treatment_count=int(row.get('treatment_count', 0))
                    )

                    # Try to create or update
                    data_dict = self._calculate_totals(monthly_data.model_dump())

                    # Check if record exists
                    existing = self.supabase.table('monthly_data').select('id').eq('clinic_id', clinic_id).eq('year_month', row['year_month']).execute()

                    if existing.data and len(existing.data) > 0:
                        # Update existing
                        self.supabase.table('monthly_data').update(data_dict).eq('id', existing.data[0]['id']).execute()
                    else:
                        # Insert new
                        self.supabase.table('monthly_data').insert(data_dict).execute()

                    success_count += 1

                except Exception as e:
                    failed_count += 1
                    errors.append({
                        'row': row_num,
                        'error': str(e)
                    })

            return CsvImportResult(
                success=success_count,
                failed=failed_count,
                errors=errors
            )

        except Exception as e:
            raise ValueError(f'CSV import failed: {str(e)}')
