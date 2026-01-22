from pydantic import BaseModel
from typing import List, Literal

ComparisonTrend = Literal['positive', 'negative', 'neutral']
AlertSeverity = Literal['warning', 'error', 'info']


class KpiComparison(BaseModel):
    '''KPI comparison data'''
    trend: ComparisonTrend
    month_over_month: float  # %
    year_over_year: float  # %


class DashboardKpi(BaseModel):
    '''Dashboard KPI'''
    id: str
    label: str
    value: float
    unit: str
    comparison: KpiComparison


class DashboardAlert(BaseModel):
    '''Dashboard alert'''
    id: str
    severity: AlertSeverity
    title: str
    message: str
    timestamp: str


class MonthlyTrendData(BaseModel):
    '''Monthly trend data point'''
    year_month: str  # YYYY-MM
    total_revenue: float
    operating_profit: float
    new_patients: int
    returning_patients: int
    unit_utilization: float  # %
    self_pay_rate: float  # %


class DashboardData(BaseModel):
    '''Dashboard data'''
    kpis: List[DashboardKpi]
    alerts: List[DashboardAlert]
    trends: List[MonthlyTrendData]
    last_updated: str
    data_source: str


class DashboardResponse(BaseModel):
    '''Dashboard response'''
    data: DashboardData
    message: str = None
