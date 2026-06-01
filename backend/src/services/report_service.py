from supabase import Client
from typing import List
from ..models.report import Report, ReportGenerateRequest
from datetime import datetime, timezone, timedelta
from .pdf_service import PdfService
import uuid
import logging

JST = timezone(timedelta(hours=9))

logger = logging.getLogger(__name__)


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
            elif request.type == 'market_analysis':
                pdf_bytes = await self._generate_market_analysis_report_pdf(request)
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
                logger.info('PDF uploaded: %s', upload_response)
            except Exception as upload_error:
                raise ValueError(f'Failed to upload PDF to storage: {str(upload_error)}')

            # Get public URL
            file_url = self.supabase.storage.from_('reports').get_public_url(file_name)
            logger.info('PDF file URL generated: %s', file_url)

            report_data = {
                'clinic_id': request.clinic_id,
                'type': request.type,
                'format': request.format,
                'title': request.title,
                'generated_at': datetime.now(JST).isoformat(),
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
        target_ym = (request.parameters or {}).get('year_month')

        if target_ym:
            # 指定月のデータを取得
            cur_res = self.supabase.table('monthly_data').select('*').eq(
                'clinic_id', request.clinic_id
            ).eq('year_month', target_ym).limit(1).execute()
            if not cur_res.data:
                raise ValueError(f'No monthly data found for {target_ym}')
            current_month = cur_res.data[0]

            # 前月を計算して取得
            try:
                y, m = int(target_ym[:4]), int(target_ym[5:7])
                m -= 1
                if m == 0:
                    y -= 1
                    m = 12
                prev_ym = f'{y:04d}-{m:02d}'
            except Exception:
                prev_ym = None

            previous_month = None
            if prev_ym:
                prev_res = self.supabase.table('monthly_data').select('*').eq(
                    'clinic_id', request.clinic_id
                ).eq('year_month', prev_ym).limit(1).execute()
                if prev_res.data:
                    previous_month = prev_res.data[0]
        else:
            # 指定なし: 最新2件を取得
            all_res = self.supabase.table('monthly_data').select('*').eq(
                'clinic_id', request.clinic_id
            ).order('year_month', desc=True).limit(2).execute()

            if not all_res.data or len(all_res.data) == 0:
                raise ValueError('No monthly data found')
            current_month = all_res.data[0]
            previous_month = all_res.data[1] if len(all_res.data) > 1 else None

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

        total_patients = current_month.get('total_patients') or 0
        revenue_per_patient = (total_revenue / total_patients) if total_patients > 0 else 0

        # Calculate month-over-month changes
        revenue_change = None
        profit_change = None
        patient_change = None

        if previous_month:
            prev_revenue = previous_month['total_revenue']
            prev_profit = prev_revenue - (previous_month.get('personnel_cost', 0) + previous_month.get('material_cost', 0) + previous_month.get('fixed_cost', 0) + previous_month.get('other_cost', 0))

            revenue_change = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
            profit_change = ((operating_profit - prev_profit) / prev_profit * 100) if prev_profit != 0 else 0
            prev_patients = previous_month.get('total_patients') or 0
            patient_change = ((total_patients - prev_patients) / prev_patients * 100) if prev_patients > 0 else 0

        def fmt_ym(raw):
            try:
                parts = str(raw).split('-')
                return f"{parts[0]}年{int(parts[1])}月" if len(parts) >= 2 else str(raw)
            except Exception:
                return str(raw)

        report_period = fmt_ym(current_month.get('year_month', ''))
        prev_period = fmt_ym(previous_month.get('year_month', '')) if previous_month else None

        # Previous month values for comparison table
        prev_total_revenue = previous_month['total_revenue'] if previous_month else 0
        prev_operating_profit = int(previous_month['total_revenue'] - (previous_month.get('personnel_cost', 0) + previous_month.get('material_cost', 0) + previous_month.get('fixed_cost', 0) + previous_month.get('other_cost', 0))) if previous_month else 0
        prev_total_patients = (previous_month.get('total_patients') or 0) if previous_month else 0

        # Generate PDF
        pdf_bytes = self.pdf_service.generate_monthly_report_pdf(
            clinic_name=clinic_name,
            report_period=report_period,
            prev_period=prev_period,
            total_revenue=total_revenue,
            operating_profit=int(operating_profit),
            profit_margin=profit_margin,
            total_patients=total_patients,
            new_patients=current_month.get('first_visit_patients', 0),
            revenue_per_patient=int(revenue_per_patient),
            insurance_revenue=current_month.get('insurance_revenue', 0),
            self_pay_revenue=current_month.get('self_pay_revenue', 0),
            retail_revenue=0,
            variable_cost=int(variable_cost),
            fixed_cost=fixed_cost,
            total_cost=int(total_cost),
            prev_total_revenue=prev_total_revenue,
            prev_operating_profit=prev_operating_profit,
            prev_total_patients=prev_total_patients,
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
        sim_input = simulation.get('input', {})
        sim_result = simulation.get('result', {})
        sim_title = simulation.get('title', '')

        # 目標値（入力）
        target_revenue = sim_input.get('target_revenue', 0)
        target_profit = sim_input.get('target_profit', 0)

        # 結果値（計算済み）
        estimated_revenue = sim_result.get('estimated_revenue', 0)
        estimated_profit = sim_result.get('estimated_profit', 0)
        profit_margin = sim_result.get('profit_margin', 0)
        required_patients = sim_result.get('required_patients', 0)
        required_treatments = sim_result.get('required_treatments', 0)
        strategies = sim_result.get('strategies', [])

        # 前提条件
        avg_revenue_per_patient = sim_input.get('assumed_average_revenue_per_patient', 0)
        personnel_cost_rate = sim_input.get('assumed_personnel_cost_rate', 0)
        material_cost_rate = sim_input.get('assumed_material_cost_rate', 0)
        fixed_cost = sim_input.get('assumed_fixed_cost', 0)

        # Format simulation date for display
        sim_created = simulation.get('created_at', '')
        try:
            parts = str(sim_created)[:10].split('-')
            sim_period = f"{parts[0]}年{int(parts[1])}月{int(parts[2])}日" if len(parts) >= 3 else str(sim_created)[:10]
        except Exception:
            sim_period = str(sim_created)[:10]

        # Generate PDF
        pdf_bytes = self.pdf_service.generate_simulation_report_pdf(
            title=request.title,
            clinic_name=clinic_name,
            sim_title=sim_title,
            report_period=sim_period,
            target_revenue=int(target_revenue),
            target_profit=int(target_profit),
            estimated_revenue=int(estimated_revenue),
            estimated_profit=int(estimated_profit),
            profit_margin=profit_margin,
            required_patients=required_patients,
            required_treatments=required_treatments,
            avg_revenue_per_patient=int(avg_revenue_per_patient),
            personnel_cost_rate=personnel_cost_rate,
            material_cost_rate=material_cost_rate,
            fixed_cost=int(fixed_cost),
            strategies=strategies,
        )

        return pdf_bytes

    async def _generate_market_analysis_report_pdf(self, request: ReportGenerateRequest) -> bytes:
        '''Generate market analysis report PDF'''
        response = self.supabase.table('market_analyses').select('*').eq(
            'clinic_id', request.clinic_id
        ).order('created_at', desc=True).limit(1).execute()

        if not response.data or len(response.data) == 0:
            raise ValueError('No market analysis data found')

        analysis = response.data[0]

        clinic_response = self.supabase.table('clinics').select('name').eq(
            'id', request.clinic_id
        ).single().execute()

        clinic_name = clinic_response.data['name'] if clinic_response.data else 'クリニック'

        radius_km = analysis.get('radius_km', 2.0)
        pop_data = analysis.get('population_data', {})
        total_population = pop_data.get('total_population', 0)
        age_groups = pop_data.get('age_groups', {})
        age0_14 = age_groups.get('age0_14', 0)
        age15_64 = age_groups.get('age15_64', 0)
        age65plus = age_groups.get('age65Plus', age_groups.get('age65plus', 0))

        competitors_raw = analysis.get('competitors', [])
        competitors = []
        for c in competitors_raw:
            if isinstance(c, dict):
                competitors.append({
                    'name': c.get('name', ''),
                    'distance': c.get('distance', 0),
                    'address': c.get('address', ''),
                })

        competitor_count = len(competitors)
        estimated_potential = analysis.get('estimated_potential_patients', 0)
        market_share = analysis.get('market_share', 0)

        # Format analysis date for display
        analysis_created = analysis.get('created_at', '')
        try:
            parts = str(analysis_created)[:7].split('-')
            analysis_period = f"{parts[0]}年{int(parts[1])}月調査" if len(parts) >= 2 else str(analysis_created)[:7]
        except Exception:
            analysis_period = str(analysis_created)[:7]

        pdf_bytes = self.pdf_service.generate_market_analysis_report_pdf(
            title=request.title,
            clinic_name=clinic_name,
            report_period=analysis_period,
            radius_km=radius_km,
            total_population=total_population,
            age0_14=age0_14,
            age15_64=age15_64,
            age65plus=age65plus,
            competitor_count=competitor_count,
            competitors=competitors,
            estimated_potential=estimated_potential,
            market_share=market_share,
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
                        logger.warning('Failed to delete file from storage: %s', storage_error)

            # Delete report record from database
            self.supabase.table('reports').delete().eq('id', report_id).execute()

        except Exception as e:
            raise ValueError(f'Failed to delete report: {str(e)}')
