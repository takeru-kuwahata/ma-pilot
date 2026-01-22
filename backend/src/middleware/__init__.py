"""Middleware package for authentication, security, and performance"""
from .auth import (
    get_current_user,
    require_role,
    require_clinic_access,
    get_current_user_metadata,
)
from .performance import PerformanceMiddleware

__all__ = [
    'get_current_user',
    'require_role',
    'require_clinic_access',
    'get_current_user_metadata',
    'PerformanceMiddleware',
]
