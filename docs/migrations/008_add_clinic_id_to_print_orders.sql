-- print_orders テーブルに clinic_id カラムを追加
-- 実行場所: Supabase SQL Editor

-- clinic_id カラムを追加
ALTER TABLE print_orders
ADD COLUMN clinic_id UUID;

-- clinic_id に外部キー制約を追加（オプション）
ALTER TABLE print_orders
ADD CONSTRAINT fk_print_orders_clinic
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

-- clinic_id にインデックスを追加
CREATE INDEX idx_print_orders_clinic_id ON print_orders(clinic_id);

-- コメント追加
COMMENT ON COLUMN print_orders.clinic_id IS 'クリニックID（外部キー）';

-- 既存データに対して clinic_name から clinic_id を逆引きして更新
-- ※ 既存データがある場合のみ実行
UPDATE print_orders po
SET clinic_id = c.id
FROM clinics c
WHERE po.clinic_name = c.name
AND po.clinic_id IS NULL;

-- 確認
SELECT id, clinic_id, clinic_name, email, pattern, created_at
FROM print_orders
ORDER BY created_at DESC
LIMIT 10;
