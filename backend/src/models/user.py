from pydantic import BaseModel, EmailStr, Field, validator
from typing import Literal, Optional
from datetime import datetime
import re

UserRole = Literal['system_admin', 'clinic_owner', 'clinic_editor', 'clinic_viewer']


class User(BaseModel):
    '''User model'''
    id: str
    email: EmailStr
    role: UserRole
    clinic_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class UserMetadata(BaseModel):
    '''User metadata model'''
    user_id: str
    role: UserRole
    clinic_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# Auth Request/Response models
class LoginRequest(BaseModel):
    '''Login request'''
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @validator('password')
    def validate_password_strength(cls, v: str) -> str:
        '''パスワード強度検証: 最低8文字、英数字含む'''
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


class LoginResponse(BaseModel):
    '''Login response'''
    access_token: str
    token_type: str = 'bearer'
    user: User


class PasswordResetRequest(BaseModel):
    '''Password reset request'''
    email: EmailStr


class PasswordResetResponse(BaseModel):
    '''Password reset response'''
    message: str


class InviteUserRequest(BaseModel):
    '''Invite user request'''
    email: EmailStr
    role: UserRole
    clinic_id: Optional[str] = None


class InviteUserResponse(BaseModel):
    '''Invite user response'''
    message: str
    invite_token: str


class UpdateUserRoleRequest(BaseModel):
    '''Update user role request'''
    role: UserRole
