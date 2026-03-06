-- Phase 2: 複数商品選択機能 - print_order_itemsテーブル追加
-- 実行場所: Supabase SQL Editor

-- print_order_itemsテーブル作成
CREATE TABLE print_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES print_orders(id) ON DELETE CASCADE,
  product_type VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  design_fee INTEGER DEFAULT 0 CHECK (design_fee >= 0),
  delivery_days INTEGER DEFAULT 7,
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- インデックス作成
CREATE INDEX idx_print_order_items_order_id ON print_order_items(order_id);
CREATE INDEX idx_print_order_items_product_type ON print_order_items(product_type);

-- RLS有効化
ALTER TABLE print_order_items ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 自分の注文の明細のみ閲覧可能
CREATE POLICY "Users can view their own order items"
  ON print_order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM print_orders
      WHERE print_orders.id = print_order_items.order_id
      AND print_orders.email = auth.jwt() ->> 'email'
    )
  );

-- RLSポリシー: 認証済みユーザーが注文明細を作成可能
CREATE POLICY "Authenticated users can create order items"
  ON print_order_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLSポリシー: システム管理者は全ての注文明細を閲覧・更新可能
CREATE POLICY "System admins can view all order items"
  ON print_order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

CREATE POLICY "System admins can update all order items"
  ON print_order_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

-- コメント追加
COMMENT ON TABLE print_order_items IS '印刷物注文明細テーブル';
COMMENT ON COLUMN print_order_items.order_id IS '注文ID（print_ordersへの外部キー）';
COMMENT ON COLUMN print_order_items.product_type IS '商品種類';
COMMENT ON COLUMN print_order_items.quantity IS '数量';
COMMENT ON COLUMN print_order_items.unit_price IS '単価（円）';
COMMENT ON COLUMN print_order_items.subtotal IS '小計（円）= unit_price × quantity';
COMMENT ON COLUMN print_order_items.design_fee IS 'デザイン料（円）';
COMMENT ON COLUMN print_order_items.delivery_days IS '納期（日数）';
COMMENT ON COLUMN print_order_items.specifications IS '仕様詳細（JSON形式）';

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_print_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_print_order_items_updated_at
  BEFORE UPDATE ON print_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_print_order_items_updated_at();

-- print_ordersテーブルの修正
-- product_type, quantityカラムを削除（明細テーブルに移行）
ALTER TABLE print_orders
DROP COLUMN IF EXISTS product_type,
DROP COLUMN IF EXISTS quantity;

-- total_amountカラムを追加（全明細の合計金額）
ALTER TABLE print_orders
ADD COLUMN IF NOT EXISTS total_amount INTEGER DEFAULT 0 CHECK (total_amount >= 0);

COMMENT ON COLUMN print_orders.total_amount IS '合計金額（円）= sum(print_order_items.subtotal) + 送料';

-- 確認
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'print_order_items'
ORDER BY ordinal_position;

-- テストデータ挿入（任意）
-- INSERT INTO print_orders (clinic_name, email, pattern, delivery_address, daytime_contact, terms_agreed, total_amount)
-- VALUES ('テストクリニック', 'test@example.com', 'reorder', '東京都千代田区', '03-1234-5678', true, 13500);
--
-- INSERT INTO print_order_items (order_id, product_type, quantity, unit_price, subtotal, design_fee, delivery_days)
-- VALUES
--   ((SELECT id FROM print_orders WHERE email = 'test@example.com' ORDER BY created_at DESC LIMIT 1), '名刺（片面・カラー）', 100, 2500, 2500, 0, 7),
--   ((SELECT id FROM print_orders WHERE email = 'test@example.com' ORDER BY created_at DESC LIMIT 1), 'リコールハガキ（官製はがき）', 200, 12000, 12000, 0, 7);
