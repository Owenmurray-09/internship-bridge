-- Change duration_months from integer to text to support free-form durations
-- (e.g., "1 week", "3 months", "Summer semester")

-- Drop ivfflat index first (ALTER TABLE triggers index rebuild which exceeds memory on free tier)
DROP INDEX IF EXISTS idx_internships_embedding;

ALTER TABLE internships
  ALTER COLUMN duration_months TYPE TEXT
  USING duration_months::TEXT;

-- Note: ivfflat index omitted here due to Supabase free tier memory limits.
-- Sequential scan is fine for small datasets. Recreate the index when the dataset
-- grows or when on a paid plan with more maintenance_work_mem:
-- CREATE INDEX idx_internships_embedding ON internships
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);
