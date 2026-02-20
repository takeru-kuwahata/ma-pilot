-- Add slug column to clinics table
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_clinics_slug ON clinics(slug);

-- Populate existing clinics with slugs based on their IDs (temporary, will be updated manually)
UPDATE clinics SET slug = SUBSTRING(id::text FROM 1 FOR 8) WHERE slug IS NULL;
