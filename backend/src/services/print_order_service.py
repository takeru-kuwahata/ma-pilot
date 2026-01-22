from typing import List, Optional
import json
from supabase import Client
from ..models import (
    PriceTable,
    PriceEstimateRequest,
    PriceEstimateResponse,
    PriceEstimateBreakdown,
    PrintOrder,
    PrintOrderCreate,
    PrintOrderUpdate,
    PrintOrderPattern,
    OrderStatus,
    PaymentStatus,
)
from .email_service import EmailService


class PrintOrderService:
    """印刷物受注サービス"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.email_service = EmailService()

    # ============================================
    # 価格表関連
    # ============================================

    def get_price_tables(self) -> List[PriceTable]:
        """価格表一覧を取得"""
        response = self.supabase.table("price_tables").select("*").execute()
        return [PriceTable(**row) for row in response.data]

    def get_price_table_by_id(self, price_table_id: str) -> Optional[PriceTable]:
        """IDで価格表を取得"""
        response = (
            self.supabase.table("price_tables")
            .select("*")
            .eq("id", price_table_id)
            .single()
            .execute()
        )
        return PriceTable(**response.data) if response.data else None

    def get_price_table(
        self, product_type: str, quantity: int
    ) -> Optional[PriceTable]:
        """商品種類と数量で価格表を取得（エイリアス）"""
        return self.find_matching_price_table(product_type, quantity)

    def find_matching_price_table(
        self, product_type: str, quantity: int, specifications: Optional[str] = None
    ) -> Optional[PriceTable]:
        """条件に一致する価格表を検索"""
        query = (
            self.supabase.table("price_tables")
            .select("*")
            .eq("product_type", product_type)
            .eq("quantity", quantity)
        )

        if specifications:
            query = query.eq("specifications", specifications)

        response = query.execute()

        if response.data:
            return PriceTable(**response.data[0])
        return None

    # ============================================
    # 見積もり計算
    # ============================================

    def calculate_estimate(
        self, request: PriceEstimateRequest
    ) -> PriceEstimateResponse:
        """見積もり計算"""
        # 仕様をJSON文字列に変換
        specifications_str = (
            json.dumps(request.specifications, ensure_ascii=False)
            if request.specifications
            else None
        )

        # 一致する価格表を検索
        price_table = self.find_matching_price_table(
            request.product_type, request.quantity, specifications_str
        )

        if not price_table:
            raise ValueError(
                f"価格表に該当する商品が見つかりません: {request.product_type}, 数量: {request.quantity}"
            )

        # 見積もり計算
        base_price = price_table.price
        design_fee = 0

        if not price_table.design_fee_included and request.design_required:
            design_fee = price_table.design_fee

        total = base_price + design_fee

        breakdown = PriceEstimateBreakdown(
            base_price=base_price,
            design_fee=design_fee,
            total=total,
        )

        return PriceEstimateResponse(
            estimated_price=total,
            breakdown=breakdown,
            delivery_days=price_table.delivery_days,
            price_table_id=price_table.id,
        )

    # ============================================
    # 注文関連
    # ============================================

    def create_order(self, order_data: PrintOrderCreate) -> PrintOrder:
        """注文を作成"""
        # 仕様をJSON文字列に変換
        specifications_str = (
            json.dumps(order_data.specifications, ensure_ascii=False)
            if order_data.specifications
            else None
        )

        # パターンCの場合、見積もり計算を実行
        estimated_price = None
        if order_data.pattern == PrintOrderPattern.REORDER:
            if not order_data.product_type or not order_data.quantity:
                raise ValueError(
                    "再注文パターンでは商品種類と数量が必須です"
                )

            estimate_request = PriceEstimateRequest(
                product_type=order_data.product_type,
                quantity=order_data.quantity,
                specifications=order_data.specifications,
                design_required=order_data.design_required,
            )
            estimate = self.calculate_estimate(estimate_request)
            estimated_price = estimate.estimated_price

        # データベースに挿入
        insert_data = {
            "clinic_name": order_data.clinic_name,
            "email": order_data.email,
            "pattern": order_data.pattern.value,
            "product_type": order_data.product_type,
            "quantity": order_data.quantity,
            "specifications": specifications_str,
            "delivery_date": order_data.delivery_date,
            "design_required": order_data.design_required,
            "notes": order_data.notes,
            "estimated_price": estimated_price,
            "order_status": OrderStatus.SUBMITTED.value,
            "payment_status": PaymentStatus.PENDING.value,
        }

        response = self.supabase.table("print_orders").insert(insert_data).execute()
        created_order = PrintOrder(**response.data[0])

        # メール送信（MVP版: ログ出力のみ）
        try:
            # クリニック宛受付メール
            self.email_service.send_order_confirmation_to_clinic(
                order_id=created_order.id,
                clinic_name=created_order.clinic_name,
                email=created_order.email,
                product_type=created_order.product_type,
                quantity=created_order.quantity,
                estimated_price=created_order.estimated_price,
            )

            # 京葉広告スタッフ宛受注通知メール
            self.email_service.send_order_notification_to_staff(
                order_id=created_order.id,
                clinic_name=created_order.clinic_name,
                clinic_email=created_order.email,
                product_type=created_order.product_type,
                quantity=created_order.quantity,
                pattern=created_order.pattern,
                notes=created_order.notes,
            )
        except Exception as e:
            # メール送信失敗してもエラーにしない（ログのみ）
            import logging
            logging.error(f"メール送信エラー: {e}")

        return created_order

    def get_orders(self, email: Optional[str] = None) -> List[PrintOrder]:
        """注文一覧を取得"""
        query = self.supabase.table("print_orders").select("*")

        if email:
            query = query.eq("email", email)

        response = query.order("created_at", desc=True).execute()

        return [PrintOrder(**row) for row in response.data]

    def get_order_by_id(self, order_id: str) -> Optional[PrintOrder]:
        """IDで注文を取得"""
        response = (
            self.supabase.table("print_orders")
            .select("*")
            .eq("id", order_id)
            .single()
            .execute()
        )

        return PrintOrder(**response.data) if response.data else None

    def update_order(
        self, order_id: str, update_data: PrintOrderUpdate
    ) -> PrintOrder:
        """注文を更新"""
        update_dict = update_data.model_dump(exclude_unset=True)

        # Enumの値を文字列に変換
        for key, value in update_dict.items():
            if hasattr(value, "value"):
                update_dict[key] = value.value

        response = (
            self.supabase.table("print_orders")
            .update(update_dict)
            .eq("id", order_id)
            .execute()
        )

        return PrintOrder(**response.data[0])

    def approve_order(self, order_id: str, payment_method: str) -> PrintOrder:
        """見積もりを承認（パターンCのみ）"""
        order = self.get_order_by_id(order_id)

        if not order:
            raise ValueError(f"注文が見つかりません: {order_id}")

        if order.pattern != PrintOrderPattern.REORDER:
            raise ValueError("相談パターンの注文は承認できません")

        update_data = PrintOrderUpdate(
            order_status=OrderStatus.CONFIRMED,
            payment_method=payment_method,
        )

        return self.update_order(order_id, update_data)
