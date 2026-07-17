'''
Test cases for Lstep Webhook processing (unit tests with mocks)
LstepService processes 4 form types. A案（2026-07-17）以降、全フォーム共通で
WordPressアカウントのみ発行する（MA-Pilotアカウントは発行しない）:
  - doctor_openhouse, staff, doctor_other, dental_show: Creates WordPress account only
'''
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from src.services.lstep_service import LstepService, _generate_password


# ============================================================
# ヘルパー関数
# ============================================================

def _make_service(supabase=None, wp_success=True, wp_user=None):
    '''LstepServiceとWordPressService・EmailServiceを一括モック化して返す'''
    if supabase is None:
        supabase = _make_supabase_mock()

    service = LstepService(
        supabase=supabase,
        wordpress_api_url='https://wp.example.com/wp-json/wp/v2',
        wordpress_username='wpuser',
        wordpress_password='wppass',
    )

    # WordPressServiceをモック
    mock_wp = AsyncMock()
    default_wp_user = {
        'id': 99,
        'username': 'test_user',
        'password': 'WpTestPass1',
        'email': 'test@example.com',
        'login_url': 'https://si-college.net/wp-login.php',
    }
    if wp_success:
        mock_wp.create_user = AsyncMock(return_value=wp_user or default_wp_user)
    else:
        mock_wp.create_user = AsyncMock(return_value=None)
    service.wordpress = mock_wp

    # EmailServiceをモック
    mock_email = AsyncMock()
    mock_email.send_welcome_email = AsyncMock(return_value=True)
    mock_email.send_wordpress_welcome_email = AsyncMock(return_value=None)
    mock_email.send_wordpress_password_reset_email = AsyncMock(return_value=None)
    service.email_service = mock_email

    return service, mock_wp, mock_email


def _make_supabase_mock():
    '''Supabaseモック（clinics insert + user_metadata insert）'''
    mock = Mock()
    table_mock = Mock()
    table_mock.insert = Mock(return_value=table_mock)
    table_mock.execute = Mock(return_value=Mock(data=[{'id': 'new-clinic-uuid-001'}]))
    mock.table = Mock(return_value=table_mock)
    return mock


DOCTOR_OPENHOUSE_PAYLOAD = {
    'form_type': 'doctor_openhouse',
    'clinic_name': 'テスト歯科クリニック',
    'full_name': 'テスト 太郎',
    'furigana': 'テスト タロウ',
    'birth_date': '1985-05-15',
    'email': 'test-doctor@example.com',
    'phone': '03-1234-5678',
    'ma_staff_name': '担当者名',
    'opening_date': '2026-06-01',
    'openhouse_start_date': '2026-05-25',
    'openhouse_end_date': '2026-05-26',
    'home_postal_code': '100-0001',
    'home_address': '東京都千代田区千代田1-1',
    'clinic_address': '東京都千代田区千代田2-2',
    'clinic_address2': 'ビル2F',
}

STAFF_PAYLOAD = {
    'form_type': 'staff',
    'clinic_name': 'テスト歯科クリニック',
    'clinic_location': '東京都千代田区',
    'full_name': 'テスト 花子',
    'furigana': 'テスト ハナコ',
    'email': 'test-staff@example.com',
    'job_type': '歯科衛生士',
}

DOCTOR_OTHER_PAYLOAD = {
    'form_type': 'doctor_other',
    'full_name': 'テスト 次郎',
    'furigana': 'テスト ジロウ',
    'birth_date': '1980-10-20',
    'email': 'test-doctor-other@example.com',
    'phone': '03-9876-5432',
    'clinic_name': '既存歯科医院',
    'clinic_prefecture': '東京都',
    'clinic_address': '東京都新宿区新宿1-1',
    'job_type': '勤務医',
}

DENTAL_SHOW_PAYLOAD = {
    'form_type': 'dental_show',
    'full_name': 'テスト 三郎',
    'furigana': 'テスト サブロウ',
    'email': '',
    'phone': '090-1234-5678',
    'job_type': '歯科医師',
    'clinic_name': 'デンタルクリニック',
    'clinic_location': '大阪市北区',
}


# ============================================================
# パスワード生成ユーティリティ
# ============================================================

class TestGeneratePassword:
    '''_generate_password関数のテスト'''

    def test_default_length_is_12(self):
        '''デフォルト長は12文字'''
        password = _generate_password()
        assert len(password) == 12

    def test_custom_length(self):
        '''指定した長さのパスワードを生成する'''
        for length in [8, 16, 24]:
            assert len(_generate_password(length)) == length

    def test_uses_alphanumeric_only(self):
        '''英数字のみ（記号なし）'''
        import string
        valid_chars = set(string.ascii_letters + string.digits)
        for _ in range(10):
            password = _generate_password(20)
            assert all(c in valid_chars for c in password)

    def test_passwords_are_random(self):
        '''生成ごとに異なるパスワード（確率的テスト）'''
        passwords = {_generate_password() for _ in range(10)}
        assert len(passwords) > 1  # 10個中2個以上は異なるはず


