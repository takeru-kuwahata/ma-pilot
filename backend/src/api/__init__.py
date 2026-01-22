from .print_orders import router as print_orders_router
from .auth import router as auth_router
from .clinics import router as clinics_router
from .monthly_data import router as monthly_data_router
from .dashboard import router as dashboard_router
from .simulations import router as simulations_router
from .reports import router as reports_router
from .market_analysis import router as market_analysis_router
from .staff import router as staff_router
from .admin import router as admin_router

__all__ = [
    "print_orders_router",
    "auth_router",
    "clinics_router",
    "monthly_data_router",
    "dashboard_router",
    "simulations_router",
    "reports_router",
    "market_analysis_router",
    "staff_router",
    "admin_router",
]
