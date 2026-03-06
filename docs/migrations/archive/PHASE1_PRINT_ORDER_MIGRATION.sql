-- Phase 1: 印刷物発注フォーム機能拡張
-- 実行場所: Supabase SQL Editor

-- print_orders テーブルに新しいカラムを追加
ALTER TABLE print_orders
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS daytime_contact VARCHAR(100),
ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT FALSE;

-- コメント追加
COMMENT ON COLUMN print_orders.delivery_address IS '納品先住所';
COMMENT ON COLUMN print_orders.daytime_contact IS '日中連絡先（電話番号等）';
COMMENT ON COLUMN print_orders.terms_agreed IS '注意事項への同意';

-- 既存データの確認
SELECT
  id,
  clinic_name,
  product_type,
  quantity,
  delivery_address,
  daytime_contact,
  terms_agreed,
  created_at
FROM print_orders
ORDER BY created_at DESC
LIMIT 5;
