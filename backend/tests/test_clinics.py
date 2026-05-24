'''
Test cases for clinic service (unit tests with mocks)
'''
import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from src.services.clinic_service import ClinicService
from src.models.clinic import Clinic, ClinicCreate, ClinicUpdate


SAMPLE_CLINIC_DATA = {
    'id': 'clinic-uuid-001',
    'name': 'テスト歯科医院',
    'slug': 'test-dental',
    'postal_code': '150-0001',
    'address': '東京都渋谷区1-2-3',
    'phone_number': '03-1234-5678',
    'latitude': 35.6595,
    'longitude': 139.7004,
    'owner_id': 'owner-uuid-001',
    'is_active': True,
    'openhouse_status': 'none',
    'created_at': datetime(2025, 1, 1),
    'updated_at': datetime(2025, 1, 1),
}


@pytest.fixture
def mock_supabase_clinics():
    '''クリニック用Supabaseモック'''
    mock = Mock()
    table_mock = Mock()
    table_mock.select = Mock(return_value=table_mock)
    table_mock.insert = Mock(return_value=table_mock)
    table_mock.update = Mock(return_value=table_mock)
    table_mock.delete = Mock(return_value=table_mock)
    table_mock.eq = Mock(return_value=table_mock)
    table_mock.neq = Mock(return_value=table_mock)
    table_mock.single = Mock(return_value=table_mock)
    table_mock.execute = Mock(return_value=Mock(data=SAMPLE_CLINIC_DATA))
    mock.table = Mock(return_value=table_mock)
    return mock, table_mock


@pytest.mark.asyncio
class TestClinicRetrieval:
    '''医院情報取得関連のテスト'''

    async def test_get_clinic_by_uuid_success(self, mock_supabase_clinics):
        '''UUIDで医院情報取得成功'''
        mock, table_mock = mock_supabase_clinics
        service = ClinicService(mock)
        clinic = await service.get_clinic('clinic-uuid-001-12345678-90ab')

        assert clinic.name == 'テスト歯科医院'
        assert clinic.postal_code == '150-0001'

    async def test_get_clinic_by_slug_success(self, mock_supabase_clinics):
        '''スラッグで医院情報取得成功'''
        mock, table_mock = mock_supabase_clinics
        service = ClinicService(mock)
        clinic = await service.get_clinic('test-dental')

        assert clinic.name == 'テスト歯科医院'

    async def test_get_clinic_not_found(self, mock_supabase_clinics):
        '''存在しない医院取得はValueError'''
        mock, table_mock = mock_supabase_clinics
        table_mock.execute.return_value = Mock(data=None)
        service = ClinicService(mock)

        with pytest.raises(ValueError, match='Failed to get clinic'):
            await service.get_clinic('nonexistent-slug')

    async def test_get_clinic_db_error(self, mock_supabase_clinics):
        '''DB エラー時は ValueError'''
        mock, table_mock = mock_supabase_clinics
        table_mock.execute.side_effect = Exception('Connection error')
        service = ClinicService(mock)

        with pytest.raises(ValueError):
            await service.get_clinic('test-dental')


@pytest.mark.asyncio
class TestClinicCreation:
    '''医院作成関連のテスト'''

    async def test_create_clinic_success(self, mock_supabase_clinics):
        '''医院作成成功'''
        mock, table_mock = mock_supabase_clinics
        table_mock.execute.return_value = Mock(data=[SAMPLE_CLINIC_DATA])
        service = ClinicService(mock)

        clinic_create = ClinicCreate(
            name='テスト歯科医院',
            postal_code='150-0001',
            address='東京都渋谷区1-2-3',
            phone_number='03-1234-5678',
        )
        # ジオコーダーをモック
        with patch.object(service, '_geocode_address', return_value=None):
            clinic = await service.create_clinic(clinic_create)

        assert clinic.name == 'テスト歯科医院'

    async def test_create_clinic_empty_response(self, mock_supabase_clinics):
        '''DBが空を返す場合はエラー'''
        mock, table_mock = mock_supabase_clinics
        table_mock.execute.return_value = Mock(data=[])
        service = ClinicService(mock)

        clinic_create = ClinicCreate(
            name='テスト歯科医院',
            postal_code='150-0001',
            address='東京都渋谷区1-2-3',
            phone_number='03-1234-5678',
        )
        with patch.object(service, '_geocode_address', return_value=None):
            with pytest.raises(ValueError, match='Failed to create clinic'):
                await service.create_clinic(clinic_create)

    async def test_create_clinic_duplicate_slug(self, mock_supabase_clinics):
        '''重複slugは ValueError'''
        mock, table_mock = mock_supabase_clinics
        # スラッグ重複チェックが存在を返す
        table_mock.execute.return_value = Mock(data=[{'id': 'existing-id'}])
        service = ClinicService(mock)

        clinic_create = ClinicCreate(
            name='テスト歯科医院',
            slug='existing-slug',
            postal_code='150-0001',
            address='東京都渋谷区1-2-3',
            phone_number='03-1234-5678',
        )
        with patch.object(service, '_geocode_address', return_value=None):
            with pytest.raises(ValueError, match='slug'):
                await service.create_clinic(clinic_create)


@pytest.mark.asyncio
class TestClinicUpdate:
    '''医院情報更新関連のテスト'''

    async def test_update_clinic_success(self, mock_supabase_clinics):
        '''医院情報更新成功'''
        mock, table_mock = mock_supabase_clinics
        updated_data = {**SAMPLE_CLINIC_DATA, 'name': '更新後歯科医院'}
        # update()用のexecute (戻り値不要) → get_clinic()用のexecute (updated_dataを返す)
        table_mock.execute.side_effect = [
            Mock(data=None),       # update() の execute
            Mock(data=updated_data),  # 再取得の get_clinic() の execute
        ]
        service = ClinicService(mock)

        update = ClinicUpdate(name='更新後歯科医院')
        with patch.object(service, '_geocode_address', return_value=None):
            clinic = await service.update_clinic('clinic-uuid-001-12345678-90ab', update)

        assert clinic.name == '更新後歯科医院'

    async def test_update_clinic_no_data(self, mock_supabase_clinics):
        '''更新データなしはエラー'''
        mock, table_mock = mock_supabase_clinics
        service = ClinicService(mock)

        update = ClinicUpdate()  # 全フィールド None
        with pytest.raises(ValueError, match='No data to update'):
            await service.update_clinic('clinic-uuid-001', update)
