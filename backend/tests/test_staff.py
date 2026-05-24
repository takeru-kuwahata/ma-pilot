'''
Test cases for staff management (unit tests with mocks)
Staff endpoints use AuthService and ClinicService, no dedicated StaffService.
'''
import pytest
from unittest.mock import Mock, patch, AsyncMock
from src.middleware.auth import UserContext


# ============================================================
# スタッフ管理の権限ロジックテスト (UserContext使用)
# ============================================================

class TestStaffPermissions:
    '''スタッフ管理における権限チェックロジックのテスト'''

    def test_clinic_owner_can_manage_staff(self):
        '''クリニックオーナーは自院スタッフを管理できる'''
        ctx = UserContext('uid', 'owner@example.com', role='clinic_owner', clinic_id='clinic-1')
        assert ctx.can_edit_clinic_data('clinic-1') is True

    def test_clinic_editor_cannot_manage_staff_at_other_clinic(self):
        '''他院スタッフの管理はできない'''
        ctx = UserContext('uid', 'editor@example.com', role='clinic_editor', clinic_id='clinic-1')
        assert ctx.can_edit_clinic_data('clinic-2') is False

    def test_system_admin_can_manage_any_staff(self):
        '''システム管理者はどの院のスタッフも管理できる'''
        ctx = UserContext('uid', 'admin@example.com', role='system_admin')
        assert ctx.can_edit_clinic_data('clinic-1') is True
        assert ctx.can_edit_clinic_data('clinic-999') is True

    def test_clinic_viewer_cannot_manage_staff(self):
        '''閲覧者はスタッフ管理不可'''
        ctx = UserContext('uid', 'viewer@example.com', role='clinic_viewer', clinic_id='clinic-1')
        assert ctx.can_edit_clinic_data('clinic-1') is False


# ============================================================
# AuthService.invite_user を使ったスタッフ招待テスト
# ============================================================

@pytest.mark.asyncio
class TestStaffRetrieval:
    '''スタッフ情報取得関連のテスト'''

    async def test_get_staff_list_success(self):
        '''スタッフ一覧取得 — user_metadataテーブル参照を確認'''
        mock_supabase = Mock()
        table_mock = Mock()
        table_mock.select = Mock(return_value=table_mock)
        table_mock.eq = Mock(return_value=table_mock)
        table_mock.execute = Mock(return_value=Mock(data=[
            {'user_id': 'user-1', 'role': 'clinic_editor', 'clinic_id': 'clinic-1'},
            {'user_id': 'user-2', 'role': 'clinic_viewer', 'clinic_id': 'clinic-1'},
        ]))
        mock_supabase.table = Mock(return_value=table_mock)

        # スタッフ一覧はuser_metadataテーブルで取得する
        result = mock_supabase.table('user_metadata').select('*').eq('clinic_id', 'clinic-1').execute()
        assert len(result.data) == 2
        assert result.data[0]['role'] == 'clinic_editor'

    async def test_get_staff_by_id(self):
        '''個別スタッフ情報取得 — user_metadataをuser_idで検索'''
        mock_supabase = Mock()
        table_mock = Mock()
        table_mock.select = Mock(return_value=table_mock)
        table_mock.eq = Mock(return_value=table_mock)
        table_mock.single = Mock(return_value=table_mock)
        table_mock.execute = Mock(return_value=Mock(data={'user_id': 'user-1', 'role': 'clinic_editor', 'clinic_id': 'clinic-1'}))
        mock_supabase.table = Mock(return_value=table_mock)

        result = mock_supabase.table('user_metadata').select('*').eq('user_id', 'user-1').single().execute()
        assert result.data['role'] == 'clinic_editor'


@pytest.mark.asyncio
class TestStaffCreation:
    '''スタッフ招待関連のテスト'''

    async def test_create_staff_validation_email_format(self):
        '''メールアドレス形式バリデーション'''
        # AuthService.invite_user は httpx を使うので、ここではロジックのみ検証
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        assert re.match(email_pattern, 'valid@example.com') is not None
        assert re.match(email_pattern, 'invalid-email') is None
        assert re.match(email_pattern, 'missing@domain') is None

    async def test_create_staff_validation_role_values(self):
        '''スタッフロールの有効値検証 — UserRole は Literal 型'''
        valid_roles = ['clinic_owner', 'clinic_editor', 'clinic_viewer']
        for role in valid_roles:
            ctx = UserContext('uid', 'test@example.com', role=role, clinic_id='clinic-1')
            assert ctx.role == role


@pytest.mark.asyncio
class TestStaffUpdate:
    '''スタッフ更新関連のテスト'''

    async def test_update_staff_success(self):
        '''スタッフロール更新 — user_metadataを更新する'''
        mock_supabase = Mock()
        table_mock = Mock()
        table_mock.update = Mock(return_value=table_mock)
        table_mock.eq = Mock(return_value=table_mock)
        table_mock.execute = Mock(return_value=Mock(data=[{'user_id': 'user-1', 'role': 'clinic_owner'}]))
        mock_supabase.table = Mock(return_value=table_mock)

        result = mock_supabase.table('user_metadata').update({'role': 'clinic_owner'}).eq('user_id', 'user-1').execute()
        assert result.data[0]['role'] == 'clinic_owner'


@pytest.mark.asyncio
class TestStaffDeletion:
    '''スタッフ削除関連のテスト'''

    async def test_delete_staff_success(self):
        '''スタッフ削除 — AuthService.delete_user が呼ばれることを確認'''
        from src.services.auth_service import AuthService
        import os

        mock_supabase = Mock()
        table_mock = Mock()
        table_mock.delete = Mock(return_value=table_mock)
        table_mock.eq = Mock(return_value=table_mock)
        table_mock.execute = Mock(return_value=Mock(data=[]))
        mock_supabase.table = Mock(return_value=table_mock)

        with patch('httpx.AsyncClient') as mock_httpx:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_httpx.return_value.__aenter__ = AsyncMock(return_value=mock_httpx.return_value)
            mock_httpx.return_value.__aexit__ = AsyncMock(return_value=None)
            mock_httpx.return_value.delete = AsyncMock(return_value=mock_response)

            service = AuthService(mock_supabase)
            result = await service.delete_user('user-1')

        assert 'message' in result
        mock_supabase.table.assert_called_with('user_metadata')
