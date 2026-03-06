-- print_orders テーブルを再作成（コードに合わせた構造）
-- 実行場所: Supabase SQL Editor

-- 既存テーブルを削除（注意: データも削除されます）
DROP TABLE IF EXISTS print_orders CASCADE;

-- 新しい構造でテーブル作成
CREATE TABLE print_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  pattern VARCHAR(20) NOT NULL CHECK (pattern IN ('consultation', 'reorder')),
  product_type VARCHAR(100),
  quantity INTEGER CHECK (quantity > 0),
  specifications TEXT,
  delivery_date TIMESTAMP WITH TIME ZONE,
  design_required BOOLEAN DEFAULT FALSE,
  notes TEXT,
  estimated_price INTEGER,
  payment_method VARCHAR(20) CHECK (payment_method IN ('stripe', 'invoice')),
  payment_status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (payment_status IN ('pending', 'paid', 'invoiced')),
  order_status VARCHAR(20) DEFAULT 'submitted' NOT NULL CHECK (order_status IN ('submitted', 'confirmed', 'in_production', 'shipped', 'completed', 'cancelled')),
  stripe_payment_intent_id VARCHAR(255),
  -- Phase 1 追加フィールド
  delivery_address TEXT,
  daytime_contact VARCHAR(100),
  terms_agreed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- インデックス作成
CREATE INDEX idx_print_orders_email ON print_orders(email);
CREATE INDEX idx_print_orders_pattern ON print_orders(pattern);
CREATE INDEX idx_print_orders_order_status ON print_orders(order_status);
CREATE INDEX idx_print_orders_created_at ON print_orders(created_at DESC);

-- RLS (Row Level Security) 有効化
ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 全ユーザーが自分のメールアドレスの注文を読み取れる
CREATE POLICY "Users can view their own orders"
  ON print_orders
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- RLSポリシー: 認証済みユーザーが注文を作成できる
CREATE POLICY "Authenticated users can create orders"
  ON print_orders
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLSポリシー: システム管理者は全ての注文を閲覧・更新できる
CREATE POLICY "System admins can view all orders"
  ON print_orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

CREATE POLICY "System admins can update all orders"
  ON print_orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

-- コメント追加
COMMENT ON TABLE print_orders IS '印刷物注文テーブル';
COMMENT ON COLUMN print_orders.clinic_name IS 'クリニック名';
COMMENT ON COLUMN print_orders.email IS 'メールアドレス';
COMMENT ON COLUMN print_orders.pattern IS '注文パターン (consultation: 相談, reorder: 再注文)';
COMMENT ON COLUMN print_orders.product_type IS '商品種類';
COMMENT ON COLUMN print_orders.quantity IS '数量';
COMMENT ON COLUMN print_orders.specifications IS '仕様詳細 (JSON形式文字列)';
COMMENT ON COLUMN print_orders.delivery_date IS '納期希望日';
COMMENT ON COLUMN print_orders.design_required IS 'デザイン作成要否';
COMMENT ON COLUMN print_orders.notes IS '備考';
COMMENT ON COLUMN print_orders.estimated_price IS '見積もり金額（円）';
COMMENT ON COLUMN print_orders.payment_method IS '決済方法';
COMMENT ON COLUMN print_orders.payment_status IS '決済ステータス';
COMMENT ON COLUMN print_orders.order_status IS '注文ステータス';
COMMENT ON COLUMN print_orders.stripe_payment_intent_id IS 'Stripe PaymentIntent ID';
COMMENT ON COLUMN print_orders.delivery_address IS '納品先住所';
COMMENT ON COLUMN print_orders.daytime_contact IS '日中連絡先';
COMMENT ON COLUMN print_orders.terms_agreed IS '注意事項への同意';

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_print_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_print_orders_updated_at
  BEFORE UPDATE ON print_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_print_orders_updated_at();

-- 確認
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'print_orders'
ORDER BY ordinal_position;
