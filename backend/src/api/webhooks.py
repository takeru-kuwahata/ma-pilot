"""Webhook受信エンドポイント"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from supabase import Client
from ..core.database import get_supabase_client
from ..services.lstep_service import LstepService

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/api/webhooks', tags=['Webhooks'])


def get_lstep_service(supabase: Client = Depends(get_supabase_client)) -> LstepService:
    """LstepServiceの依存性注入"""
    from ..core.config import get_settings
    settings = get_settings()

    return LstepService(
        supabase=supabase,
        wordpress_api_url=settings.wordpress_api_url,
        wordpress_username=settings.wordpress_api_username,
        wordpress_password=settings.wordpress_api_password,
    )


@router.post('/lstep')
async def lstep_webhook(
    payload: Dict[str, Any],
    service: LstepService = Depends(get_lstep_service),
):
    """
    Lstep Webhook受信エンドポイント

    Args:
        payload: Lstepから送信されたペイロード

    Returns:
        処理結果
    """
    try:
        logger.info(f'Lstep Webhook受信: {payload}')
        result = await service.process_webhook(payload)
        return result
    except Exception as e:
        logger.error(f'Lstep Webhook処理エラー: {e}')
        raise HTTPException(status_code=500, detail=str(e))
