'''
Test cases for authentication service (unit tests with mocks)
'''
import pytest
from unittest.mock import Mock, AsyncMock
from src.services.auth_service import AuthService
from src.middleware.auth import UserContext


# ============================================================
# UserContext ユニットテスト (依存なし、即実行)
# ============================================================

class TestUserContext:
    '''UserContextの権限チェックロジックのテスト'''

    def test_system_admin_is_system_admin(self):
        ctx = UserContext('uid', 'test@example.com', role='system_admin')
        assert ctx.is_system_admin() is True
        assert ctx.is_clinic_owner() is False

    def test_clinic_owner_is_clinic_owner(self):
        ctx = UserContext('uid', 'test@example.com', role='clinic_owner', clinic_id='clinic-1')
        assert ctx.is_clinic_owner() is True
        assert ctx.is_system_admin() is False

    def test_clinic_editor_is_clinic_editor(self):
        ctx = UserContext('uid', 'test@example.com', role='clinic_editor', clinic_id='clinic-1')
        assert ctx.is_clinic_editor() is True
        assert ctx.is_clinic_owner() is False

    def test_clinic_viewer_is_clinic_viewer(self):
        ctx = UserContext('uid', 'test@example.com', role='clinic_viewer', clinic_id='clinic-1')
        assert ctx.is_clinic_viewer() is True
        assert ctx.is_clinic_editor() is False

    def test_system_admin_has_access_to_any_clinic(self):
        ctx = UserContext('uid', 'admin@example.com', role='system_admin')
        assert ctx.has_clinic_access('any-clinic-id') is True

    def test_clinic_owner_has_access_to_own_clinic(self):
        ctx = UserContext('uid', 'owner@example.com', role='clinic_owner', clinic_id='clinic-1')
        assert ctx.has_clinic_access('clinic-1') is True

    def test_clinic_owner_no_access_to_other_clinic(self):
        ctx = UserContext('uid', 'owner@example.com', role='clinic_owner', clinic_id='clinic-1')
        assert ctx.has_clinic_access('clinic-2') is False

    def test_system_admin_can_edit_any_clinic(self):
        ctx = UserContext('uid', 'admin@example.com', role='system_admin')
        assert ctx.can_edit_clinic_data('any-clinic-id') is True

    def test_clinic_owner_can_edit_own_clinic(self):
        ctx = UserContext('uid', 'owner@example.com', role='clinic_owner', clinic_id='clinic-1')
        assert ctx.can_edit_clinic_data('clinic-1') is True

    def test_clinic_editor_can_edit_own_clinic(self):
        ctx = UserContext('uid', 'editor@example.com', role='clinic_editor', clinic_id='clinic-1')
        assert ctx.can_edit_clinic_data('clinic-1') is True

    def test_clinic_viewer_cannot_edit(self):
        ctx = UserContext('uid', 'viewer@example.com', role='clinic_viewer', clinic_id='clinic-1')
        assert ctx.can_edit_clinic_data('clinic-1') is False

    def test_clinic_owner_cannot_edit_other_clinic(self):
        ctx = UserContext('uid', 'owner@example.com', role='clinic_owner', clinic_id='clinic-1')
        assert ctx.can_edit_clinic_data('clinic-2') is False


# ============================================================
# AuthService ユニットテスト (Supabase モック)
# ============================================================

