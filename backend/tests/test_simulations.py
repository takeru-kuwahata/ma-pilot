'''
Test cases for simulation service (unit tests with mocks)
'''
import pytest
from unittest.mock import Mock
from datetime import datetime
from src.services.simulation_service import SimulationService
from src.models.simulation import SimulationInput, SimulationCreate, SimulationResult


SAMPLE_INPUT = SimulationInput(
    target_revenue=5000000,
    target_profit=1000000,
    assumed_average_revenue_per_patient=16000,
    assumed_personnel_cost_rate=40.0,
    assumed_material_cost_rate=10.0,
    assumed_fixed_cost=500000,
)

SAMPLE_RESULT = SimulationResult(
    required_patients=313,
    required_treatments=376,
    estimated_revenue=5000000,
    estimated_profit=1000000,
    profit_margin=20.0,
    strategies=['Acquire 313 patients per month'],
)

SAMPLE_SIMULATION_DB_ROW = {
    'id': 'sim-uuid-001',
    'clinic_id': 'clinic-uuid-001',
    'title': 'テストシミュレーション',
    'input': {
        'target_revenue': 5000000,
        'target_profit': 1000000,
        'assumed_average_revenue_per_patient': 16000,
        'assumed_personnel_cost_rate': 40.0,
        'assumed_material_cost_rate': 10.0,
        'assumed_fixed_cost': 500000,
    },
    'result': {
        'required_patients': 313,
        'required_treatments': 376,
        'estimated_revenue': 5000000,
        'estimated_profit': 1000000,
        'profit_margin': 20.0,
        'strategies': ['Acquire 313 patients per month'],
    },
    'created_at': datetime(2025, 3, 1),
    'updated_at': datetime(2025, 3, 1),
}


@pytest.fixture
def mock_supabase_simulations():
    '''シミュレーション用Supabaseモック'''
    mock = Mock()
    table_mock = Mock()
    table_mock.select = Mock(return_value=table_mock)
    table_mock.insert = Mock(return_value=table_mock)
    table_mock.update = Mock(return_value=table_mock)
    table_mock.delete = Mock(return_value=table_mock)
    table_mock.eq = Mock(return_value=table_mock)
    table_mock.single = Mock(return_value=table_mock)
    table_mock.order = Mock(return_value=table_mock)
    table_mock.execute = Mock(return_value=Mock(data=[SAMPLE_SIMULATION_DB_ROW]))
    mock.table = Mock(return_value=table_mock)
    return mock, table_mock


@pytest.mark.asyncio
class TestSimulationRetrieval:
    '''シミュレーション取得関連のテスト'''

    async def test_get_simulations_success(self, mock_supabase_simulations):
        '''シミュレーション一覧取得成功'''
        mock, _ = mock_supabase_simulations
        service = SimulationService(mock)
        result = await service.get_simulations('clinic-uuid-001')

        assert len(result) == 1
        assert result[0].title == 'テストシミュレーション'

    async def test_get_simulation(self, mock_supabase_simulations):
        '''個別シミュレーション取得成功'''
        mock, table_mock = mock_supabase_simulations
        table_mock.execute.return_value = Mock(data=SAMPLE_SIMULATION_DB_ROW)
        service = SimulationService(mock)
        result = await service.get_simulation('sim-uuid-001')

        assert result.id == 'sim-uuid-001'

    async def test_get_simulation_not_found(self, mock_supabase_simulations):
        '''存在しないIDはValueError'''
        mock, table_mock = mock_supabase_simulations
        table_mock.execute.return_value = Mock(data=None)
        service = SimulationService(mock)

        with pytest.raises(ValueError):
            await service.get_simulation('nonexistent-id')


@pytest.mark.asyncio
class TestSimulationCreation:
    '''シミュレーション作成関連のテスト'''

    async def test_create_simulation_with_precomputed_result(self, mock_supabase_simulations):
        '''フロントエンドで計算済みの結果をそのまま保存'''
        mock, table_mock = mock_supabase_simulations
        table_mock.execute.return_value = Mock(data=[SAMPLE_SIMULATION_DB_ROW])
        service = SimulationService(mock)

        create = SimulationCreate(
            clinic_id='clinic-uuid-001',
            title='テストシミュレーション',
            input=SAMPLE_INPUT,
            result=SAMPLE_RESULT,
        )
        simulation = await service.create_simulation(create)

        assert simulation.title == 'テストシミュレーション'

    async def test_create_simulation_backend_calculation(self, mock_supabase_simulations):
        '''result未指定時はバックエンドで計算してから保存'''
        mock, table_mock = mock_supabase_simulations
        table_mock.execute.return_value = Mock(data=[SAMPLE_SIMULATION_DB_ROW])
        service = SimulationService(mock)

        create = SimulationCreate(
            clinic_id='clinic-uuid-001',
            title='テストシミュレーション',
            input=SAMPLE_INPUT,
            result=None,
        )
        simulation = await service.create_simulation(create)
        assert simulation.title == 'テストシミュレーション'


class TestSimulationCalculation:
    '''シミュレーション計算ロジックのテスト（同期・依存なし）'''

    def test_calculate_simulation_basic(self):
        '''基本的なシミュレーション計算'''
        service = SimulationService(Mock())
        result = service._calculate_simulation(SAMPLE_INPUT)

        assert result.required_patients > 0
        assert result.required_treatments >= result.required_patients
        assert len(result.strategies) > 0

    def test_calculate_simulation_required_patients(self):
        '''必要患者数の計算（目標売上 / 患者単価の切り上げ）'''
        import math
        service = SimulationService(Mock())
        input_data = SimulationInput(
            target_revenue=1000000,
            target_profit=100000,
            assumed_average_revenue_per_patient=10000,
            assumed_personnel_cost_rate=40.0,
            assumed_material_cost_rate=10.0,
            assumed_fixed_cost=100000,
        )
        result = service._calculate_simulation(input_data)
        expected = math.ceil(1000000 / 10000)
        assert result.required_patients == expected

    def test_calculate_simulation_zero_avg_revenue_raises(self):
        '''患者単価0はValueError'''
        service = SimulationService(Mock())
        input_data = SimulationInput(
            target_revenue=1000000,
            target_profit=100000,
            assumed_average_revenue_per_patient=0,
            assumed_personnel_cost_rate=40.0,
            assumed_material_cost_rate=10.0,
            assumed_fixed_cost=100000,
        )
        with pytest.raises(ValueError, match='患者単価'):
            service._calculate_simulation(input_data)

    def test_calculate_simulation_high_personnel_cost_strategy(self):
        '''人件費率50%超でコスト最適化アドバイスが含まれる'''
        service = SimulationService(Mock())
        input_data = SimulationInput(
            target_revenue=1000000,
            target_profit=100000,
            assumed_average_revenue_per_patient=10000,
            assumed_personnel_cost_rate=60.0,  # 50%超
            assumed_material_cost_rate=10.0,
            assumed_fixed_cost=0,
        )
        result = service._calculate_simulation(input_data)
        assert any('personnel' in s.lower() for s in result.strategies)
