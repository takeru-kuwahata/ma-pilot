'''
Test cases for dashboard service (unit tests with mocks)
'''
import pytest
from unittest.mock import Mock
from src.services.dashboard_service import DashboardService


SAMPLE_MONTHLY_ROWS = [
    {
        'year_month': '2025-03',
        'total_revenue': 5000000,
        'insurance_revenue': 4000000,
        'self_pay_revenue': 1000000,
        'personnel_cost': 2000000,
        'material_cost': 500000,
        'fixed_cost': 300000,
        'other_cost': 200000,
        'total_patients': 300,
        'first_visit_patients': 30,
        're_first_visit_patients': 20,
        'returning_patients': 240,
        'other_patients': 10,
        'treatment_count': 600,
        'average_revenue_per_patient': 16667,
    },
    {
        'year_month': '2025-02',
        'total_revenue': 4500000,
        'insurance_revenue': 3600000,
        'self_pay_revenue': 900000,
        'personnel_cost': 1900000,
        'material_cost': 450000,
        'fixed_cost': 300000,
        'other_cost': 180000,
        'total_patients': 280,
        'first_visit_patients': 25,
        're_first_visit_patients': 18,
        'returning_patients': 230,
        'other_patients': 7,
        'treatment_count': 560,
        'average_revenue_per_patient': 16071,
    },
]


@pytest.fixture
def mock_supabase_dashboard():
    '''ダッシュボード用Supabaseモック'''
    mock = Mock()
    table_mock = Mock()
    table_mock.select = Mock(return_value=table_mock)
    table_mock.eq = Mock(return_value=table_mock)
    table_mock.order = Mock(return_value=table_mock)
    table_mock.limit = Mock(return_value=table_mock)
    table_mock.execute = Mock(return_value=Mock(data=SAMPLE_MONTHLY_ROWS))
    mock.table = Mock(return_value=table_mock)
    return mock, table_mock


@pytest.mark.asyncio
class TestDashboardData:
    '''ダッシュボードデータ関連のテスト'''

    async def test_get_dashboard_data_success(self, mock_supabase_dashboard):
        '''月次データありの場合、KPIが生成される'''
        mock, _ = mock_supabase_dashboard
        service = DashboardService(mock)
        data = await service.get_dashboard_data('clinic-uuid-001')

        assert data is not None
        assert data.kpis is not None
        assert data.last_updated is not None

    async def test_get_dashboard_data_empty(self, mock_supabase_dashboard):
        '''月次データなしの場合、空のダッシュボードが返る'''
        mock, table_mock = mock_supabase_dashboard
        table_mock.execute.return_value = Mock(data=[])
        service = DashboardService(mock)
        data = await service.get_dashboard_data('clinic-uuid-001')

        assert data.kpis == []
        assert data.alerts == []

    async def test_get_dashboard_data_db_error(self, mock_supabase_dashboard):
        '''DB エラー時は ValueError'''
        mock, table_mock = mock_supabase_dashboard
        table_mock.execute.side_effect = Exception('Connection error')
        service = DashboardService(mock)

        with pytest.raises(ValueError):
            await service.get_dashboard_data('clinic-uuid-001')


class TestDashboardMetrics:
    '''ダッシュボード計算ロジックのテスト（同期・依存なし）'''

    def test_calculate_trend_positive(self):
        '''現在値 > 前月値 → positive'''
        service = DashboardService(Mock())
        assert service._calculate_trend(100, 80) == 'positive'

    def test_calculate_trend_negative(self):
        '''現在値 < 前月値 → negative'''
        service = DashboardService(Mock())
        assert service._calculate_trend(80, 100) == 'negative'

    def test_calculate_trend_neutral(self):
        '''現在値 == 前月値 → neutral'''
        service = DashboardService(Mock())
        assert service._calculate_trend(100, 100) == 'neutral'

    def test_calculate_percentage_change_positive(self):
        '''増加率の計算'''
        service = DashboardService(Mock())
        result = service._calculate_percentage_change(110, 100)
        assert abs(result - 10.0) < 0.01

    def test_calculate_percentage_change_zero_base(self):
        '''前月値が0の場合は0を返す'''
        service = DashboardService(Mock())
        assert service._calculate_percentage_change(100, 0) == 0
