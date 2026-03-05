-- 全商品種類をprice_tablesに追加
-- 実行場所: Supabase SQL Editor

-- 診察券（既存データがあれば削除）
DELETE FROM price_tables WHERE product_type = '診察券';
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, delivery_days)
VALUES
  ('診察券', 100, 8000, 0, false, 7),
  ('診察券', 200, 12800, 0, false, 7),
  ('診察券', 300, 17600, 0, false, 7),
  ('診察券', 500, 27500, 0, false, 7),
  ('診察券', 1000, 50000, 0, false, 7);

-- A4三つ折りリーフレット
DELETE FROM price_tables WHERE product_type = 'A4三つ折りリーフレット';
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, delivery_days)
VALUES
  ('A4三つ折りリーフレット', 100, 15000, 0, false, 10),
  ('A4三つ折りリーフレット', 200, 24000, 0, false, 10),
  ('A4三つ折りリーフレット', 300, 27000, 0, false, 10),
  ('A4三つ折りリーフレット', 500, 40000, 0, false, 10);

-- ネームプレート
DELETE FROM price_tables WHERE product_type = 'ネームプレート';
INSERT INTO price_tables (product_type, quantity, price, design_fee, design_fee_included, delivery_days)
VALUES
  ('ネームプレート', 1, 3550, 0, false, 14),
  ('ネームプレート', 2, 6160, 0, false, 14),
  ('ネームプレート', 3, 8770, 0, false, 14),
  ('ネームプレート', 5, 14000, 0, false, 14),
  ('ネームプレート', 10, 27000, 0, false, 14);

-- 確認
SELECT product_type, quantity, price, delivery_days
FROM price_tables
ORDER BY product_type, quantity;
