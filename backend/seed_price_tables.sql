-- ============================================
-- 価格マスタ (price_tables) テーブル作成とサンプルデータ投入
-- ============================================

-- 既存のテーブルを削除（開発環境のみ）
DROP TABLE IF EXISTS price_tables CASCADE;

-- 価格マスタテーブル作成
CREATE TABLE price_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price INTEGER NOT NULL CHECK (price >= 0),
  design_fee INTEGER NOT NULL DEFAULT 0 CHECK (design_fee >= 0),
  design_fee_included BOOLEAN NOT NULL DEFAULT false,
  specifications JSONB,
  delivery_days INTEGER NOT NULL CHECK (delivery_days > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_type, quantity)
);

-- インデックス作成
CREATE INDEX idx_price_tables_product_type ON price_tables(product_type);
CREATE INDEX idx_price_tables_quantity ON price_tables(quantity);

-- RLS有効化（全ユーザーが読み取り可能）
ALTER TABLE price_tables ENABLE ROW LEVEL SECURITY;

-- 読み取りポリシー（認証済みユーザー全員が読み取り可能）
CREATE POLICY "価格マスタは認証済みユーザーが閲覧可能"
  ON price_tables
  FOR SELECT
  TO authenticated
  USING (true);

-- 更新ポリシー（system_adminのみ）
CREATE POLICY "価格マスタはシステム管理者のみ編集可能"
  ON price_tables
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

-- ============================================
-- サンプルデータ投入
-- ============================================

-- 診察券
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, specifications, delivery_days)
VALUES
  ('診察券', 500, 19500, 0, true, '{"corner_radius": "角丸なし", "coating": "なし"}'::jsonb, 14),
  ('診察券', 1000, 25500, 0, true, '{"corner_radius": "角丸なし", "coating": "なし"}'::jsonb, 14),
  ('診察券', 2000, 34500, 0, true, '{"corner_radius": "角丸なし", "coating": "なし"}'::jsonb, 14),
  ('診察券', 3000, 43500, 0, true, '{"corner_radius": "角丸なし", "coating": "なし"}'::jsonb, 14),
  ('診察券', 5000, 56500, 0, true, '{"corner_radius": "角丸なし", "coating": "なし"}'::jsonb, 14);

-- 名刺
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, specifications, delivery_days)
VALUES
  ('名刺', 100, 2500, 4500, false, '{"coating": "なし"}'::jsonb, 10),
  ('名刺', 200, 4000, 4500, false, '{"coating": "なし"}'::jsonb, 10),
  ('名刺', 300, 6000, 4500, false, '{"coating": "なし"}'::jsonb, 10);

-- リコールハガキ
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, specifications, delivery_days)
VALUES
  ('リコールハガキ', 100, 7500, 5000, false, '{"type": "standard"}'::jsonb, 10),
  ('リコールハガキ', 200, 12000, 5000, false, '{"type": "standard"}'::jsonb, 10),
  ('リコールハガキ', 300, 16500, 5000, false, '{"type": "standard"}'::jsonb, 10);

-- A4三つ折りリーフレット
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, specifications, delivery_days)
VALUES
  ('A4三つ折りリーフレット', 300, 27000, 0, true, '{"coating": "マット加工"}'::jsonb, 14),
  ('A4三つ折りリーフレット', 500, 35000, 0, true, '{"coating": "マット加工"}'::jsonb, 14),
  ('A4三つ折りリーフレット', 1000, 50000, 0, true, '{"coating": "マット加工"}'::jsonb, 14);

-- ネームプレート
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, specifications, delivery_days)
VALUES
  ('ネームプレート', 1, 3550, 850, false, '{"type": "1名", "material": "アクリル"}'::jsonb, 7),
  ('ネームプレート', 5, 7750, 4250, false, '{"type": "5名", "material": "アクリル"}'::jsonb, 7),
  ('ネームプレート', 10, 14000, 8500, false, '{"type": "10名", "material": "アクリル"}'::jsonb, 7);

-- ============================================
-- 確認クエリ
-- ============================================

-- 投入データ確認
SELECT
  product_type,
  quantity,
  price,
  design_fee,
  design_fee_included,
  specifications,
  delivery_days
FROM price_tables
ORDER BY product_type, quantity;

-- 商品種類ごとの数量オプション確認
SELECT
  product_type,
  array_agg(quantity ORDER BY quantity) as available_quantities
FROM price_tables
GROUP BY product_type
ORDER BY product_type;