@pytest.fixture
def mock_supabase_auth():
    '''Supabaseクライアントのモック（認証用）'''
    mock = Mock()
    # table チェーンの設定
    table_mock = Mock()
    table_mock.select = Mock(return_value=table_mock)
    table_mock.insert = Mock(return_value=table_mock)
    table_mock.update = Mock(return_value=table_mock)
    table_mock.delete = Mock(return_value=table_mock)
    table_mock.eq = Mock(return_value=table_mock)
    table_mock.single = Mock(return_value=table_mock)
    from datetime import datetime
    table_mock.execute = Mock(return_value=Mock(data={
        'role': 'clinic_owner',
        'clinic_id': 'clinic-1',
        'created_at': datetime(2025, 1, 1).isoformat(),
        'updated_at': datetime(2025, 1, 1).isoformat(),
    }))
    mock.table = Mock(return_value=table_mock)

    # auth モック
    mock_user = Mock()
    mock_user.id = 'user-123'
    mock_user.email = 'test@example.com'
    mock_user.user_metadata = {'display_name': 'テストユーザー'}

    mock_session = Mock()
    mock_session.access_token = 'test-access-token'
    mock_session.refresh_token = 'test-refresh-token'
    mock_session.expires_at = 1700003600

    mock_auth_response = Mock()
    mock_auth_response.user = mock_user
    mock_auth_response.session = mock_session

    mock.auth = Mock()
    mock.auth.sign_in_with_password = Mock(return_value=mock_auth_response)
    mock.auth.sign_out = Mock(return_value=None)
    mock.auth.reset_password_for_email = Mock(return_value=None)
    mock.auth.get_user = Mock(return_value=mock_auth_response)

    return mock


@pytest.mark.asyncio
class TestLogin:
    '''ログイン関連のテスト'''

    async def test_login_success(self, mock_supabase_auth):
        '''正常なログイン'''
        service = AuthService(mock_supabase_auth)
        result = await service.login('test@example.com', 'password123')

        assert 'access_token' in result
        assert result['access_token'] == 'test-access-token'
        assert result['refresh_token'] == 'test-refresh-token'
        assert result['expires_at'] == 1700003600
        assert result['token_type'] == 'bearer'
        assert result['user'].email == 'test@example.com'

    async def test_login_invalid_credentials(self, mock_supabase_auth):
        '''無効な認証情報でのログイン失敗'''
        mock_supabase_auth.auth.sign_in_with_password.side_effect = Exception('Invalid credentials')
        service = AuthService(mock_supabase_auth)

        with pytest.raises(ValueError, match='Login failed'):
            await service.login('wrong@example.com', 'wrongpassword')

    async def test_login_no_user_returned(self, mock_supabase_auth):
        '''ユーザー情報が返されない場合のログイン失敗'''
        mock_response = Mock()
        mock_response.user = None
        mock_response.session = None
        mock_supabase_auth.auth.sign_in_with_password.return_value = mock_response

        service = AuthService(mock_supabase_auth)
        with pytest.raises(ValueError, match='Login failed'):
            await service.login('test@example.com', 'password123')


