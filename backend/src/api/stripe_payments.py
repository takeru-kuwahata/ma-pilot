import os
import stripe
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..core import get_db_client
from ..services import PrintOrderService

router = APIRouter(prefix="/api/stripe", tags=["Stripe"])


def get_stripe_key() -> str:
    key = os.environ.get('STRIPE_SECRET_KEY', '')
    if not key:
        raise HTTPException(status_code=503, detail="Stripe決済は現在準備中です")
    return key


def get_print_order_service():
    return PrintOrderService(get_db_client())


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: int


class ConfirmPaymentRequest(BaseModel):
    payment_intent_id: str


@router.post("/payment-intent/{order_id}", response_model=PaymentIntentResponse)
async def create_payment_intent(
    order_id: str,
    stripe_secret: str = Depends(get_stripe_key),
    service: PrintOrderService = Depends(get_print_order_service),
):
    """注文に対するStripe Payment Intentを作成"""
    order = service.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="注文が見つかりません")

    if order.payment_method != "stripe":
        raise HTTPException(status_code=400, detail="この注文はStripe決済ではありません")

    if not order.total_amount or order.total_amount <= 0:
        raise HTTPException(status_code=400, detail="金額が確定していません。見積もり承認後に決済してください")

    stripe.api_key = stripe_secret

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(order.total_amount * 1.1),  # 税込10%
            currency="jpy",
            metadata={
                "order_id": order_id,
                "clinic_name": order.clinic_name or "",
            },
        )
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return PaymentIntentResponse(
        client_secret=intent.client_secret,
        payment_intent_id=intent.id,
        amount=intent.amount,
    )


@router.post("/confirm/{order_id}")
async def confirm_payment(
    order_id: str,
    body: ConfirmPaymentRequest,
    stripe_secret: str = Depends(get_stripe_key),
    service: PrintOrderService = Depends(get_print_order_service),
):
    """決済完了後にPayment Intentのステータスを確認してDBを更新"""
    stripe.api_key = stripe_secret

    try:
        intent = stripe.PaymentIntent.retrieve(body.payment_intent_id)
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if intent.status != "succeeded":
        raise HTTPException(status_code=400, detail=f"決済が完了していません（ステータス: {intent.status}）")

    supabase = get_db_client()
    supabase.table("print_orders").update({
        "payment_status": "paid",
        "stripe_payment_intent_id": body.payment_intent_id,
    }).eq("id", order_id).execute()

    return {"message": "決済が完了しました"}
