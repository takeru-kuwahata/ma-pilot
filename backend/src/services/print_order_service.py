from typing import List, Optional
import json
import logging
from supabase import Client

logger = logging.getLogger(__name__)
from ..models import (
    PriceTable,
    PriceTableCreate,
    PriceTableUpdate,
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

    def create_price_table(self, data: PriceTableCreate) -> PriceTable:
        """価格表を新規作成"""
        payload = data.model_dump(exclude_none=True)
        response = self.supabase.table("price_tables").insert(payload).execute()
        return PriceTable(**response.data[0])

    def update_price_table(self, price_table_id: str, data: PriceTableUpdate) -> Optional[PriceTable]:
        """価格表を更新"""
        payload = data.model_dump(exclude_none=True)
        if not payload:
            return self.get_price_table_by_id(price_table_id)
        response = (
            self.supabase.table("price_tables")
            .update(payload)
            .eq("id", price_table_id)
            .execute()
        )
        return PriceTable(**response.data[0]) if response.data else None

    def delete_price_table(self, price_table_id: str) -> bool:
        """価格表を削除"""
        self.supabase.table("price_tables").delete().eq("id", price_table_id).execute()
        return True

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
            if not order_data.items or len(order_data.items) == 0:
                raise ValueError("再注文パターンでは商品明細が必須です")

            # 各商品の価格を計算
            for item in order_data.items:
                price_table = self.find_matching_price_table(
                    item.product_type, item.quantity
                )
                if not price_table:
                    raise ValueError(
                        f"商品種類 '{item.product_type}' 数量 {item.quantity} の価格マスタが見つかりません"
                    )
                total_amount += price_table.price

            # 送料を加算（定額1000円）
            SHIPPING_FEE = 1000
            total_amount += SHIPPING_FEE
            estimated_price = total_amount

        # print_ordersテーブルに挿入
        insert_data = {
            "clinic_id": order_data.clinic_id,
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

        # Phase 2: print_order_itemsテーブルに明細を挿入（補償トランザクション付き）
        try:
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
        except Exception as items_err:
            # 明細挿入失敗時: 注文レコードをロールバック
            try:
                self.supabase.table("print_orders").delete().eq("id", order_id).execute()
            except Exception as rollback_err:
                logger.error('Order rollback failed for order_id=%s: %s', order_id, rollback_err)
            raise ValueError(f'注文明細の登録に失敗しました: {str(items_err)}')

        # 注文データを再取得（明細含む）
        created_order = self.get_order_by_id(order_id)

        # メール送信はフロントエンドから send_order_emails() を呼び出すタイミングで行う
        # （添付ファイルと注文受付を1通にまとめるため）
        return created_order

    def send_order_emails(self, created_order, order_data=None, attachments: list = None) -> None:
        """注文受付メールをクリニック・スタッフ両方に送信する。
        attachments: [{'filename': '...', 'content': '<base64>'}] 形式のリスト（任意）
        """
        # 商品明細テキスト生成
        if order_data and order_data.items and len(order_data.items) > 0:
            items_lines = "\n".join(
                f"  - {item.product_type}：{item.quantity}枚"
                for item in order_data.items
            )
            items_text = f"■商品明細\n{items_lines}"
            product_summary = items_text
        elif order_data:
            items_text = None
            if order_data.product_type and order_data.quantity:
                product_summary = f"■商品情報\n  - {order_data.product_type}：{order_data.quantity}枚（参考）"
            elif order_data.product_type:
                product_summary = f"■商品情報\n  - {order_data.product_type}（数量未定）"
            else:
                product_summary = "（商品・数量は担当者と相談）"
        else:
            items_text = None
            product_summary = "（商品・数量は担当者と相談）"

        pattern_str = created_order.pattern.value if hasattr(created_order.pattern, 'value') else str(created_order.pattern)

        self.email_service.send_order_confirmation_to_clinic(
            order_id=created_order.id,
            clinic_name=created_order.clinic_name,
            email=created_order.email,
            product_type=product_summary,
            quantity=None,
            estimated_price=created_order.estimated_price,
            items_text=items_text if items_text else product_summary,
            pattern=pattern_str,
            attachments=attachments or [],
        )

        self.email_service.send_order_notification_to_staff(
            order_id=created_order.id,
            clinic_name=created_order.clinic_name,
            clinic_email=created_order.email,
            product_type=product_summary,
            quantity=None,
            pattern=created_order.pattern,
            notes=created_order.notes,
            attachments=attachments or [],
        )

    def get_orders(
        self,
        clinic_id: Optional[str] = None,
        email: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[PrintOrder]:
        """注文一覧を取得（Phase 2: 明細含む）"""
        query = self.supabase.table("print_orders").select("*")

        if clinic_id:
            query = query.eq("clinic_id", clinic_id)

        if email:
            query = query.eq("email", email)

        if status:
            query = query.eq("status", status)

        response = query.order("created_at", desc=True).execute()

        if not response.data:
            return []

        # 全注文の明細を一括取得（N+1問題を解消）
        order_ids = [row["id"] for row in response.data]
        items_response = (
            self.supabase.table("print_order_items")
            .select("*")
            .in_("order_id", order_ids)
            .execute()
        )
        items_by_order: dict = {}
        for item in (items_response.data or []):
            oid = item["order_id"]
            if oid not in items_by_order:
                items_by_order[oid] = []
            items_by_order[oid].append(PrintOrderItem(**item))

        orders = []
        for row in response.data:
            row["items"] = items_by_order.get(row["id"], [])
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
