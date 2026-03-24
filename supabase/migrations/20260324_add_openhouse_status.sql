-- 内覧会ステータスカラムを clinics テーブルに追加
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS openhouse_status VARCHAR(20) NOT NULL DEFAULT 'none'
  CHECK (openhouse_status IN ('none', 'scheduled', 'completed'));

-- インデックス追加（フィルタ・ソート高速化）
CREATE INDEX IF NOT EXISTS idx_clinics_openhouse_status ON clinics(openhouse_status);
