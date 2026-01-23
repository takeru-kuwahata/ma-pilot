-- MA-Pilot テストデータ投入SQL（修正版）
-- Supabase SQL Editorで実行してください

-- ============================================
-- 0. 既存ユーザーIDを確認
-- ============================================

-- まず、既存のユーザーを確認
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- ============================================
-- 1. テスト用医院データ作成
-- ============================================

-- 既存の最初のユーザーIDを使用して医院データを挿入
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 最初のユーザーIDを取得（admin@ma-pilot.localまたは最初のユーザー）
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email LIKE '%@ma-pilot.local' OR email LIKE '%admin%'
  ORDER BY created_at ASC
  LIMIT 1;

  -- ユーザーが見つからない場合は、最初のユーザーを使用
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  END IF;

  -- 医院データ挿入
  INSERT INTO clinics (id, name, postal_code, address, phone_number, latitude, longitude, owner_id, is_active)
  VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'さくら歯科クリニック',
    '150-0001',
    '東京都渋谷区神宮前1-1-1',
    '03-1234-5678',
    35.6762,
    139.7025,
    v_user_id,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    postal_code = EXCLUDED.postal_code,
    address = EXCLUDED.address,
    phone_number = EXCLUDED.phone_number,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    owner_id = EXCLUDED.owner_id,
    updated_at = now();

  RAISE NOTICE 'Clinic created with owner_id: %', v_user_id;
END $$;

-- ============================================
-- 2. 月次データ（過去6ヶ月分）
-- ============================================

INSERT INTO monthly_data (clinic_id, year_month, total_revenue, insurance_revenue, self_pay_revenue,
                          personnel_cost, material_cost, fixed_cost, other_cost,
                          new_patients, returning_patients, total_patients, treatment_count, average_revenue_per_patient)
VALUES
  -- 2025年10月
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, '2025-10', 8500000, 6000000, 2500000,
   2800000, 800000, 1200000, 500000, 35, 385, 420, 520, 20238),

  -- 2025年9月
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, '2025-09', 8100000, 5700000, 2400000,
   2700000, 750000, 1200000, 480000, 32, 368, 400, 495, 20250),

  -- 2025年8月
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, '2025-08', 7800000, 5500000, 2300000,
   2650000, 720000, 1200000, 450000, 28, 352, 380, 470, 20526),

  -- 2025年7月
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, '2025-07', 8200000, 5800000, 2400000,
   2750000, 770000, 1200000, 490000, 30, 370, 400, 500, 20500),

  -- 2025年6月
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, '2025-06', 8400000, 5900000, 2500000,
   2800000, 790000, 1200000, 500000, 33, 377, 410, 510, 20488),

  -- 2025年5月
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, '2025-05', 7900000, 5600000, 2300000,
   2680000, 740000, 1200000, 470000, 29, 356, 385, 480, 20519)
ON CONFLICT (clinic_id, year_month) DO UPDATE SET
  total_revenue = EXCLUDED.total_revenue,
  insurance_revenue = EXCLUDED.insurance_revenue,
  self_pay_revenue = EXCLUDED.self_pay_revenue,
  personnel_cost = EXCLUDED.personnel_cost,
  material_cost = EXCLUDED.material_cost,
  fixed_cost = EXCLUDED.fixed_cost,
  other_cost = EXCLUDED.other_cost,
  new_patients = EXCLUDED.new_patients,
  returning_patients = EXCLUDED.returning_patients,
  total_patients = EXCLUDED.total_patients,
  treatment_count = EXCLUDED.treatment_count,
  average_revenue_per_patient = EXCLUDED.average_revenue_per_patient,
  updated_at = now();

-- ============================================
-- 3. user_metadataテーブル（ユーザー補足情報）
-- ============================================

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- ユーザーIDを取得
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email LIKE '%@ma-pilot.local' OR email LIKE '%admin%'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  END IF;

  -- ユーザーメタデータ挿入
  INSERT INTO user_metadata (user_id, clinic_id, role, display_name)
  VALUES (
    v_user_id,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'system_admin',
    '田中太郎'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    clinic_id = EXCLUDED.clinic_id,
    role = EXCLUDED.role,
    display_name = EXCLUDED.display_name,
    updated_at = now();

  RAISE NOTICE 'User metadata created for user_id: %', v_user_id;
END $$;

-- ============================================
-- 4. 価格マスタ（印刷物受注用）
-- ============================================

INSERT INTO price_tables (id, product_name, category, unit_price, minimum_quantity, description)
VALUES
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, '診察券', 'card', 15000, 100, '標準的な診察券（100枚単位）'),
  ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, '名刺', 'card', 12000, 100, 'スタッフ用名刺（100枚単位）'),
  ('b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'リコールハガキ', 'postcard', 8000, 100, '定期検診案内ハガキ（100枚単位）')
ON CONFLICT (id) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  category = EXCLUDED.category,
  unit_price = EXCLUDED.unit_price,
  minimum_quantity = EXCLUDED.minimum_quantity,
  description = EXCLUDED.description,
  updated_at = now();

-- ============================================
-- 確認クエリ
-- ============================================

-- 医院データ確認
SELECT id, name, postal_code, address, owner_id FROM clinics;

-- 月次データ確認
SELECT clinic_id, year_month, total_revenue, total_patients FROM monthly_data ORDER BY year_month DESC;

-- ユーザーメタデータ確認
SELECT user_id, clinic_id, role, display_name FROM user_metadata;

-- 価格マスタ確認
SELECT id, product_name, category, unit_price FROM price_tables;

-- 登録済みユーザー確認
SELECT id, email FROM auth.users ORDER BY created_at ASC LIMIT 5;
