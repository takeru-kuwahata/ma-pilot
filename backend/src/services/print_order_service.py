from typing import List, Optional
import json
from supabase import Client
from ..models import (
    PriceTable,
    PriceEstimateRequest,
    PriceEstimateResponse,
    PriceEstimateBreakdown,
    PrintOrder,
    PrintOrderItem,
    PrintOrderItemCreate,
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
        self.email_service = EmailService(supabase)

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
        """注文を作成（Phase 2: 複数商品対応）"""
        import logging
        logger = logging.getLogger(__name__)

        # デバッグログ
        logger.info(f"[DEBUG] create_order called with pattern: {order_data.pattern}")
        logger.info(f"[DEBUG] order_data.items: {order_data.items}")
        if order_data.items:
            for idx, item in enumerate(order_data.items):
                logger.info(f"[DEBUG] Item {idx}: product_type={item.product_type}, quantity={item.quantity}")

        # 仕様をJSON文字列に変換
        specifications_str = (
            json.dumps(order_data.specifications, ensure_ascii=False)
            if order_data.specifications
            else None
        )

        # Phase 2: 複数商品対応
        total_amount = 0
        estimated_price = None

        # 再注文パターンの場合、明細から合計金額を計算
        if order_data.pattern == PrintOrderPattern.REORDER:
            logger.info(f"[DEBUG] Reorder pattern detected")
            logger.info(f"[DEBUG] order_data.items is None: {order_data.items is None}")
            logger.info(f"[DEBUG] order_data.items length: {len(order_data.items) if order_data.items else 0}")

            if not order_data.items or len(order_data.items) == 0:
                logger.error("[DEBUG] No items provided for reorder pattern")
                raise ValueError("再注文パターンでは商品明細が必須です")

            # 各商品のproduct_typeとquantityをバリデーション
            for idx, item in enumerate(order_data.items):
                logger.info(f"[DEBUG] Validating item {idx}")
                logger.info(f"[DEBUG] item object: {item}")
                logger.info(f"[DEBUG] item dict: {item.model_dump()}")
                logger.info(f"[DEBUG] item.product_type type: {type(item.product_type)}")
                logger.info(f"[DEBUG] item.product_type value: '{item.product_type}'")
                logger.info(f"[DEBUG] item.product_type repr: {repr(item.product_type)}")
                logger.info(f"[DEBUG] item.product_type is None: {item.product_type is None}")
                logger.info(f"[DEBUG] item.product_type len: {len(item.product_type) if item.product_type else 'N/A'}")
                logger.info(f"[DEBUG] item.quantity: {item.quantity}")
                logger.info(f"[DEBUG] item.quantity type: {type(item.quantity)}")

                # 検証を一時的に緩和してログを見る
                if item.product_type is None:
                    logger.error(f"[DEBUG] Item {idx} has None product_type")
                    raise ValueError(f"再注文パターンでは商品種類と数量が必須です（product_type is None）")

                if not isinstance(item.product_type, str):
                    logger.error(f"[DEBUG] Item {idx} product_type is not a string, type: {type(item.product_type)}")
                    raise ValueError(f"再注文パターンでは商品種類と数量が必須です（product_type is not string）")

                if len(item.product_type) == 0:
                    logger.error(f"[DEBUG] Item {idx} has empty string product_type")
                    raise ValueError(f"再注文パターンでは商品種類と数量が必須です（product_type is empty string）")

                if item.product_type.strip() == "":
                    logger.error(f"[DEBUG] Item {idx} has whitespace-only product_type")
                    raise ValueError(f"再注文パターンでは商品種類と数量が必須です（product_type is whitespace）")

                if not item.quantity or item.quantity <= 0:
                    logger.error(f"[DEBUG] Item {idx} has invalid quantity: {item.quantity}")
                    raise ValueError(f"再注文パターンでは商品種類と数量が必須です（invalid quantity）")

            # 各商品の価格を計算
            item_count = len(order_data.items)
            for item in order_data.items:
                price_table = self.find_matching_price_table(
                    item.product_type, item.quantity
                )
                if not price_table:
                    raise ValueError(
                        f"商品種類 '{item.product_type}' 数量 {item.quantity} の価格マスタが見つかりません"
                    )
                total_amount += price_table.price

            # 送料を加算（商品数 × 1000円）
            SHIPPING_FEE_PER_ITEM = 1000
            shipping_fee = SHIPPING_FEE_PER_ITEM * item_count
            total_amount += shipping_fee
            estimated_price = total_amount

        # print_ordersテーブルに挿入
        insert_data = {
            "clinic_name": order_data.clinic_name,
            "email": order_data.email,
            "pattern": order_data.pattern.value,
            "specifications": specifications_str,
            "delivery_date": order_data.delivery_date,
            "design_required": order_data.design_required,
            "notes": order_data.notes,
            "estimated_price": estimated_price,
            "total_amount": total_amount if total_amount > 0 else None,
            "payment_method": order_data.payment_method.value if order_data.payment_method else None,
            "order_status": OrderStatus.SUBMITTED.value,
            "payment_status": PaymentStatus.PENDING.value,
            "delivery_address": order_data.delivery_address,
            "daytime_contact": order_data.daytime_contact,
            "terms_agreed": order_data.terms_agreed,
        }

        response = self.supabase.table("print_orders").insert(insert_data).execute()
        created_order_data = response.data[0]
        order_id = created_order_data["id"]

        # Phase 2: print_order_itemsテーブルに明細を挿入
        if order_data.items:
            for item in order_data.items:
                price_table = self.find_matching_price_table(
                    item.product_type, item.quantity
                )
                if price_table:
                    item_insert_data = {
                        "order_id": order_id,
                        "product_type": item.product_type,
                        "quantity": item.quantity,
                        "unit_price": price_table.price,
                        "subtotal": price_table.price,
                        "design_fee": item.design_fee or 0,
                        "delivery_days": item.delivery_days or 7,
                        "specifications": json.dumps(item.specifications, ensure_ascii=False)
                        if item.specifications
                        else None,
                    }
                    self.supabase.table("print_order_items").insert(item_insert_data).execute()

        # 注文データを再取得（明細含む）
        created_order = self.get_order_by_id(order_id)

        # メール送信（MVP版: ログ出力のみ）
        try:
            # クリニック宛受付メール
            product_summary = (
                f"{len(order_data.items)}点の商品"
                if order_data.items
                else order_data.product_type or "未定"
            )
            self.email_service.send_order_confirmation_to_clinic(
                order_id=created_order.id,
                clinic_name=created_order.clinic_name,
                email=created_order.email,
                product_type=product_summary,
                quantity=None,
                estimated_price=created_order.estimated_price,
            )

            # 京葉広告スタッフ宛受注通知メール
            self.email_service.send_order_notification_to_staff(
                order_id=created_order.id,
                clinic_name=created_order.clinic_name,
                clinic_email=created_order.email,
                product_type=product_summary,
                quantity=None,
                pattern=created_order.pattern,
                notes=created_order.notes,
            )
        except Exception as e:
            # メール送信失敗してもエラーにしない（ログのみ）
            import logging
            logging.error(f"メール送信エラー: {e}")

        return created_order

    def get_orders(self, email: Optional[str] = None) -> List[PrintOrder]:
        """注文一覧を取得（Phase 2: 明細含む）"""
        query = self.supabase.table("print_orders").select("*")

        if email:
            query = query.eq("email", email)

        response = query.order("created_at", desc=True).execute()

        orders = []
        for row in response.data:
            # Phase 2: 各注文の明細を取得
            items_response = (
                self.supabase.table("print_order_items")
                .select("*")
                .eq("order_id", row["id"])
                .execute()
            )
            items = [PrintOrderItem(**item) for item in items_response.data] if items_response.data else []
            row["items"] = items
            orders.append(PrintOrder(**row))

        return orders

    def get_order_by_id(self, order_id: str) -> Optional[PrintOrder]:
        """IDで注文を取得（Phase 2: 明細含む）"""
        response = (
            self.supabase.table("print_orders")
            .select("*")
            .eq("id", order_id)
            .single()
            .execute()
        )

        if not response.data:
            return None

        order_data = response.data

        # Phase 2: 注文明細を取得
        items_response = (
            self.supabase.table("print_order_items")
            .select("*")
            .eq("order_id", order_id)
            .execute()
        )

        items = [PrintOrderItem(**item) for item in items_response.data] if items_response.data else []
        order_data["items"] = items

        return PrintOrder(**order_data)

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
