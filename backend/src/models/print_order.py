from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class PrintOrderPattern(str, Enum):
    """注文パターン"""
    CONSULTATION = "consultation"  # パターンA/B: 相談フォーム
    REORDER = "reorder"           # パターンC: 再注文


class PaymentMethod(str, Enum):
    """決済方法"""
    STRIPE = "stripe"
    INVOICE = "invoice"


class PaymentStatus(str, Enum):
    """決済ステータス"""
    PENDING = "pending"
    PAID = "paid"
    INVOICED = "invoiced"


class OrderStatus(str, Enum):
    """注文ステータス"""
    SUBMITTED = "submitted"
    CONFIRMED = "confirmed"
    IN_PRODUCTION = "in_production"
    SHIPPED = "shipped"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# ============================================
# 価格表関連モデル
# ============================================

class PriceTable(BaseModel):
    """価格マスタ"""
    id: str
    product_type: str
    quantity: int
    price: int
    design_fee: int
    design_fee_included: bool
    specifications: Optional[str] = None
    delivery_days: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PriceTableCreate(BaseModel):
    """価格マスタ作成"""
    product_type: str
    quantity: int = Field(..., gt=0)
    price: int = Field(..., ge=0)
    design_fee: int = Field(default=0, ge=0)
    design_fee_included: bool = False
    specifications: Optional[str] = None
    delivery_days: int = Field(default=14, gt=0)


# ============================================
# 見積もり関連モデル
# ============================================

class PriceEstimateRequest(BaseModel):
    """見積もり計算リクエスト"""
    product_type: str
    quantity: int = Field(..., gt=0)
    specifications: Optional[Dict[str, Any]] = None
    design_required: Optional[bool] = False


class PriceEstimateBreakdown(BaseModel):
    """見積もり内訳"""
    base_price: int
    design_fee: int
    total: int


class PriceEstimateResponse(BaseModel):
    """見積もり計算レスポンス"""
    estimated_price: int
    breakdown: PriceEstimateBreakdown
    delivery_days: int
    price_table_id: str


# ============================================
# 注文関連モデル
# ============================================

class PrintOrderItem(BaseModel):
    """印刷物注文明細（Phase 2）"""
    id: str
    order_id: str
    product_type: str
    quantity: int
    unit_price: int
    subtotal: int
    design_fee: int = 0
    delivery_days: int = 7
    specifications: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PrintOrderItemCreate(BaseModel):
    """印刷物注文明細作成"""
    product_type: str = Field(..., min_length=1, max_length=100)
    quantity: int = Field(..., gt=0)
    unit_price: Optional[int] = Field(None, ge=0)  # 自動計算可能
    subtotal: Optional[int] = Field(None, ge=0)    # 自動計算可能
    design_fee: Optional[int] = Field(0, ge=0)
    delivery_days: Optional[int] = Field(7, gt=0)
    specifications: Optional[Dict[str, Any]] = None


class PrintOrder(BaseModel):
    """印刷物注文"""
    id: str
    clinic_name: str
    email: EmailStr
    pattern: PrintOrderPattern
    specifications: Optional[str] = None
    delivery_date: Optional[datetime] = None
    design_required: Optional[bool] = False
    notes: Optional[str] = None
    estimated_price: Optional[int] = None
    total_amount: Optional[int] = None  # Phase 2追加
    payment_method: Optional[PaymentMethod] = None
    payment_status: PaymentStatus = PaymentStatus.PENDING
    order_status: OrderStatus = OrderStatus.SUBMITTED
    stripe_payment_intent_id: Optional[str] = None
    delivery_address: Optional[str] = None  # Phase 1
    daytime_contact: Optional[str] = None   # Phase 1
    terms_agreed: Optional[bool] = False    # Phase 1
    items: Optional[List[PrintOrderItem]] = None  # Phase 2: 注文明細
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PrintOrderCreate(BaseModel):
    """印刷物注文作成"""
    clinic_name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    pattern: PrintOrderPattern
    # Phase 2: 複数商品対応
    items: Optional[List[PrintOrderItemCreate]] = None  # 商品明細リスト
    # 後方互換性のため残す（相談モードで使用）
    product_type: Optional[str] = Field(None, max_length=100)
    quantity: Optional[int] = Field(None, gt=0)
    specifications: Optional[Dict[str, Any]] = None
    delivery_date: Optional[str] = None  # ISO 8601形式
    design_required: Optional[bool] = False
    notes: Optional[str] = None
    # Phase 1 追加フィールド
    delivery_address: Optional[str] = Field(None, max_length=500)
    daytime_contact: Optional[str] = Field(None, max_length=100)
    terms_agreed: Optional[bool] = False
    # Phase 2 追加フィールド
    payment_method: Optional[PaymentMethod] = None


class PrintOrderUpdate(BaseModel):
    """印刷物注文更新"""
    order_status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None
    stripe_payment_intent_id: Optional[str] = None


class PrintOrderApprove(BaseModel):
    """見積もり承認"""
    payment_method: PaymentMethod


# ============================================
# APIレスポンス関連モデル
# ============================================

class ApiResponse(BaseModel):
    """汎用APIレスポンス"""
    data: Any
    message: Optional[str] = None


class ApiError(BaseModel):
    """APIエラーレスポンス"""
    error: str
    message: str
    status_code: int
