-- Change duration_months from integer to text to support free-form durations
-- (e.g., "1 week", "3 months", "Summer semester")
ALTER TABLE internships
  ALTER COLUMN duration_months TYPE TEXT
  USING duration_months::TEXT;
