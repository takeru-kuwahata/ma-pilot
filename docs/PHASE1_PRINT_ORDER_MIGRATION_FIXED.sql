-- Phase 1: 印刷物発注フォーム機能拡張（修正版）
-- 実行場所: Supabase SQL Editor

-- print_orders テーブルは既に items(jsonb)形式で複数商品対応済み
-- contact_info(jsonb) に納品先住所・日中連絡先を追加
-- 新しいカラムとして terms_agreed を追加

ALTER TABLE print_orders
ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN print_orders.terms_agreed IS '注意事項への同意';

-- contact_info の構造例:
-- {
--   "email": "user@example.com",
--   "delivery_address": "〒000-0000 東京都...",
--   "daytime_contact": "03-1234-5678"
-- }

-- 既存データの確認
SELECT
  id,
  clinic_id,
  order_type,
  items,
  total_amount,
  contact_info,
  terms_agreed,
  status,
  created_at
FROM print_orders
ORDER BY created_at DESC
LIMIT 5;
