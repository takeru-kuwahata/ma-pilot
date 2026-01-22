from supabase import Client
from typing import List
from ..models.report import Report, ReportGenerateRequest
from datetime import datetime
import uuid


class ReportService:
    '''Report service'''

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def generate_report(self, request: ReportGenerateRequest) -> Report:
        '''Generate new report'''
        try:
            # TODO: Implement actual PDF/CSV generation logic
            # For now, create a placeholder file URL

            file_url = f'https://placeholder.com/reports/{uuid.uuid4()}.{request.format}'

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
