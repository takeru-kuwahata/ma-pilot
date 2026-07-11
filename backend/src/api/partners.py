from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from typing import List, Optional
from pydantic import BaseModel
from ..core.database import get_db_client, get_service_role_client
from ..middleware.auth import get_current_user_metadata, UserContext

router = APIRouter(prefix='/api/partners', tags=['Partners'])


# ---- リクエストモデル ----

class PartnerCompanyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    display_priority: int = 0


class PartnerServiceCreate(BaseModel):
    company_id: str
    service_name: str
    catchcopy: Optional[str] = None
    description: Optional[str] = None
    price_range: Optional[str] = None
    service_url: Optional[str] = None
    coupon_code: Optional[str] = None
    coupon_detail: Optional[str] = None
    apply_method: Optional[str] = None
    problem_tags: List[str] = []
    display_priority: int = 0
    is_active: bool = True


class RecommendationLogCreate(BaseModel):
    clinic_id: str
    service_id: str
    problem_tag: Optional[str] = None


# ---- 公開エンドポイント（認証済みユーザー） ----

@router.get('/services')
async def get_services_by_tag(
    problem_tag: str,
    supabase: Client = Depends(get_db_client),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''課題タグに対応するサービス一覧を取得'''
    try:
        tag_rows = supabase.table('service_problem_tags') \
            .select('service_id') \
            .eq('problem_tag', problem_tag) \
            .execute().data
        service_ids = [r['service_id'] for r in tag_rows]
        if not service_ids:
            return {'data': []}

        rows = supabase.table('partner_services') \
            .select('*, partner_companies(name, logo_url)') \
            .in_('id', service_ids) \
            .eq('is_active', True) \
            .order('display_priority', desc=True) \
            .limit(3) \
            .execute().data
        return {'data': rows}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/recommendation-log')
async def log_recommendation_click(
    request: RecommendationLogCreate,
    supabase: Client = Depends(get_db_client),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''レコメンドのクリックを記録'''
    try:
        from datetime import datetime
        supabase.table('recommendation_logs').insert({
            'clinic_id': request.clinic_id,
            'service_id': request.service_id,
            'problem_tag': request.problem_tag,
            'clicked_at': datetime.now().isoformat(),
        }).execute()
        return {'message': 'logged'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---- 管理者専用エンドポイント ----

@router.get('/admin/companies')
async def list_companies(
    supabase: Client = Depends(get_service_role_client),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''提携企業一覧（管理者のみ）'''
    if not user.is_system_admin():
        raise HTTPException(status_code=403, detail='管理者権限が必要です')
    rows = supabase.table('partner_companies') \
        .select('*, partner_services(id, service_name, price_range, display_priority, is_active, service_problem_tags(problem_tag))') \
        .order('display_priority', desc=True) \
        .execute().data
    return {'data': rows}


@router.post('/admin/companies')
async def create_company(
    request: PartnerCompanyCreate,
    supabase: Client = Depends(get_service_role_client),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''提携企業登録（管理者のみ）'''
    if not user.is_system_admin():
        raise HTTPException(status_code=403, detail='管理者権限が必要です')
    try:
        res = supabase.table('partner_companies').insert(request.model_dump()).execute()
        return {'data': res.data[0], 'message': '企業を登録しました'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/admin/companies/{company_id}')
async def update_company(
    company_id: str,
    request: PartnerCompanyCreate,
    supabase: Client = Depends(get_service_role_client),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''提携企業更新（管理者のみ）'''
    if not user.is_system_admin():
        raise HTTPException(status_code=403, detail='管理者権限が必要です')
    try:
        res = supabase.table('partner_companies') \
            .update(request.model_dump()).eq('id', company_id).execute()
        return {'data': res.data[0], 'message': '企業情報を更新しました'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete('/admin/companies/{company_id}')
async def delete_company(
    company_id: str,
    supabase: Client = Depends(get_service_role_client),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''提携企業削除（管理者のみ）。配下のサービス・課題タグも連鎖削除'''
    if not user.is_system_admin():
        raise HTTPException(status_code=403, detail='管理者権限が必要です')
    try:
        service_rows = supabase.table('partner_services') \
            .select('id').eq('company_id', company_id).execute().data
        service_ids = [r['id'] for r in service_rows]
        if service_ids:
            supabase.table('service_problem_tags').delete().in_('service_id', service_ids).execute()
            supabase.table('partner_services').delete().eq('company_id', company_id).execute()
        supabase.table('partner_companies').delete().eq('id', company_id).execute()
        return {'message': '企業を削除しました'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/admin/services')
async def list_services(
    supabase: Client = Depends(get_db_client),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''サービス一覧（管理者のみ・全件）'''
    if not user.is_system_admin():
        raise HTTPException(status_code=403, detail='管理者権限が必要です')
    rows = supabase.table('partner_services') \
        .select('*, partner_companies(name), service_problem_tags(problem_tag)') \
        .order('display_priority', desc=True) \
        .execute().data
    return {'data': rows}


@router.post('/admin/services')
async def create_service(
    request: PartnerServiceCreate,
    supabase: Client = Depends(get_service_role_client),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''サービス登録（管理者のみ）'''
    if not user.is_system_admin():
        raise HTTPException(status_code=403, detail='管理者権限が必要です')
    try:
        tags = request.problem_tags
        data = request.model_dump()
        data.pop('problem_tags')
        res = supabase.table('partner_services').insert(data).execute()
        service_id = res.data[0]['id']
        # 課題タグを登録
        if tags:
            supabase.table('service_problem_tags').insert([
                {'service_id': service_id, 'problem_tag': t} for t in tags
            ]).execute()
        return {'data': res.data[0], 'message': 'サービスを登録しました'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/admin/services/{service_id}')
async def update_service(
    service_id: str,
    request: PartnerServiceCreate,
    supabase: Client = Depends(get_service_role_client),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''サービス更新（管理者のみ）'''
    if not user.is_system_admin():
        raise HTTPException(status_code=403, detail='管理者権限が必要です')
    try:
        tags = request.problem_tags
        data = request.model_dump()
        data.pop('problem_tags')
        res = supabase.table('partner_services') \
            .update(data).eq('id', service_id).execute()
        # タグを洗い替え
        supabase.table('service_problem_tags').delete().eq('service_id', service_id).execute()
        if tags:
            supabase.table('service_problem_tags').insert([
                {'service_id': service_id, 'problem_tag': t} for t in tags
            ]).execute()
        return {'data': res.data[0], 'message': 'サービスを更新しました'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete('/admin/services/{service_id}')
async def delete_service(
    service_id: str,
    supabase: Client = Depends(get_service_role_client),
    user: UserContext = Depends(get_current_user_metadata),
):
    '''サービス削除（管理者のみ）'''
    if not user.is_system_admin():
        raise HTTPException(status_code=403, detail='管理者権限が必要です')
    try:
        supabase.table('partner_services').delete().eq('id', service_id).execute()
        return {'message': 'サービスを削除しました'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
