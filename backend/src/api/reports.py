from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from ..models.report import Report, ReportGenerateRequest, ReportResponse, ReportListResponse
from ..services.report_service import ReportService
from ..services.clinic_service import ClinicService
from ..core.database import get_supabase_client
from supabase import Client

router = APIRouter(prefix='/api/reports', tags=['Reports'])


def get_report_service(supabase: Client = Depends(get_supabase_client)) -> ReportService:
    '''Get report service dependency'''
    return ReportService(supabase)


def get_clinic_service(supabase: Client = Depends(get_supabase_client)) -> ClinicService:
    '''Get clinic service dependency'''
    return ClinicService(supabase)


@router.post('/generate', response_model=ReportResponse)
async def generate_report(
    request: ReportGenerateRequest,
    report_service: ReportService = Depends(get_report_service),
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Generate new report'''
    # clinic_idがスラッグの場合、実際のIDに変換
    try:
        clinic = await clinic_service.get_clinic(request.clinic_id)
        actual_clinic_id = clinic.id
    except ValueError:
        raise HTTPException(status_code=404, detail='Clinic not found')

    try:
        # リクエストのclinic_idを実際のUUIDに置き換え
        request.clinic_id = actual_clinic_id
        report = await report_service.generate_report(request)
        return ReportResponse(data=report, message='Report generated successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('', response_model=ReportListResponse)
async def get_reports(
    clinic_id: str = Query(...),
    report_service: ReportService = Depends(get_report_service),
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Get all reports for clinic'''
    # clinic_idがスラッグの場合、実際のIDに変換
    try:
        clinic = await clinic_service.get_clinic(clinic_id)
        actual_clinic_id = clinic.id
    except ValueError:
        raise HTTPException(status_code=404, detail='Clinic not found')

    try:
        reports = await report_service.get_reports(actual_clinic_id)
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
