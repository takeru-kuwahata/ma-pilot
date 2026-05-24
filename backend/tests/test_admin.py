'''
Test cases for admin functionality (unit tests with mocks)
Admin endpoints use ClinicService + UserContext for access control.
'''
import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from src.middleware.auth import UserContext
from src.services.clinic_service import ClinicService


def _make_fresh_clinic_mock():
    '''テストごとに完全独立したモックを返すファクトリ関数'''
    mock = Mock()
    table_mock = Mock()
    table_mock.select = Mock(return_value=table_mock)
    table_mock.update = Mock(return_value=table_mock)
    table_mock.delete = Mock(return_value=table_mock)
    table_mock.eq = Mock(return_value=table_mock)
    table_mock.single = Mock(return_value=table_mock)
    table_mock.execute = Mock(return_value=Mock(data=[]))
    mock.table = Mock(return_value=table_mock)
    return mock, table_mock


CLINIC_UUID_1 = 'aabbccdd-0001-0001-0001-aabbccdd0001'
CLINIC_UUID_2 = 'aabbccdd-0002-0002-0002-aabbccdd0002'

SAMPLE_CLINIC_LIST = [
    {
        'id': CLINIC_UUID_1,
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
    },
    {
        'id': CLINIC_UUID_2,
        'name': '第二歯科医院',
        'slug': 'second-dental',
        'postal_code': '160-0001',
        'address': '東京都新宿区1-1-1',
        'phone_number': '03-9876-5432',
        'latitude': 35.6895,
        'longitude': 139.6917,
        'owner_id': 'owner-uuid-002',
        'is_active': False,
        'openhouse_status': 'none',
        'created_at': datetime(2025, 2, 1),
        'updated_at': datetime(2025, 2, 1),
    },
]


@pytest.fixture
def mock_supabase_admin():
    '''管理者用Supabaseモック'''
    mock = Mock()
    table_mock = Mock()
    table_mock.select = Mock(return_value=table_mock)
    table_mock.update = Mock(return_value=table_mock)
    table_mock.eq = Mock(return_value=table_mock)
    table_mock.execute = Mock(return_value=Mock(data=SAMPLE_CLINIC_LIST))
    mock.table = Mock(return_value=table_mock)
    return mock, table_mock


class TestAdminDashboard:
    '''管理者ダッシュボード権限チェックのテスト'''

    def test_system_admin_can_access_dashboard(self):
        '''system_adminは管理者ダッシュボードにアクセスできる'''
        ctx = UserContext('uid', 'admin@example.com', role='system_admin')
        assert ctx.is_system_admin() is True

    def test_clinic_owner_cannot_access_admin_dashboard(self):
        '''clinic_ownerは管理者ダッシュボードにアクセスできない'''
        ctx = UserContext('uid', 'owner@example.com', role='clinic_owner', clinic_id='clinic-1')
        assert ctx.is_system_admin() is False

    def test_get_admin_dashboard_unauthorized_role(self):
        '''クリニック系ロールはシステム管理者ではない'''
        for role in ['clinic_owner', 'clinic_editor', 'clinic_viewer']:
            ctx = UserContext('uid', f'{role}@example.com', role=role, clinic_id='clinic-1')
            assert ctx.is_system_admin() is False


@pytest.mark.asyncio
class TestAdminClinicManagement:
    '''管理者医院管理関連のテスト'''

    async def test_admin_get_all_clinics(self, mock_supabase_admin):
        '''全医院一覧取得（is_activeフィルタなし）'''
        mock, _ = mock_supabase_admin
        service = ClinicService(mock)
        clinics = await service.list_clinics()

        assert len(clinics) == 2

    async def test_admin_get_active_clinics(self, mock_supabase_admin):
        '''アクティブ医院のみ取得'''
        mock, table_mock = mock_supabase_admin
        active_only = [c for c in SAMPLE_CLINIC_LIST if c['is_active']]
        table_mock.execute.return_value = Mock(data=active_only)
        service = ClinicService(mock)
        clinics = await service.list_clinics(is_active=True)

        assert len(clinics) == 1
        assert clinics[0].is_active is True

    async def test_admin_activate_clinic(self):
        '''医院アクティベート — activate_clinic を呼ぶ'''
        mock, table_mock = _make_fresh_clinic_mock()
        activated_data = {**SAMPLE_CLINIC_LIST[1], 'is_active': True}
        table_mock.execute.side_effect = [
            Mock(data=None),           # update() の execute
            Mock(data=activated_data), # get_clinic() の execute
        ]
        service = ClinicService(mock)
        clinic = await service.activate_clinic(CLINIC_UUID_2)

        assert clinic.is_active is True

    async def test_admin_deactivate_clinic(self):
        '''医院非アクティベート — deactivate_clinic を呼ぶ'''
        mock, table_mock = _make_fresh_clinic_mock()
        deactivated_data = {**SAMPLE_CLINIC_LIST[0], 'is_active': False}
        table_mock.execute.side_effect = [
            Mock(data=None),              # update() の execute
            Mock(data=deactivated_data),  # get_clinic() の execute
        ]
        service = ClinicService(mock)
        clinic = await service.deactivate_clinic(CLINIC_UUID_1)

        assert clinic.is_active is False


class TestAdminSystemSettings:
    '''管理者システム設定関連のテスト（権限チェックのみ）'''

    def test_get_system_settings_requires_admin(self):
        '''システム設定はsystem_adminのみアクセス可能'''
        admin_ctx = UserContext('uid', 'admin@example.com', role='system_admin')
        viewer_ctx = UserContext('uid', 'viewer@example.com', role='clinic_viewer', clinic_id='c1')

        assert admin_ctx.is_system_admin() is True
        assert viewer_ctx.is_system_admin() is False

    def test_update_system_settings_requires_admin(self):
        '''システム設定更新もsystem_adminのみ'''
        admin_ctx = UserContext('uid', 'admin@example.com', role='system_admin')
        owner_ctx = UserContext('uid', 'owner@example.com', role='clinic_owner', clinic_id='c1')

        assert admin_ctx.is_system_admin() is True
        assert owner_ctx.is_system_admin() is False
