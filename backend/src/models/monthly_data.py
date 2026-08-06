from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MonthlyData(BaseModel):
    '''Monthly data model'''
    id: str
    clinic_id: str
    year_month: str  # YYYY-MM format

    # Revenue
    total_revenue: float
    insurance_revenue: float
    self_pay_revenue: float
    retail_revenue: float  # 物販（その他）収入

    # Costs
    variable_cost: float  # 変動費（材料費・技工料など）
    fixed_cost: float     # 固定費（人件費・家賃・光熱費など）

    # Patients
    first_visit_patients: int       # 初診
    re_first_visit_patients: int    # 再初診
    returning_patients: int         # 再診
    other_patients: int             # 他
    total_patients: int

    # Treatments
    treatment_count: int
    average_revenue_per_patient: float

    created_at: datetime
    updated_at: datetime


class MonthlyDataCreate(BaseModel):
    '''Create monthly data request'''
    clinic_id: str
    year_month: str

    insurance_revenue: float
    self_pay_revenue: float
    retail_revenue: float = 0

    variable_cost: float = 0
    fixed_cost: float = 0

    first_visit_patients: int = 0       # 初診
    re_first_visit_patients: int = 0    # 再初診
    returning_patients: int = 0         # 再診
    other_patients: int = 0             # 他

    treatment_count: int = 0


class MonthlyDataUpdate(BaseModel):
    '''Update monthly data request'''
    insurance_revenue: Optional[float] = None
    self_pay_revenue: Optional[float] = None
    retail_revenue: Optional[float] = None

    variable_cost: Optional[float] = None
    fixed_cost: Optional[float] = None

    first_visit_patients: Optional[int] = None      # 初診
    re_first_visit_patients: Optional[int] = None   # 再初診
    returning_patients: Optional[int] = None        # 再診
    other_patients: Optional[int] = None            # 他

    treatment_count: Optional[int] = None


class MonthlyDataResponse(BaseModel):
    '''Monthly data response'''
    data: MonthlyData
    message: Optional[str] = None


class MonthlyDataListResponse(BaseModel):
    '''Monthly data list response'''
    data: List[MonthlyData]
    message: Optional[str] = None


class CsvImportResult(BaseModel):
    '''CSV import result'''
    success: int
    failed: int
    errors: List[dict]
