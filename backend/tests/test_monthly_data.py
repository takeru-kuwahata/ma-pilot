'''
Test cases for monthly data service (unit tests with mocks)
'''
import pytest
from unittest.mock import Mock
from datetime import datetime
from src.services.monthly_data_service import MonthlyDataService
from src.models.monthly_data import MonthlyDataCreate, MonthlyDataUpdate


SAMPLE_MONTHLY_DATA = {
    'id': 'monthly-data-uuid-001',
    'clinic_id': 'clinic-uuid-001',
    'year_month': '2025-03',
    'total_revenue': 5000000.0,
    'insurance_revenue': 3900000.0,
    'self_pay_revenue': 1000000.0,
    'retail_revenue': 100000.0,
    'variable_cost': 500000.0,
    'fixed_cost': 300000.0,
    'first_visit_patients': 30,
    're_first_visit_patients': 20,
    'returning_patients': 240,
    'other_patients': 10,
    'total_patients': 300,
    'treatment_count': 600,
    'average_revenue_per_patient': 16667.0,
    'created_at': datetime(2025, 3, 31),
    'updated_at': datetime(2025, 3, 31),
}


@pytest.fixture
def mock_supabase_monthly():
    '''月次データ用Supabaseモック'''
    mock = Mock()
    table_mock = Mock()
    table_mock.select = Mock(return_value=table_mock)
    table_mock.insert = Mock(return_value=table_mock)
    table_mock.update = Mock(return_value=table_mock)
    table_mock.delete = Mock(return_value=table_mock)
    table_mock.eq = Mock(return_value=table_mock)
    table_mock.single = Mock(return_value=table_mock)
    table_mock.order = Mock(return_value=table_mock)
    table_mock.execute = Mock(return_value=Mock(data=[SAMPLE_MONTHLY_DATA]))
    mock.table = Mock(return_value=table_mock)
    return mock, table_mock


@pytest.mark.asyncio
class TestMonthlyDataRetrieval:
    '''月次データ取得関連のテスト'''

    async def test_get_monthly_data_success(self, mock_supabase_monthly):
        '''月次データ一覧取得成功'''
        mock, _ = mock_supabase_monthly
        service = MonthlyDataService(mock)
        result = await service.get_monthly_data('clinic-uuid-001')

        assert len(result) == 1
        assert result[0].year_month == '2025-03'
        assert result[0].total_revenue == 5000000.0

    async def test_get_monthly_data_with_year_month_filter(self, mock_supabase_monthly):
        '''年月フィルタ付き取得'''
        mock, table_mock = mock_supabase_monthly
        service = MonthlyDataService(mock)
        result = await service.get_monthly_data('clinic-uuid-001', '2025-03')

        # year_month フィルタのためにeqが追加されるはず
        assert len(result) == 1

    async def test_get_monthly_data_empty(self, mock_supabase_monthly):
        '''データなしの場合は空リスト'''
        mock, table_mock = mock_supabase_monthly
        table_mock.execute.return_value = Mock(data=[])
        service = MonthlyDataService(mock)
        result = await service.get_monthly_data('clinic-uuid-001')

        assert result == []

    async def test_get_monthly_data_db_error(self, mock_supabase_monthly):
        '''DB エラー時は ValueError'''
        mock, table_mock = mock_supabase_monthly
        table_mock.execute.side_effect = Exception('DB error')
        service = MonthlyDataService(mock)

        with pytest.raises(ValueError, match='Failed to get monthly data'):
            await service.get_monthly_data('clinic-uuid-001')