# ============================================================
# ①先生フォーム（doctor_openhouse）
# ============================================================

@pytest.mark.asyncio
class TestDoctorOpenhouse:
    '''先生フォーム処理のテスト（A案: WordPressのみ・MA-Pilotは発行しない）'''

    async def test_doctor_openhouse_wordpress_only_success(self):
        '''A案: 先生フォームもWordPressのみ作成してsuccess=True（MA-Pilotは発行しない）'''
        service, mock_wp, mock_email = _make_service()

        result = await service.process_webhook(DOCTOR_OPENHOUSE_PAYLOAD)

        assert result['success'] is True
        assert result['ma_pilot_created'] is False
        assert result['wordpress_created'] is True
        assert result['email_sent'] is False
        assert result['form_type'] == 'doctor_openhouse'

    async def test_doctor_openhouse_does_not_create_ma_pilot(self):
        '''A案: MA-Pilotアカウントは作成しない（Supabase Auth API呼び出しなし）'''
        service, mock_wp, mock_email = _make_service()

        with patch('src.services.lstep_service.httpx.AsyncClient') as mock_httpx:
            result = await service.process_webhook(DOCTOR_OPENHOUSE_PAYLOAD)

        # MA-Pilot作成をスキップするのでSupabase Auth用のhttpxは呼ばれない
        mock_httpx.assert_not_called()
        assert result['ma_pilot_created'] is False

    async def test_doctor_openhouse_no_ma_pilot_welcome_email(self):
        '''A案: MA-Pilotウェルカムメール（send_welcome_email）は送信しない'''
        service, mock_wp, mock_email = _make_service()

        await service.process_webhook(DOCTOR_OPENHOUSE_PAYLOAD)

        mock_email.send_welcome_email.assert_not_called()

    async def test_doctor_openhouse_sends_wordpress_welcome_email(self):
        '''新規WordPressアカウントにはログイン情報メールを送信する'''
        service, mock_wp, mock_email = _make_service()

        await service.process_webhook(DOCTOR_OPENHOUSE_PAYLOAD)

        mock_email.send_wordpress_welcome_email.assert_called_once()

    async def test_doctor_openhouse_wordpress_failure(self):
        '''WordPress作成失敗時はsuccess=False'''
        service, mock_wp, mock_email = _make_service(wp_success=False)

        result = await service.process_webhook(DOCTOR_OPENHOUSE_PAYLOAD)

        assert result['success'] is False
        assert result['wordpress_created'] is False
        assert result['ma_pilot_created'] is False


# ============================================================
# ②スタッフフォーム（staff）
# ============================================================

@pytest.mark.asyncio
class TestStaffForm:
    '''スタッフフォーム処理のテスト（WordPressのみ）'''

    async def test_staff_wordpress_only_success(self):
        '''スタッフフォームはWordPressのみ作成してsuccess=True'''
        service, mock_wp, mock_email = _make_service()

        result = await service.process_webhook(STAFF_PAYLOAD)

        assert result['success'] is True
        assert result['ma_pilot_created'] is False
        assert result['wordpress_created'] is True
        assert result['email_sent'] is False
        assert result['form_type'] == 'staff'

    async def test_staff_wordpress_failure(self):
        '''WordPress作成失敗時はsuccess=False'''
        service, mock_wp, mock_email = _make_service(wp_success=False)

        result = await service.process_webhook(STAFF_PAYLOAD)

        assert result['success'] is False
        assert result['wordpress_created'] is False

    async def test_staff_wordpress_called_with_email_and_name(self):
        '''WordPressのcreate_userにemail・full_nameが渡される'''
        service, mock_wp, mock_email = _make_service()

        await service.process_webhook(STAFF_PAYLOAD)

        mock_wp.create_user.assert_called_once()
        call_kwargs = mock_wp.create_user.call_args.kwargs
        assert call_kwargs['email'] == 'test-staff@example.com'
        assert call_kwargs['full_name'] == 'テスト 花子'

    async def test_staff_no_welcome_email(self):
        '''スタッフフォームではウェルカムメールを送信しない'''
        service, mock_wp, mock_email = _make_service()

        await service.process_webhook(STAFF_PAYLOAD)

        mock_email.send_welcome_email.assert_not_called()


# ============================================================
# ③勤務医・開業済み・フリーランス（doctor_other）
# ============================================================

@pytest.mark.asyncio
class TestDoctorOther:
    '''doctor_otherフォーム処理のテスト（WordPressのみ）'''

    async def test_doctor_other_wordpress_only_success(self):
        '''WordPressのみ作成してsuccess=True'''
        service, mock_wp, mock_email = _make_service()

        result = await service.process_webhook(DOCTOR_OTHER_PAYLOAD)

        assert result['success'] is True
        assert result['ma_pilot_created'] is False
        assert result['wordpress_created'] is True
        assert result['form_type'] == 'doctor_other'

    async def test_doctor_other_no_ma_pilot_creation(self):
        '''MA-Pilotアカウントは作成しない（Supabase Auth呼び出しなし）'''
        service, mock_wp, mock_email = _make_service()

        with patch('src.services.lstep_service.httpx.AsyncClient') as mock_httpx:
            result = await service.process_webhook(DOCTOR_OTHER_PAYLOAD)

        # httpxクライアントは呼び出されない（MA-Pilot作成をスキップ）
        mock_httpx.assert_not_called()
        assert result['ma_pilot_created'] is False


