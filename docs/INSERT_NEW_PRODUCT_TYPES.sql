-- 新しい商品種類を price_tables に追加
-- 実行場所: Supabase SQL Editor

-- 既存の「名刺」データを削除
DELETE FROM price_tables WHERE product_type = '名刺';

-- 既存の「リコールハガキ」データを削除
DELETE FROM price_tables WHERE product_type = 'リコールハガキ';

-- 名刺（片面・カラー）を追加
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, delivery_days)
VALUES
  ('名刺（片面・カラー）', 100, 2500, 0, false, 7),
  ('名刺（片面・カラー）', 200, 4000, 0, false, 7),
  ('名刺（片面・カラー）', 300, 6000, 0, false, 7);

-- 名刺（片面・モノクロ）を追加
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, delivery_days)
VALUES
  ('名刺（片面・モノクロ）', 100, 2000, 0, false, 7),
  ('名刺（片面・モノクロ）', 200, 3200, 0, false, 7),
  ('名刺（片面・モノクロ）', 300, 4800, 0, false, 7);

-- 名刺（両面・カラー）を追加
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, delivery_days)
VALUES
  ('名刺（両面・カラー）', 100, 3500, 0, false, 7),
  ('名刺（両面・カラー）', 200, 5600, 0, false, 7),
  ('名刺（両面・カラー）', 300, 8400, 0, false, 7);

-- 名刺（両面・モノクロ）を追加
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, delivery_days)
VALUES
  ('名刺（両面・モノクロ）', 100, 2800, 0, false, 7),
  ('名刺（両面・モノクロ）', 200, 4480, 0, false, 7),
  ('名刺（両面・モノクロ）', 300, 6720, 0, false, 7);

-- リコールハガキ（官製はがき）を追加
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, delivery_days)
VALUES
  ('リコールハガキ（官製はがき）', 100, 7500, 0, false, 7),
  ('リコールハガキ（官製はがき）', 200, 12000, 0, false, 7),
  ('リコールハガキ（官製はがき）', 300, 16500, 0, false, 7);

-- リコールハガキ（ポストカード）を追加
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, delivery_days)
VALUES
  ('リコールハガキ（ポストカード）', 100, 8000, 0, false, 7),
  ('リコールハガキ（ポストカード）', 200, 12800, 0, false, 7),
  ('リコールハガキ（ポストカード）', 300, 17600, 0, false, 7);

-- 確認
SELECT product_type, quantity, price, delivery_days
FROM price_tables
WHERE product_type LIKE '名刺%' OR product_type LIKE 'リコールハガキ%'
ORDER BY product_type, quantity;
