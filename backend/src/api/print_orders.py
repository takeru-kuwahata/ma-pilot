from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import Response
from typing import List, Optional
from ..core import get_supabase_client
from ..services import PrintOrderService
from ..services.pdf_service import PdfService
from ..models import (
    PriceTable,
    PriceEstimateRequest,
    PriceEstimateResponse,
    PrintOrder,
    PrintOrderCreate,
    PrintOrderUpdate,
    PrintOrderApprove,
    ApiResponse,
)

router = APIRouter(prefix="/api", tags=["Print Orders"])


def get_print_order_service():
    """PrintOrderServiceの依存性注入"""
    supabase = get_supabase_client()
    return PrintOrderService(supabase)


# ============================================
# 価格表関連エンドポイント
# ============================================


@router.get("/price-tables", response_model=List[PriceTable])
async def get_price_tables(
    service: PrintOrderService = Depends(get_print_order_service),
):
    """価格表一覧を取得"""
    try:
        return service.get_price_tables()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/price-tables/{price_table_id}", response_model=PriceTable)
async def get_price_table(
    price_table_id: str,
    service: PrintOrderService = Depends(get_print_order_service),
):
    """価格表を取得"""
    try:
        price_table = service.get_price_table_by_id(price_table_id)
        if not price_table:
            raise HTTPException(status_code=404, detail="価格表が見つかりません")
        return price_table
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 見積もり関連エンドポイント
# ============================================


@router.post("/print-orders/estimate", response_model=PriceEstimateResponse)
async def calculate_estimate(
    request: PriceEstimateRequest,
    service: PrintOrderService = Depends(get_print_order_service),
):
    """見積もり計算"""
    try:
        return service.calculate_estimate(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 注文関連エンドポイント
# ============================================


@router.post("/print-orders", response_model=ApiResponse)
async def create_print_order(
    order_data: PrintOrderCreate,
    service: PrintOrderService = Depends(get_print_order_service),
):
    """注文を作成"""
    try:
        order = service.create_order(order_data)
        return ApiResponse(
            data=order.model_dump(),
            message="注文を受け付けました",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/print-orders", response_model=List[PrintOrder])
async def get_print_orders(
    email: Optional[str] = Query(None, description="メールアドレスでフィルタ"),
    service: PrintOrderService = Depends(get_print_order_service),
):
    """注文一覧を取得"""
    try:
        return service.get_orders(email=email)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/print-orders/{order_id}", response_model=PrintOrder)
async def get_print_order(
    order_id: str,
    service: PrintOrderService = Depends(get_print_order_service),
):
    """注文詳細を取得"""
    try:
        order = service.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="注文が見つかりません")
        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/print-orders/{order_id}/approve", response_model=ApiResponse)
async def approve_print_order(
    order_id: str,
    approve_data: PrintOrderApprove,
    service: PrintOrderService = Depends(get_print_order_service),
):
    """見積もりを承認"""
    try:
        order = service.approve_order(order_id, approve_data.payment_method.value)
        return ApiResponse(
            data=order.model_dump(),
            message="見積もりを承認しました",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# PDF生成エンドポイント
# ============================================


@router.get("/print-orders/{order_id}/estimate-pdf")
async def download_estimate_pdf(
    order_id: str,
    service: PrintOrderService = Depends(get_print_order_service),
):
    """見積書PDFダウンロード"""
    try:
        # 注文取得
        order = service.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="注文が見つかりません")

        # 価格表取得
        if not order.product_type or not order.quantity:
            raise HTTPException(
                status_code=400, detail="商品種類と数量が必要です（再注文パターンのみPDF生成可能）"
            )

        price_table = service.get_price_table(order.product_type, order.quantity)
        if not price_table:
            raise HTTPException(status_code=404, detail="価格情報が見つかりません")

        # 見積もり計算
        unit_price = price_table.price
        design_fee = price_table.design_fee if order.design_required else 0
        total_price = (unit_price * order.quantity) + design_fee

        # PDF生成
        pdf_service = PdfService()
        pdf_bytes = pdf_service.generate_estimate_pdf(
            order_id=order.id,
            clinic_name=order.clinic_name,
            email=order.email,
            product_type=order.product_type,
            quantity=order.quantity,
            unit_price=unit_price,
            design_fee=design_fee,
            design_required=order.design_required,
            total_price=total_price,
            delivery_date=order.delivery_date,
            notes=order.notes,
        )

        # レスポンス返却
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="estimate_{order_id}.pdf"'
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
