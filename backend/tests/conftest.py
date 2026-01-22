'''
Test fixtures and configuration for backend tests
'''
import os
import pytest
from typing import Generator
from httpx import AsyncClient
from fastapi import FastAPI
from unittest.mock import Mock, AsyncMock

# テスト環境変数を設定
os.environ['ENVIRONMENT'] = 'development'
os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
os.environ['SUPABASE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzQ1Njc4OX0.test-key-for-testing-purposes-only'
os.environ['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_db'


@pytest.fixture
def mock_supabase():
    '''Mock Supabase client'''
    mock = Mock()
    mock.table = Mock(return_value=mock)
    mock.select = Mock(return_value=mock)
    mock.insert = Mock(return_value=mock)
    mock.update = Mock(return_value=mock)
    mock.delete = Mock(return_value=mock)
    mock.eq = Mock(return_value=mock)
    mock.execute = AsyncMock(return_value=Mock(data=[], error=None))
    return mock


@pytest.fixture
def mock_auth_user():
    '''Mock authenticated user'''
    return {
        'id': 'test-user-id',
        'email': 'test@example.com',
        'role': 'clinic_owner',
        'clinic_id': 'test-clinic-id',
    }


@pytest.fixture
async def test_app() -> Generator[FastAPI, None, None]:
    '''Test FastAPI application instance'''
    from main import app
    yield app


@pytest.fixture
async def async_client(test_app: FastAPI) -> Generator[AsyncClient, None, None]:
    '''Async HTTP client for testing'''
    async with AsyncClient(app=test_app, base_url='http://test') as client:
        yield client


@pytest.fixture
def sample_print_order():
    '''Sample print order data for testing'''
    return {
        'clinic_id': 'test-clinic-id',
        'order_type': 'business_card',
        'quantity': 100,
        'design_template': 'template_001',
        'clinic_name': 'テスト歯科医院',
        'doctor_name': '山田 太郎',
        'contact_info': {
            'phone': '03-1234-5678',
            'address': '東京都渋谷区1-2-3',
            'email': 'test@example.com',
        },
        'custom_fields': {},
        'status': 'draft',
        'unit_price': 5000,
        'tax_rate': 0.1,
        'total_price': 5500,
    }


@pytest.fixture
def sample_clinic_data():
    '''Sample clinic data for testing'''
    return {
        'id': 'test-clinic-id',
        'name': 'テスト歯科医院',
        'email': 'clinic@test.com',
        'phone': '03-1234-5678',
        'address': '東京都渋谷区1-2-3',
        'postal_code': '150-0001',
        'latitude': 35.6595,
        'longitude': 139.7004,
        'is_active': True,
    }


@pytest.fixture
def sample_monthly_data():
    '''Sample monthly data for testing'''
    return {
        'clinic_id': 'test-clinic-id',
        'year_month': '2025-01',
        'revenue': 10000000,
        'patient_count': 500,
        'new_patient_count': 50,
        'treatment_count': 800,
        'operating_expenses': 6000000,
        'staff_count': 10,
    }


# Helper functions for tests
def create_auth_headers(token: str = 'test-token') -> dict:
    '''Create authentication headers'''
    return {'Authorization': f'Bearer {token}'}


def assert_response_success(response, expected_status: int = 200):
    '''Assert response is successful'''
    assert response.status_code == expected_status
    assert response.json() is not None


def assert_response_error(response, expected_status: int, expected_detail: str = None):
    '''Assert response is an error'''
    assert response.status_code == expected_status
    if expected_detail:
        assert expected_detail in response.json().get('detail', '')
