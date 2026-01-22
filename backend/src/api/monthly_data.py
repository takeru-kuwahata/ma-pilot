from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from ..models.monthly_data import MonthlyData, MonthlyDataCreate, MonthlyDataUpdate, MonthlyDataListResponse, MonthlyDataResponse, CsvImportResult
from ..services.monthly_data_service import MonthlyDataService
from ..core.database import get_supabase_client
from supabase import Client
from typing import Optional

router = APIRouter(prefix='/api/monthly-data', tags=['Monthly Data'])


def get_monthly_data_service(supabase: Client = Depends(get_supabase_client)) -> MonthlyDataService:
    '''Get monthly data service dependency'''
    return MonthlyDataService(supabase)


@router.get('', response_model=MonthlyDataListResponse)
async def get_monthly_data(
    clinic_id: str = Query(...),
    year_month: Optional[str] = Query(None),
    monthly_data_service: MonthlyDataService = Depends(get_monthly_data_service)
):
    '''Get monthly data for clinic'''
    try:
        data = await monthly_data_service.get_monthly_data(clinic_id, year_month)
        return MonthlyDataListResponse(data=data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('', response_model=MonthlyDataResponse)
async def create_monthly_data(
    request: MonthlyDataCreate,
    monthly_data_service: MonthlyDataService = Depends(get_monthly_data_service)
):
    '''Create new monthly data'''
    try:
        data = await monthly_data_service.create_monthly_data(request)
        return MonthlyDataResponse(data=data, message='Monthly data created successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/{data_id}', response_model=MonthlyDataResponse)
async def update_monthly_data(
    data_id: str,
    request: MonthlyDataUpdate,
    monthly_data_service: MonthlyDataService = Depends(get_monthly_data_service)
):
    '''Update monthly data'''
    try:
        data = await monthly_data_service.update_monthly_data(data_id, request)
        return MonthlyDataResponse(data=data, message='Monthly data updated successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete('/{data_id}')
async def delete_monthly_data(
    data_id: str,
    monthly_data_service: MonthlyDataService = Depends(get_monthly_data_service)
):
    '''Delete monthly data'''
    try:
        result = await monthly_data_service.delete_monthly_data(data_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/import-csv', response_model=CsvImportResult)
async def import_csv(
    clinic_id: str = Query(...),
    file: UploadFile = File(...),
    monthly_data_service: MonthlyDataService = Depends(get_monthly_data_service)
):
    '''Import monthly data from CSV'''
    try:
        # Read CSV file
        csv_content = await file.read()
        csv_text = csv_content.decode('utf-8')

        result = await monthly_data_service.import_csv(clinic_id, csv_text)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
