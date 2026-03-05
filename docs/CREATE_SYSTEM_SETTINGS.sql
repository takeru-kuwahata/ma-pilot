-- システム設定テーブル作成
-- 実行場所: Supabase SQL Editor

-- system_settingsテーブル作成
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS有効化
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- システム管理者のみ読み書き可能
CREATE POLICY "System admins can read settings"
  ON system_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_metadata.user_id = auth.uid()
      AND user_metadata.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can update settings"
  ON system_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_metadata.user_id = auth.uid()
      AND user_metadata.role = 'system_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_metadata.user_id = auth.uid()
      AND user_metadata.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can insert settings"
  ON system_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_metadata.user_id = auth.uid()
      AND user_metadata.role = 'system_admin'
    )
  );

-- 初期データ挿入（印刷物注文メール受信先）
INSERT INTO system_settings (key, value, description)
VALUES ('print_order_email', 'dr@medical-advance.com', '印刷物注文メール受信先アドレス')
ON CONFLICT (key) DO NOTHING;

-- 確認
SELECT * FROM system_settings;