@pytest.mark.asyncio
class TestMonthlyDataCreation:
    '''月次データ作成関連のテスト'''

    async def test_create_monthly_data_success(self, mock_supabase_monthly):
        '''月次データ作成成功'''
        mock, table_mock = mock_supabase_monthly
        table_mock.execute.return_value = Mock(data=[SAMPLE_MONTHLY_DATA])
        service = MonthlyDataService(mock)

        create = MonthlyDataCreate(
            clinic_id='clinic-uuid-001',
            year_month='2025-03',
            insurance_revenue=4000000.0,
            self_pay_revenue=1000000.0,
            treatment_count=600,
        )
        result = await service.create_monthly_data(create)

        assert result.year_month == '2025-03'
        assert result.total_revenue == 5000000.0

    async def test_create_monthly_data_calculates_totals(self):
        '''合計値が正しく計算される（総売上 = 保険 + 自費 + 物販）'''
        service = MonthlyDataService(Mock())
        data = {
            'insurance_revenue': 3000000,
            'self_pay_revenue': 1000000,
            'retail_revenue': 100000,
            'first_visit_patients': 10,
            're_first_visit_patients': 5,
            'returning_patients': 200,
            'other_patients': 5,
        }
        result = service._calculate_totals(data)

        assert result['total_revenue'] == 4100000
        assert result['total_patients'] == 220
        assert abs(result['average_revenue_per_patient'] - 4100000 / 220) < 1

    async def test_calculate_totals_without_retail(self):
        '''物販なしでも総売上が計算できる'''
        service = MonthlyDataService(Mock())
        data = {
            'insurance_revenue': 3000000,
            'self_pay_revenue': 1000000,
            'first_visit_patients': 0,
            're_first_visit_patients': 0,
            'returning_patients': 0,
            'other_patients': 0,
        }
        result = service._calculate_totals(data)

        assert result['total_revenue'] == 4000000

    async def test_create_monthly_data_zero_patients(self):
        '''患者数0の場合、average_revenue_per_patientは0'''
        service = MonthlyDataService(Mock())
        data = {
            'insurance_revenue': 1000000,
            'self_pay_revenue': 0,
            'first_visit_patients': 0,
            're_first_visit_patients': 0,
            'returning_patients': 0,
            'other_patients': 0,
        }
        result = service._calculate_totals(data)

        assert result['average_revenue_per_patient'] == 0

    async def test_create_monthly_data_empty_response(self, mock_supabase_monthly):
        '''DBが空を返す場合はエラー'''
        mock, table_mock = mock_supabase_monthly
        table_mock.execute.return_value = Mock(data=[])
        service = MonthlyDataService(mock)

        create = MonthlyDataCreate(
            clinic_id='clinic-uuid-001',
            year_month='2025-03',
            insurance_revenue=4000000.0,
            self_pay_revenue=1000000.0,
        )
        with pytest.raises(ValueError):
            await service.create_monthly_data(create)


@pytest.mark.asyncio
class TestMonthlyDataUpdate:
    '''月次データ更新関連のテスト'''

    async def test_update_monthly_data_no_fields(self, mock_supabase_monthly):
        '''更新フィールドなしは ValueError'''
        mock, _ = mock_supabase_monthly
        service = MonthlyDataService(mock)

        update = MonthlyDataUpdate()
        with pytest.raises(ValueError, match='No data to update'):
            await service.update_monthly_data('monthly-data-uuid-001', update)


@pytest.mark.asyncio
class TestCsvImport:
    '''CSV取込のフィールドマッピングテスト（要件: 物販=収入、変動費=コスト）'''

    CSV_CONTENT = (
        '年月(YYYY-MM),保険診療収入,自費診療収入,物販（その他）,変動費,固定費,'
        '初診患者数,再初診患者数,再診患者数,その他患者数\n'
        '2026年7月,3927280,4252040,134160,1500000,5000000,67,30,477,107\n'
    )

    async def test_import_csv_maps_retail_and_variable_cost(self, mock_supabase_monthly):
        '''物販→retail_revenue、変動費→variable_costに取り込まれる'''
        mock, table_mock = mock_supabase_monthly
        # 既存レコードなし → insert経路
        table_mock.execute.return_value = Mock(data=[])
        service = MonthlyDataService(mock)

        result = await service.import_csv('clinic-uuid-001', self.CSV_CONTENT)

        assert result.success == 1
        assert result.failed == 0, f'errors: {result.errors}'
        inserted = table_mock.insert.call_args[0][0]
        assert inserted['year_month'] == '2026-07'
        assert inserted['retail_revenue'] == 134160
        assert inserted['variable_cost'] == 1500000
        assert inserted['fixed_cost'] == 5000000
        # 総売上 = 保険 + 自費 + 物販
        assert inserted['total_revenue'] == 3927280 + 4252040 + 134160

    async def test_import_csv_accepts_plain_yearmonth_header(self, mock_supabase_monthly):
        '''エクスポートCSVのヘッダー「年月」でも取り込める（再取込互換）'''
        mock, table_mock = mock_supabase_monthly
        table_mock.execute.return_value = Mock(data=[])
        service = MonthlyDataService(mock)

        csv_content = (
            '年月,保険診療収入,自費診療収入,物販（その他）,変動費,固定費,'
            '初診患者数,再初診患者数,再診患者数,その他患者数,総売上,営業利益\n'
            '2026-07,1000000,500000,50000,200000,800000,10,5,100,3,1550000,550000\n'
        )
        result = await service.import_csv('clinic-uuid-001', csv_content)

        assert result.success == 1
        assert result.failed == 0, f'errors: {result.errors}'
        inserted = table_mock.insert.call_args[0][0]
        assert inserted['year_month'] == '2026-07'
        # 総売上・営業利益列は取込では無視され、サーバー側で再計算される
        assert inserted['total_revenue'] == 1550000


@pytest.mark.asyncio
class TestMonthlyDataDeletion:
    '''月次データ削除関連のテスト'''

    async def test_delete_monthly_data_success(self, mock_supabase_monthly):
        '''月次データ削除成功'''
        mock, table_mock = mock_supabase_monthly
        table_mock.execute.return_value = Mock(data=[SAMPLE_MONTHLY_DATA])
        service = MonthlyDataService(mock)

        result = await service.delete_monthly_data('monthly-data-uuid-001')
        assert 'message' in result
