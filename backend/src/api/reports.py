from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from ..models.report import Report, ReportGenerateRequest, ReportResponse, ReportListResponse
from ..services.report_service import ReportService
from ..core.database import get_supabase_client
from supabase import Client

router = APIRouter(prefix='/api/reports', tags=['Reports'])


def get_report_service(supabase: Client = Depends(get_supabase_client)) -> ReportService:
    '''Get report service dependency'''
    return ReportService(supabase)


@router.post('/generate', response_model=ReportResponse)
async def generate_report(
    request: ReportGenerateRequest,
    report_service: ReportService = Depends(get_report_service)
):
    '''Generate new report'''
    try:
        report = await report_service.generate_report(request)
        return ReportResponse(data=report, message='Report generated successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('', response_model=ReportListResponse)
async def get_reports(
    clinic_id: str = Query(...),
    report_service: ReportService = Depends(get_report_service)
):
    '''Get all reports for clinic'''
    try:
        reports = await report_service.get_reports(clinic_id)
        return ReportListResponse(data=reports)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/{report_id}/download')
async def download_report(
    report_id: str,
    report_service: ReportService = Depends(get_report_service)
):
    '''Download report file'''
    try:
        file_url = await report_service.download_report(report_id)
        return RedirectResponse(url=file_url)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
