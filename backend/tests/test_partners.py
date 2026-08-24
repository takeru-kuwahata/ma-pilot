'''
Test cases for partner company / service management (unit tests with mocks)

回帰対象（2026-08-24 クライアント報告「登録したサービスを編集しようとしても保存に失敗しました」）:
  - 企業一覧APIが編集ダイアログに必要な全フィールド（company_id 等）を返すこと
  - 企業の is_active スイッチが保存対象に含まれること
  - 存在しないIDの更新で課題タグを消さずに404を返すこと
'''
import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException

from src.api.partners import (
    PartnerCompanyCreate,
    PartnerServiceCreate,
    list_companies,
    update_company,
    update_service,
)
from src.middleware.auth import UserContext

COMPANY_UUID = 'bbccddee-0001-0001-0001-bbccddee0001'
SERVICE_UUID = 'bbccddee-0002-0002-0002-bbccddee0002'


def _admin_user() -> Mock:
    '''システム管理者として振る舞うユーザーコンテキスト'''
    user = Mock(spec=UserContext)
    user.is_system_admin = Mock(return_value=True)
    return user


def _make_supabase_mock(execute_data=None):
    '''チェーン呼び出しを受け流すSupabaseモックと、テーブル別の呼び出し記録を返す'''
    mock = Mock()
    table_mock = Mock()
    for method in ('select', 'insert', 'update', 'delete', 'eq', 'in_', 'order', 'limit'):
        setattr(table_mock, method, Mock(return_value=table_mock))
    table_mock.execute = Mock(return_value=Mock(data=execute_data if execute_data is not None else []))
    mock.table = Mock(return_value=table_mock)
    return mock, table_mock


class TestListCompanies:
    '''一覧APIが編集に必要なフィールドを返すか'''

    @pytest.mark.asyncio
    async def test_select_includes_all_service_columns(self):
        '''サービスは全列を返す。company_id が欠けると編集保存が422で失敗するため'''
        supabase, table_mock = _make_supabase_mock([])

        await list_companies(supabase=supabase, user=_admin_user())

        select_arg = table_mock.select.call_args[0][0]
        # partner_services を列挙指定にすると company_id 等の取りこぼしが再発する
        assert 'partner_services(*' in select_arg
        assert 'service_problem_tags(problem_tag)' in select_arg

    @pytest.mark.asyncio
    async def test_requires_system_admin(self):
        '''管理者以外は403'''
        supabase, _ = _make_supabase_mock([])
        user = Mock(spec=UserContext)
        user.is_system_admin = Mock(return_value=False)

        with pytest.raises(HTTPException) as exc:
            await list_companies(supabase=supabase, user=user)
        assert exc.value.status_code == 403


class TestCompanyModel:
    '''企業モデルが画面の入力項目を受け取れるか'''

    def test_is_active_is_accepted(self):
        '''企業ダイアログの有効/無効スイッチが保存対象に含まれること'''
        model = PartnerCompanyCreate(name='テスト企業', is_active=False)
        assert model.is_active is False
        assert 'is_active' in model.model_dump()

    def test_is_active_defaults_to_true(self):
        '''未指定時は有効扱い'''
        assert PartnerCompanyCreate(name='テスト企業').is_active is True


class TestUpdateCompany:
    '''企業更新の異常系'''

    @pytest.mark.asyncio
    async def test_missing_company_returns_404(self):
        '''対象が無ければ500ではなく404を返す'''
        supabase, _ = _make_supabase_mock([])

        with pytest.raises(HTTPException) as exc:
            await update_company(
                company_id=COMPANY_UUID,
                request=PartnerCompanyCreate(name='テスト企業'),
                supabase=supabase,
                user=_admin_user(),
            )
        assert exc.value.status_code == 404


class TestUpdateService:
    '''サービス更新の正常系・異常系'''

    def _request(self) -> PartnerServiceCreate:
        return PartnerServiceCreate(
            company_id=COMPANY_UUID,
            service_name='テストサービス',
            catchcopy='キャッチコピー',
            problem_tags=['増患', '節税/助成金/保険'],
        )

    @pytest.mark.asyncio
    async def test_updates_service_and_replaces_tags(self):
        '''更新に成功したら課題タグを洗い替えする'''
        supabase, table_mock = _make_supabase_mock([{'id': SERVICE_UUID, 'service_name': 'テストサービス'}])

        result = await update_service(
            service_id=SERVICE_UUID,
            request=self._request(),
            supabase=supabase,
            user=_admin_user(),
        )

        assert result['message'] == 'サービスを更新しました'
        # problem_tags は別テーブル管理なので partner_services への update には含めない
        update_payload = table_mock.update.call_args[0][0]
        assert 'problem_tags' not in update_payload
        assert update_payload['company_id'] == COMPANY_UUID
        # タグは delete → insert で洗い替えされる
        table_mock.delete.assert_called()
        inserted_tags = table_mock.insert.call_args[0][0]
        assert {t['problem_tag'] for t in inserted_tags} == {'増患', '節税/助成金/保険'}

    @pytest.mark.asyncio
    async def test_missing_service_returns_404_without_deleting_tags(self):
        '''対象が無い場合、課題タグを消さずに404を返す'''
        supabase, table_mock = _make_supabase_mock([])

        with pytest.raises(HTTPException) as exc:
            await update_service(
                service_id=SERVICE_UUID,
                request=self._request(),
                supabase=supabase,
                user=_admin_user(),
            )

        assert exc.value.status_code == 404
        # 存在しないIDでタグだけ消えるのを防ぐ
        table_mock.delete.assert_not_called()

    @pytest.mark.asyncio
    async def test_company_id_is_required(self):
        '''company_id 未指定は弾かれる（画面が送り忘れると422になることの明示）'''
        with pytest.raises(Exception):
            PartnerServiceCreate(service_name='テストサービス')
