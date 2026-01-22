-- ==========================================
-- 印刷物受注システム: データベーススキーマ
-- 作成日: 2025-12-25
-- ==========================================

-- ==========================================
-- 1. price_tables（価格マスタテーブル）
-- ==========================================
CREATE TABLE IF NOT EXISTS price_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type VARCHAR(100) NOT NULL, -- 商品種類（診察券、名刺、リコールハガキ等）
  quantity INTEGER NOT NULL, -- 数量
  price INTEGER NOT NULL, -- 価格（円）
  design_fee INTEGER NOT NULL DEFAULT 0, -- デザイン費（円）
  design_fee_included BOOLEAN NOT NULL DEFAULT false, -- デザイン費込みかどうか
  specifications TEXT, -- 仕様詳細（角丸半径、加工種類等）JSON形式で格納
  delivery_days INTEGER NOT NULL DEFAULT 14, -- 納期（日数）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ユニーク制約: 同じ商品種類・数量・仕様の組み合わせは1つのみ
  CONSTRAINT unique_price_entry UNIQUE (product_type, quantity, specifications)
);

-- price_tablesのインデックス
CREATE INDEX idx_price_tables_product_type ON price_tables(product_type);
CREATE INDEX idx_price_tables_quantity ON price_tables(quantity);

-- price_tablesのコメント
COMMENT ON TABLE price_tables IS '印刷物価格マスタテーブル';
COMMENT ON COLUMN price_tables.id IS '価格マスタID';
COMMENT ON COLUMN price_tables.product_type IS '商品種類';
COMMENT ON COLUMN price_tables.quantity IS '数量';
COMMENT ON COLUMN price_tables.price IS '価格（円）';
COMMENT ON COLUMN price_tables.design_fee IS 'デザイン費（円）';
COMMENT ON COLUMN price_tables.design_fee_included IS 'デザイン費込みかどうか（true: 込み、false: 別途）';
COMMENT ON COLUMN price_tables.specifications IS '仕様詳細（JSON形式）';
COMMENT ON COLUMN price_tables.delivery_days IS '納期（日数）';

-- ==========================================
-- 2. print_orders（印刷物注文テーブル）
-- ==========================================
CREATE TABLE IF NOT EXISTS print_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name VARCHAR(200) NOT NULL, -- クリニック名（必須）
  email VARCHAR(255) NOT NULL, -- メールアドレス（必須）
  pattern VARCHAR(20) NOT NULL CHECK (pattern IN ('consultation', 'reorder')), -- パターン（consultation: A/B統合、reorder: C）
  product_type VARCHAR(100), -- 商品種類（パターンCでは必須）
  quantity INTEGER, -- 数量（パターンCでは必須）
  specifications TEXT, -- 仕様詳細（JSON形式）
  delivery_date DATE, -- 納期希望日
  design_required BOOLEAN DEFAULT false, -- デザイン要否
  notes TEXT, -- 備考（自由記述）
  estimated_price INTEGER, -- 見積もり金額（円、パターンCのみ）
  payment_method VARCHAR(20) CHECK (payment_method IN ('stripe', 'invoice', NULL)), -- 決済方法
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'invoiced')), -- 決済ステータス
  order_status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (order_status IN ('submitted', 'confirmed', 'in_production', 'shipped', 'completed', 'cancelled')), -- 注文ステータス
  stripe_payment_intent_id VARCHAR(255), -- Stripe PaymentIntent ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- パターンCの場合、product_type、quantity、estimated_priceは必須
  CONSTRAINT check_reorder_fields CHECK (
    pattern = 'consultation' OR
    (pattern = 'reorder' AND product_type IS NOT NULL AND quantity IS NOT NULL AND estimated_price IS NOT NULL)
  )
);

-- print_ordersのインデックス
CREATE INDEX idx_print_orders_email ON print_orders(email);
CREATE INDEX idx_print_orders_pattern ON print_orders(pattern);
CREATE INDEX idx_print_orders_order_status ON print_orders(order_status);
CREATE INDEX idx_print_orders_created_at ON print_orders(created_at DESC);

-- print_ordersのコメント
COMMENT ON TABLE print_orders IS '印刷物注文テーブル';
COMMENT ON COLUMN print_orders.id IS '注文ID';
COMMENT ON COLUMN print_orders.clinic_name IS 'クリニック名';
COMMENT ON COLUMN print_orders.email IS 'メールアドレス';
COMMENT ON COLUMN print_orders.pattern IS '注文パターン（consultation: 相談、reorder: 再注文）';
COMMENT ON COLUMN print_orders.product_type IS '商品種類';
COMMENT ON COLUMN print_orders.quantity IS '数量';
COMMENT ON COLUMN print_orders.specifications IS '仕様詳細（JSON形式）';
COMMENT ON COLUMN print_orders.delivery_date IS '納期希望日';
COMMENT ON COLUMN print_orders.design_required IS 'デザイン要否';
COMMENT ON COLUMN print_orders.notes IS '備考';
COMMENT ON COLUMN print_orders.estimated_price IS '見積もり金額（円）';
COMMENT ON COLUMN print_orders.payment_method IS '決済方法（stripe: クレジットカード、invoice: 請求書）';
COMMENT ON COLUMN print_orders.payment_status IS '決済ステータス';
COMMENT ON COLUMN print_orders.order_status IS '注文ステータス';
COMMENT ON COLUMN print_orders.stripe_payment_intent_id IS 'Stripe PaymentIntent ID';

