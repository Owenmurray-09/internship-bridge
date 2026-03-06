-- Simplify student_profiles for high school students
-- Remove college/professional fields, add high-school-appropriate fields

-- Drop columns that don't apply to high school students
ALTER TABLE public.student_profiles
  DROP COLUMN IF EXISTS university,
  DROP COLUMN IF EXISTS major,
  DROP COLUMN IF EXISTS gpa,
  DROP COLUMN IF EXISTS resume_url,
  DROP COLUMN IF EXISTS portfolio_url,
  DROP COLUMN IF EXISTS github_url,
  DROP COLUMN IF EXISTS linkedin_url,
  DROP COLUMN IF EXISTS skills,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS available_start,
  DROP COLUMN IF EXISTS available_end;

-- Add high-school-appropriate columns
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS birth_year INTEGER;
