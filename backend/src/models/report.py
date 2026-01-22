from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime

ReportType = Literal['monthly', 'quarterly', 'annual', 'simulation', 'market_analysis']
ReportFormat = Literal['pdf', 'csv']


class Report(BaseModel):
    '''Report model'''
    id: str
    clinic_id: str
    type: ReportType
    format: ReportFormat
    title: str
    generated_at: datetime
    file_url: str
    created_at: datetime


class ReportGenerateRequest(BaseModel):
    '''Generate report request'''
    clinic_id: str
    type: ReportType
    format: ReportFormat
    title: str
    parameters: Optional[dict] = None  # Additional parameters for report generation


class ReportResponse(BaseModel):
    '''Report response'''
    data: Report
    message: Optional[str] = None


class ReportListResponse(BaseModel):
    '''Report list response'''
    data: List[Report]
    message: Optional[str] = None
