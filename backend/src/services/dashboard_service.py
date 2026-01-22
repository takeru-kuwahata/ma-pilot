from supabase import Client
from typing import List
from ..models.dashboard import DashboardData, DashboardKpi, DashboardAlert, MonthlyTrendData, KpiComparison
from datetime import datetime, timedelta
import uuid


class DashboardService:
    '''Dashboard service'''

    def __init__(self, supabase: Client):
        self.supabase = supabase

    def _calculate_trend(self, current: float, previous: float) -> str:
        '''Calculate trend direction'''
        if current > previous:
            return 'positive'
        elif current < previous:
            return 'negative'
        else:
            return 'neutral'

    def _calculate_percentage_change(self, current: float, previous: float) -> float:
        '''Calculate percentage change'''
        if previous == 0:
            return 0
        return ((current - previous) / previous) * 100

    async def get_dashboard_data(self, clinic_id: str) -> DashboardData:
        '''Get dashboard data for clinic'''
        try:
            # Get last 12 months of data
            response = self.supabase.table('monthly_data').select('*').eq('clinic_id', clinic_id).order('year_month', desc=True).limit(12).execute()

            monthly_data_list = response.data

            if not monthly_data_list or len(monthly_data_list) == 0:
                # Return empty dashboard
                return DashboardData(
                    kpis=[],
                    alerts=[],
                    trends=[],
                    last_updated=datetime.now().isoformat(),
                    data_source='No data available'
                )

            # Current month (most recent)
            current_month = monthly_data_list[0]

            # Previous month
            previous_month = monthly_data_list[1] if len(monthly_data_list) > 1 else None

            # Same month last year
            current_year_month = current_month['year_month']
            year, month = current_year_month.split('-')
            last_year_month = f'{int(year)-1}-{month}'

            last_year_data = None
            for data in monthly_data_list:
                if data['year_month'] == last_year_month:
                    last_year_data = data
                    break

            # Calculate KPIs
            kpis = self._calculate_kpis(current_month, previous_month, last_year_data)

            # Generate alerts
            alerts = self._generate_alerts(current_month, previous_month)

            # Generate trends
            trends = self._generate_trends(monthly_data_list)

            return DashboardData(
                kpis=kpis,
                alerts=alerts,
                trends=trends,
                last_updated=datetime.now().isoformat(),
                data_source='Monthly data input'
            )

        except Exception as e:
            raise ValueError(f'Failed to get dashboard data: {str(e)}')

    def _calculate_kpis(self, current: dict, previous: dict | None, last_year: dict | None) -> List[DashboardKpi]:
        '''Calculate KPIs'''
        kpis = []

        # Total Revenue
        current_revenue = current['total_revenue']
        prev_revenue = previous['total_revenue'] if previous else 0
        ly_revenue = last_year['total_revenue'] if last_year else 0

        kpis.append(DashboardKpi(
            id=str(uuid.uuid4()),
            label='Total Revenue',
            value=current_revenue,
            unit='¥',
            comparison=KpiComparison(
                trend=self._calculate_trend(current_revenue, prev_revenue),
                month_over_month=self._calculate_percentage_change(current_revenue, prev_revenue),
                year_over_year=self._calculate_percentage_change(current_revenue, ly_revenue)
            )
        ))

        # Operating Profit
        current_profit = current_revenue - (current['personnel_cost'] + current['material_cost'] + current['fixed_cost'] + current.get('other_cost', 0))
        prev_profit = (prev_revenue - (previous['personnel_cost'] + previous['material_cost'] + previous['fixed_cost'] + previous.get('other_cost', 0))) if previous else 0

        kpis.append(DashboardKpi(
            id=str(uuid.uuid4()),
            label='Operating Profit',
            value=current_profit,
            unit='¥',
            comparison=KpiComparison(
                trend=self._calculate_trend(current_profit, prev_profit),
                month_over_month=self._calculate_percentage_change(current_profit, prev_profit),
                year_over_year=0  # Simplified
            )
        ))

        # Total Patients
        current_patients = current['total_patients']
        prev_patients = previous['total_patients'] if previous else 0

        kpis.append(DashboardKpi(
            id=str(uuid.uuid4()),
            label='Total Patients',
            value=current_patients,
            unit='人',
            comparison=KpiComparison(
                trend=self._calculate_trend(current_patients, prev_patients),
                month_over_month=self._calculate_percentage_change(current_patients, prev_patients),
                year_over_year=0  # Simplified
            )
        ))

        return kpis

    def _generate_alerts(self, current: dict, previous: dict | None) -> List[DashboardAlert]:
        '''Generate alerts based on data'''
        alerts = []

        # Check for profit decline
        current_revenue = current['total_revenue']
        current_profit = current_revenue - (current['personnel_cost'] + current['material_cost'] + current['fixed_cost'] + current.get('other_cost', 0))

        if previous:
            prev_revenue = previous['total_revenue']
            prev_profit = prev_revenue - (previous['personnel_cost'] + previous['material_cost'] + previous['fixed_cost'] + previous.get('other_cost', 0))

            if current_profit < prev_profit:
                alerts.append(DashboardAlert(
                    id=str(uuid.uuid4()),
                    severity='warning',
                    title='Profit Decline',
                    message='Operating profit decreased compared to last month',
                    timestamp=datetime.now().isoformat()
                ))

            # Check for patient decline
            if current['total_patients'] < previous['total_patients']:
                alerts.append(DashboardAlert(
                    id=str(uuid.uuid4()),
                    severity='info',
                    title='Patient Count Decrease',
                    message='Total patients decreased compared to last month',
                    timestamp=datetime.now().isoformat()
                ))

        return alerts

    def _generate_trends(self, monthly_data_list: List[dict]) -> List[MonthlyTrendData]:
        '''Generate trend data'''
        trends = []

        for data in reversed(monthly_data_list):  # Oldest to newest
            total_revenue = data['total_revenue']
            operating_profit = total_revenue - (data['personnel_cost'] + data['material_cost'] + data['fixed_cost'] + data.get('other_cost', 0))

            # Calculate self-pay rate
            self_pay_rate = (data['self_pay_revenue'] / total_revenue * 100) if total_revenue > 0 else 0

            # Simplified unit utilization (placeholder calculation)
            unit_utilization = min(100, (data['treatment_count'] / 200 * 100)) if data['treatment_count'] > 0 else 0

            trends.append(MonthlyTrendData(
                year_month=data['year_month'],
                total_revenue=total_revenue,
                operating_profit=operating_profit,
                new_patients=data['new_patients'],
                returning_patients=data['returning_patients'],
                unit_utilization=unit_utilization,
                self_pay_rate=self_pay_rate
            ))

        return trends
