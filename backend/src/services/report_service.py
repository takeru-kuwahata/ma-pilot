from supabase import Client
from typing import List
from ..models.report import Report, ReportGenerateRequest
from datetime import datetime
from .pdf_service import PdfService
import uuid


class ReportService:
    '''Report service'''

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.pdf_service = PdfService()

    async def generate_report(self, request: ReportGenerateRequest) -> Report:
        '''Generate new report'''
        try:
            # Generate PDF based on report type
            if request.type == 'monthly':
                pdf_bytes = await self._generate_monthly_report_pdf(request)
            elif request.type == 'simulation':
                pdf_bytes = await self._generate_simulation_report_pdf(request)
            else:
                raise ValueError(f'Unsupported report type: {request.type}')

            # Upload PDF to Supabase Storage
            file_name = f'{request.clinic_id}/{request.type}_{uuid.uuid4()}.pdf'

            try:
                upload_response = self.supabase.storage.from_('reports').upload(
                    file_name,
                    pdf_bytes,
                    {'content-type': 'application/pdf'}
                )
                print(f'Upload response: {upload_response}')
            except Exception as upload_error:
                raise ValueError(f'Failed to upload PDF to storage: {str(upload_error)}')

            # Get public URL
            file_url = self.supabase.storage.from_('reports').get_public_url(file_name)
            print(f'Generated file URL: {file_url}')

            report_data = {
                'clinic_id': request.clinic_id,
                'type': request.type,
                'format': request.format,
                'title': request.title,
                'generated_at': datetime.now().isoformat(),
                'file_url': file_url
            }

            response = self.supabase.table('reports').insert(report_data).execute()

            if not response.data or len(response.data) == 0:
                raise ValueError('Failed to generate report')

            return Report(**response.data[0])

        except Exception as e:
            raise ValueError(f'Failed to generate report: {str(e)}')

    async def _generate_monthly_report_pdf(self, request: ReportGenerateRequest) -> bytes:
        '''Generate monthly report PDF'''
        # Get latest monthly data for the clinic
        response = self.supabase.table('monthly_data').select('*').eq(
            'clinic_id', request.clinic_id
        ).order('year_month', desc=True).limit(2).execute()

        if not response.data or len(response.data) == 0:
            raise ValueError('No monthly data found')

        current_month = response.data[0]
        previous_month = response.data[1] if len(response.data) > 1 else None

        # Get clinic info
        clinic_response = self.supabase.table('clinics').select('name').eq(
            'id', request.clinic_id
        ).single().execute()

        clinic_name = clinic_response.data['name'] if clinic_response.data else 'クリニック'

        # Calculate values
        total_revenue = current_month['total_revenue']
        personnel_cost = current_month.get('personnel_cost', 0)
        material_cost = current_month.get('material_cost', 0)
        fixed_cost = current_month.get('fixed_cost', 0)
        other_cost = current_month.get('other_cost', 0)

        variable_cost = material_cost + other_cost
        total_cost = personnel_cost + variable_cost + fixed_cost
        operating_profit = total_revenue - total_cost
        profit_margin = (operating_profit / total_revenue * 100) if total_revenue > 0 else 0

        revenue_per_patient = (total_revenue / current_month['total_patients']) if current_month['total_patients'] > 0 else 0

        # Calculate month-over-month changes
        revenue_change = None
        profit_change = None
        patient_change = None

        if previous_month:
            prev_revenue = previous_month['total_revenue']
            prev_profit = prev_revenue - (previous_month.get('personnel_cost', 0) + previous_month.get('material_cost', 0) + previous_month.get('fixed_cost', 0) + previous_month.get('other_cost', 0))

            revenue_change = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
            profit_change = ((operating_profit - prev_profit) / prev_profit * 100) if prev_profit != 0 else 0
            patient_change = ((current_month['total_patients'] - previous_month['total_patients']) / previous_month['total_patients'] * 100) if previous_month['total_patients'] > 0 else 0

        # Generate PDF
        pdf_bytes = self.pdf_service.generate_monthly_report_pdf(
            title=request.title,
            clinic_name=clinic_name,
            total_revenue=total_revenue,
            operating_profit=int(operating_profit),
            profit_margin=profit_margin,
            total_patients=current_month['total_patients'],
            new_patients=current_month.get('new_patients', 0),
            revenue_per_patient=int(revenue_per_patient),
            insurance_revenue=current_month.get('insurance_revenue', 0),
            self_pay_revenue=current_month.get('self_pay_revenue', 0),
            retail_revenue=current_month.get('retail_revenue', 0),
            variable_cost=int(variable_cost),
            fixed_cost=fixed_cost,
            total_cost=int(total_cost),
            revenue_change=revenue_change,
            profit_change=profit_change,
            patient_change=patient_change,
        )

        return pdf_bytes

    async def _generate_simulation_report_pdf(self, request: ReportGenerateRequest) -> bytes:
        '''Generate simulation report PDF'''
        # Get the latest simulation for the clinic
        response = self.supabase.table('simulations').select('*').eq(
            'clinic_id', request.clinic_id
        ).order('created_at', desc=True).limit(1).execute()

        if not response.data or len(response.data) == 0:
            raise ValueError('No simulation data found')

        simulation = response.data[0]

        # Get clinic info
        clinic_response = self.supabase.table('clinics').select('name').eq(
            'id', request.clinic_id
        ).single().execute()

        clinic_name = clinic_response.data['name'] if clinic_response.data else 'クリニック'

        # Extract simulation data
        target_revenue = simulation['target_revenue']
        target_profit = simulation['target_profit']
        profit_margin = (target_profit / target_revenue * 100) if target_revenue > 0 else 0

        current_revenue = simulation['current_revenue']
        current_profit = simulation['current_profit']

        revenue_change_amount = target_revenue - current_revenue
        revenue_change_rate = ((target_revenue - current_revenue) / current_revenue * 100) if current_revenue > 0 else 0

        profit_change_amount = target_profit - current_profit
        profit_change_rate = ((target_profit - current_profit) / current_profit * 100) if current_profit != 0 else 0

        # Get parameters
        params = simulation.get('parameters', {})
        avg_revenue_per_patient = params.get('avg_revenue_per_patient', 0)
        personnel_cost_rate = params.get('personnel_cost_rate', 0)
        material_cost_rate = params.get('material_cost_rate', 0)
        fixed_cost = params.get('fixed_cost', 0)

        # Generate PDF
        pdf_bytes = self.pdf_service.generate_simulation_report_pdf(
            title=request.title,
            clinic_name=clinic_name,
            target_revenue=target_revenue,
            target_profit=target_profit,
            profit_margin=profit_margin,
            current_revenue=current_revenue,
            current_profit=current_profit,
            revenue_change_amount=revenue_change_amount,
            revenue_change_rate=revenue_change_rate,
            profit_change_amount=profit_change_amount,
            profit_change_rate=profit_change_rate,
            avg_revenue_per_patient=avg_revenue_per_patient,
            personnel_cost_rate=personnel_cost_rate,
            material_cost_rate=material_cost_rate,
            fixed_cost=fixed_cost,
        )

        return pdf_bytes

    async def get_reports(self, clinic_id: str) -> List[Report]:
        '''Get all reports for clinic'''
        try:
            response = self.supabase.table('reports').select('*').eq('clinic_id', clinic_id).order('generated_at', desc=True).execute()

            return [Report(**report) for report in response.data]

        except Exception as e:
            raise ValueError(f'Failed to get reports: {str(e)}')

    async def get_report(self, report_id: str) -> Report:
        '''Get report by ID'''
        try:
            response = self.supabase.table('reports').select('*').eq('id', report_id).single().execute()

            if not response.data:
                raise ValueError('Report not found')

            return Report(**response.data)

        except Exception as e:
            raise ValueError(f'Failed to get report: {str(e)}')

    async def download_report(self, report_id: str) -> str:
        '''Get download URL for report'''
        try:
            report = await self.get_report(report_id)
            return report.file_url

        except Exception as e:
            raise ValueError(f'Failed to download report: {str(e)}')

    async def delete_report(self, report_id: str) -> None:
        '''Delete report and its file from storage'''
        try:
            # Get report to get file URL
            report = await self.get_report(report_id)

            # Extract file path from URL
            if report.file_url:
                # URL format: https://xxx.supabase.co/storage/v1/object/public/reports/{file_path}
                parts = report.file_url.split('/reports/')
                if len(parts) > 1:
                    file_path = parts[1]
                    # Delete file from Supabase Storage
                    try:
                        self.supabase.storage.from_('reports').remove([file_path])
                    except Exception as storage_error:
                        # Continue even if storage deletion fails
                        print(f'Failed to delete file from storage: {storage_error}')

            # Delete report record from database
            self.supabase.table('reports').delete().eq('id', report_id).execute()

        except Exception as e:
            raise ValueError(f'Failed to delete report: {str(e)}')