@pytest.mark.asyncio
class TestRefresh:
    '''トークンリフレッシュのテスト（Supabase Auth RESTをモック）'''

    def _mock_httpx_client(self, status_code: int, json_data: dict):
        '''httpx.AsyncClientのasync context managerモックを作る'''
        mock_response = Mock()
        mock_response.status_code = status_code
        mock_response.json = Mock(return_value=json_data)

        mock_client = Mock()
        mock_client.post = AsyncMock(return_value=mock_response)

        mock_ctx = Mock()
        mock_ctx.__aenter__ = AsyncMock(return_value=mock_client)
        mock_ctx.__aexit__ = AsyncMock(return_value=False)
        return mock_ctx, mock_client

    async def test_refresh_success(self, mock_supabase_auth, monkeypatch):
        '''有効なrefresh_tokenで新しいトークン一式が返る'''
        mock_ctx, mock_client = self._mock_httpx_client(200, {
            'access_token': 'new-access-token',
            'refresh_token': 'new-refresh-token',
            'expires_at': 1700007200,
        })
        monkeypatch.setattr('src.services.auth_service.httpx.AsyncClient', Mock(return_value=mock_ctx))

        service = AuthService(mock_supabase_auth)
        result = await service.refresh('old-refresh-token')

        assert result['access_token'] == 'new-access-token'
        assert result['refresh_token'] == 'new-refresh-token'
        assert result['expires_at'] == 1700007200
        assert result['token_type'] == 'bearer'
        # Supabase Auth RESTにrefresh_tokenが渡っていること
        assert mock_client.post.call_args.kwargs['json'] == {'refresh_token': 'old-refresh-token'}

    async def test_refresh_computes_expires_at_from_expires_in(self, mock_supabase_auth, monkeypatch):
        '''expires_atを返さない旧GoTrueではexpires_inから算出する'''
        mock_ctx, _ = self._mock_httpx_client(200, {
            'access_token': 'new-access-token',
            'refresh_token': 'new-refresh-token',
            'expires_in': 3600,
        })
        monkeypatch.setattr('src.services.auth_service.httpx.AsyncClient', Mock(return_value=mock_ctx))
        monkeypatch.setattr('src.services.auth_service.time.time', lambda: 1700000000)

        service = AuthService(mock_supabase_auth)
        result = await service.refresh('old-refresh-token')

        assert result['expires_at'] == 1700003600

    async def test_refresh_invalid_token(self, mock_supabase_auth, monkeypatch):
        '''無効なrefresh_tokenはValueError'''
        mock_ctx, _ = self._mock_httpx_client(400, {'error': 'invalid_grant'})
        monkeypatch.setattr('src.services.auth_service.httpx.AsyncClient', Mock(return_value=mock_ctx))

        service = AuthService(mock_supabase_auth)
        with pytest.raises(ValueError, match='Invalid refresh token'):
            await service.refresh('bad-refresh-token')

    async def test_refresh_network_error(self, mock_supabase_auth, monkeypatch):
        '''Supabase到達不能時はValueError'''
        mock_ctx = Mock()
        mock_ctx.__aenter__ = AsyncMock(side_effect=Exception('connection refused'))
        mock_ctx.__aexit__ = AsyncMock(return_value=False)
        monkeypatch.setattr('src.services.auth_service.httpx.AsyncClient', Mock(return_value=mock_ctx))

        service = AuthService(mock_supabase_auth)
        with pytest.raises(ValueError, match='Token refresh failed'):
            await service.refresh('any-token')


@pytest.mark.asyncio
class TestLogout:
    '''ログアウト関連のテスト'''

    async def test_logout_success(self, mock_supabase_auth):
        '''正常なログアウト'''
        service = AuthService(mock_supabase_auth)
        result = await service.logout('test-access-token')

        assert 'message' in result
        mock_supabase_auth.auth.sign_out.assert_called_once()


@pytest.mark.asyncio
class TestPasswordReset:
    '''パスワードリセット関連のテスト'''

    async def test_password_reset_request(self, mock_supabase_auth):
        '''パスワードリセットリクエストの送信'''
        service = AuthService(mock_supabase_auth)
        result = await service.reset_password('test@example.com')

        assert 'message' in result
        mock_supabase_auth.auth.reset_password_for_email.assert_called_once_with('test@example.com')

    async def test_password_reset_failure(self, mock_supabase_auth):
        '''パスワードリセット失敗時のエラー'''
        mock_supabase_auth.auth.reset_password_for_email.side_effect = Exception('Email not found')
        service = AuthService(mock_supabase_auth)

        with pytest.raises(ValueError, match='Password reset failed'):
            await service.reset_password('nonexistent@example.com')


@pytest.mark.asyncio
class TestGetCurrentUser:
    '''現在のユーザー取得のテスト'''

    async def test_get_current_user_success(self, mock_supabase_auth):
        '''有効なトークンからユーザー情報取得'''
        service = AuthService(mock_supabase_auth)
        user = await service.get_current_user('valid-token')

        assert user.email == 'test@example.com'
        assert user.role == 'clinic_owner'

    async def test_get_current_user_invalid_token(self, mock_supabase_auth):
        '''無効なトークンの場合'''
        mock_supabase_auth.auth.get_user.side_effect = Exception('Invalid token')
        service = AuthService(mock_supabase_auth)

        with pytest.raises(ValueError, match='Failed to get current user'):
            await service.get_current_user('invalid-token')