-- ==========================================
-- 3. トリガー関数: updated_atの自動更新
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- price_tablesのトリガー
CREATE TRIGGER update_price_tables_updated_at
  BEFORE UPDATE ON price_tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- print_ordersのトリガー
CREATE TRIGGER update_print_orders_updated_at
  BEFORE UPDATE ON print_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 4. Row Level Security (RLS) 設定
-- ==========================================

-- price_tablesのRLS有効化
ALTER TABLE price_tables ENABLE ROW LEVEL SECURITY;

-- price_tablesのポリシー: 全ユーザー読み取り可能
CREATE POLICY "価格マスタは全員が閲覧可能"
  ON price_tables FOR SELECT
  USING (true);

-- price_tablesのポリシー: システム管理者のみ作成・更新・削除可能（将来実装）
-- ※ MVP版では管理画面未実装のため、一時的に全ユーザー許可
CREATE POLICY "価格マスタの変更は全員可能（MVP版暫定）"
  ON price_tables FOR ALL
  USING (true)
  WITH CHECK (true);

-- print_ordersのRLS有効化
ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;

-- print_ordersのポリシー: 自分のメールアドレスで登録した注文のみ閲覧可能
-- ※ MVP版では認証なしのため、一時的に全ユーザー許可
CREATE POLICY "注文は全員が閲覧可能（MVP版暫定）"
  ON print_orders FOR SELECT
  USING (true);

-- print_ordersのポリシー: 全ユーザーが注文作成可能
CREATE POLICY "注文は全員が作成可能"
  ON print_orders FOR INSERT
  WITH CHECK (true);

-- print_ordersのポリシー: 自分のメールアドレスで登録した注文のみ更新可能（MVP版暫定）
CREATE POLICY "注文は全員が更新可能（MVP版暫定）"
  ON print_orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- 5. サンプルデータ投入（開発用）
-- ==========================================

-- 診察券の価格マスタサンプル
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, specifications, delivery_days) VALUES
  ('診察券', 500, 19500, 0, true, '{"corner_radius": "角丸なし", "coating": "なし"}', 14),
  ('診察券', 1000, 25500, 0, true, '{"corner_radius": "角丸なし", "coating": "なし"}', 14),
  ('診察券', 2000, 34500, 0, true, '{"corner_radius": "角丸なし", "coating": "なし"}', 14),
  ('診察券', 3000, 43500, 0, true, '{"corner_radius": "角丸なし", "coating": "なし"}', 14),
  ('診察券', 5000, 56500, 0, true, '{"corner_radius": "角丸なし", "coating": "なし"}', 14);

-- 名刺の価格マスタサンプル
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, specifications, delivery_days) VALUES
  ('名刺', 100, 2500, 4500, false, '{"coating": "なし"}', 10),
  ('名刺', 200, 4000, 4500, false, '{"coating": "なし"}', 10),
  ('名刺', 300, 6000, 4500, false, '{"coating": "なし"}', 10);

-- リコールハガキの価格マスタサンプル
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, specifications, delivery_days) VALUES
  ('リコールハガキ', 100, 7500, 5000, false, '{"type": "standard"}', 10),
  ('リコールハガキ', 200, 12000, 5000, false, '{"type": "standard"}', 10),
  ('リコールハガキ', 300, 16500, 5000, false, '{"type": "standard"}', 10);

-- パンフレット（A4三つ折り）の価格マスタサンプル
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, specifications, delivery_days) VALUES
  ('A4三つ折りリーフレット', 300, 27000, 0, true, '{"coating": "マット加工"}', 14),
  ('A4三つ折りリーフレット', 500, 35000, 0, true, '{"coating": "マット加工"}', 14),
  ('A4三つ折りリーフレット', 1000, 50000, 0, true, '{"coating": "マット加工"}', 14);

-- ネームプレートの価格マスタサンプル
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, specifications, delivery_days) VALUES
  ('ネームプレート', 1, 3550, 850, false, '{"type": "1名", "material": "アクリル"}', 7),
  ('ネームプレート', 5, 7750, 4250, false, '{"type": "5名", "material": "アクリル"}', 7),
  ('ネームプレート', 10, 14000, 8500, false, '{"type": "10名", "material": "アクリル"}', 7);

-- 注文サンプルデータ（パターンA/B: 相談フォーム）
INSERT INTO print_orders (clinic_name, email, pattern, product_type, quantity, notes, order_status) VALUES
  ('テスト歯科医院', 'test@clinic.example.com', 'consultation', '診察券', 1000, '初めての注文です。デザインについて相談したいです。', 'submitted');

-- 注文サンプルデータ（パターンC: 再注文）
INSERT INTO print_orders (clinic_name, email, pattern, product_type, quantity, specifications, delivery_date, design_required, estimated_price, payment_method, payment_status, order_status) VALUES
  ('サンプルクリニック', 'sample@clinic.example.com', 'reorder', '診察券', 2000, '{"corner_radius": "角丸なし", "coating": "なし"}', '2026-01-15', false, 34500, 'stripe', 'pending', 'submitted');
