-- ============================================================
-- Step 2: 旧コスト列の削除
-- ⚠️ 実行条件（すべて満たしてから実行）:
--   1. 20260806_retail_revenue_variable_cost.sql 適用済み
--   2. 新コード（personnel_cost/material_cost/other_cost 参照ゼロ）が
--      Render 本番にデプロイ完了していること
--   3. 本番ログイン＋基礎データ管理画面の表示を実機確認済み
-- ロールバック: 列は ADD COLUMN で復元可能だが、データは戻らない。
--   実行前に旧列の値を SELECT で CSV 保存しておくこと。
-- ============================================================

ALTER TABLE monthly_data DROP COLUMN IF EXISTS personnel_cost;
ALTER TABLE monthly_data DROP COLUMN IF EXISTS material_cost;
ALTER TABLE monthly_data DROP COLUMN IF EXISTS other_cost;
