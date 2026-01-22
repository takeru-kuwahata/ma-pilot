from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Clinic(BaseModel):
    '''Clinic model'''
    id: str
    name: str
    postal_code: str
    address: str
    phone_number: str
    latitude: float
    longitude: float
    owner_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ClinicCreate(BaseModel):
    '''Create clinic request'''
    name: str
    postal_code: str
    address: str
    phone_number: str
    latitude: float
    longitude: float
    owner_id: str


class ClinicUpdate(BaseModel):
    '''Update clinic request'''
    name: Optional[str] = None
    postal_code: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ClinicResponse(BaseModel):
    '''Clinic response'''
    data: Clinic
    message: Optional[str] = None