# ============================================================
# ④デンタルショー（dental_show）
# ============================================================

@pytest.mark.asyncio
class TestDentalShow:
    '''dental_showフォーム処理のテスト（WordPressのみ）'''

    async def test_dental_show_wordpress_only_success(self):
        '''デンタルショーはWordPressのみ作成してsuccess=True'''
        service, mock_wp, mock_email = _make_service()

        result = await service.process_webhook(DENTAL_SHOW_PAYLOAD)

        assert result['success'] is True
        assert result['ma_pilot_created'] is False
        assert result['wordpress_created'] is True
        assert result['form_type'] == 'dental_show'

    async def test_dental_show_empty_email_still_processes(self):
        '''emailが空でもWordPress作成を試みる'''
        service, mock_wp, mock_email = _make_service()

        result = await service.process_webhook(DENTAL_SHOW_PAYLOAD)

        mock_wp.create_user.assert_called_once()
        assert result['form_type'] == 'dental_show'


# ============================================================
# フォームIDからのform_type自動判別
# ============================================================

@pytest.mark.asyncio
class TestFormIdMapping:
    '''フォームIDによる自動form_type判別のテスト'''

    async def test_form_id_816114_maps_to_dental_show(self):
        '''form_id=816114はdental_showとして処理される'''
        service, mock_wp, mock_email = _make_service()
        payload = {**DENTAL_SHOW_PAYLOAD, 'form_type': '', 'form_id': '816114'}

        result = await service.process_webhook(payload)

        assert result['form_type'] == 'dental_show'
        assert result['ma_pilot_created'] is False

    async def test_form_id_710696_maps_to_doctor_openhouse(self):
        '''form_id=710696はdoctor_openhouseとして処理される（A案: WordPressのみ）'''
        service, mock_wp, mock_email = _make_service()
        payload = {**DOCTOR_OPENHOUSE_PAYLOAD, 'form_type': '', 'form_id': '710696'}

        result = await service.process_webhook(payload)

        assert result['form_type'] == 'doctor_openhouse'
        assert result['ma_pilot_created'] is False

    async def test_form_id_710762_maps_to_doctor_other(self):
        '''form_id=710762はdoctor_otherとして処理される'''
        service, mock_wp, mock_email = _make_service()
        payload = {**DOCTOR_OTHER_PAYLOAD, 'form_type': '', 'form_id': '710762'}

        result = await service.process_webhook(payload)

        assert result['form_type'] == 'doctor_other'

    async def test_form_id_710319_maps_to_staff(self):
        '''form_id=710319はstaffとして処理される'''
        service, mock_wp, mock_email = _make_service()
        payload = {**STAFF_PAYLOAD, 'form_type': '', 'form_id': '710319'}

        result = await service.process_webhook(payload)

        assert result['form_type'] == 'staff'

    async def test_unknown_form_id_still_processes_wordpress(self):
        '''未知のform_idでもWordPress作成は試みる（フォームタイプ不明扱い）'''
        service, mock_wp, mock_email = _make_service()
        payload = {
            'form_id': '999999',
            'form_type': '',
            'email': 'unknown@example.com',
            'full_name': 'Unknown User',
        }

        result = await service.process_webhook(payload)

        # is_doctor_openhouseはFalseなのでWordPressのみ
        assert result['ma_pilot_created'] is False


# ============================================================
# エラー耐性テスト
# ============================================================

@pytest.mark.asyncio
class TestErrorResilience:
    '''エラー発生時の耐性テスト'''

    async def test_wordpress_exception_handled_gracefully(self):
        '''WordPress API例外時もcrashせず結果を返す'''
        service, mock_wp, mock_email = _make_service()
        mock_wp.create_user = AsyncMock(side_effect=Exception('WordPress接続エラー'))

        result = await service.process_webhook(STAFF_PAYLOAD)

        assert result['success'] is False
        assert result['wordpress_created'] is False

    async def test_email_exception_does_not_affect_wordpress_created(self):
        '''WordPressメール送信失敗してもwordpress_created・successはTrueを維持する'''
        service, mock_wp, mock_email = _make_service()
        mock_email.send_wordpress_welcome_email = AsyncMock(side_effect=Exception('SMTP error'))

        result = await service.process_webhook(DOCTOR_OPENHOUSE_PAYLOAD)

        assert result['wordpress_created'] is True
        assert result['success'] is True

    async def test_result_always_has_required_keys(self):
        '''結果dictには必ず必要なキーが含まれる'''
        service, mock_wp, mock_email = _make_service()

        result = await service.process_webhook(STAFF_PAYLOAD)

        required_keys = {'success', 'message', 'ma_pilot_created', 'wordpress_created', 'email_sent', 'form_type'}
        assert required_keys.issubset(result.keys())
