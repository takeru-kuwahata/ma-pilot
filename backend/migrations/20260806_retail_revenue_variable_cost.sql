-- ============================================================
-- 月次データ: 物販収入・変動費の専用列追加とデータ移行
-- 実行日: 2026-08-06
-- 背景: 旧4コスト列(personnel/material/fixed/other)を経路ごとに
--       転用していたため、物販がコスト扱い・変動費が二重計上になっていた
-- 実行順序:
--   Step 1（本ファイル）: デプロイ前に実行（列追加＋データ移行）
--   Step 2（drop_legacy_cost_columns.sql）: 新コードのデプロイ完了確認後に実行
-- ============================================================

-- Step 1-1: 列追加（冪等）
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS retail_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE monthly_data ADD COLUMN IF NOT EXISTS variable_cost NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Step 1-2: 既存データ移行
-- ・物販: CSV取込がother_cost列に格納していた → retail_revenueへ
-- ・変動費: CSV取込はmaterial_cost、手動入力はpersonnel_costに格納していた
--   （両方に値がある行は二重計上状態。material_costを正とする）
UPDATE monthly_data SET
  retail_revenue = other_cost,
  variable_cost = CASE WHEN material_cost > 0 THEN material_cost ELSE personnel_cost END
WHERE retail_revenue = 0 AND variable_cost = 0;

-- Step 1-3: 総売上を「保険 + 自費 + 物販」で再計算
UPDATE monthly_data SET
  total_revenue = insurance_revenue + self_pay_revenue + retail_revenue,
  average_revenue_per_patient = CASE
    WHEN total_patients > 0
    THEN (insurance_revenue + self_pay_revenue + retail_revenue) / total_patients
    ELSE 0
  END;

-- Step 1-4: シミュレーション入力(JSONB)の旧2レート → 変動費率1本に統合
UPDATE simulations SET
  input = (input - 'assumed_personnel_cost_rate' - 'assumed_material_cost_rate')
    || jsonb_build_object(
      'assumed_variable_cost_rate',
      COALESCE((input->>'assumed_personnel_cost_rate')::numeric, 0)
        + COALESCE((input->>'assumed_material_cost_rate')::numeric, 0)
    )
WHERE input ? 'assumed_personnel_cost_rate';

-- ============================================================
-- ロールバック（列は復元可能。二重計上等の移行前の値には戻らない点に注意）
-- ============================================================
-- UPDATE monthly_data SET other_cost = retail_revenue, material_cost = variable_cost;
-- UPDATE monthly_data SET total_revenue = insurance_revenue + self_pay_revenue;
-- ALTER TABLE monthly_data DROP COLUMN IF EXISTS retail_revenue;
-- ALTER TABLE monthly_data DROP COLUMN IF EXISTS variable_cost;
-- UPDATE simulations SET
--   input = (input - 'assumed_variable_cost_rate')
--     || jsonb_build_object(
--       'assumed_personnel_cost_rate', COALESCE((input->>'assumed_variable_cost_rate')::numeric, 0),
--       'assumed_material_cost_rate', 0)
-- WHERE input ? 'assumed_variable_cost_rate';
