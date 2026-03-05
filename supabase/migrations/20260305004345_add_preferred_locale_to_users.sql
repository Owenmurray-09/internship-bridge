-- Add preferred_locale column to users table
ALTER TABLE public.users
ADD COLUMN preferred_locale TEXT DEFAULT 'en' CHECK (preferred_locale IN ('en', 'es'));

-- Add comment for documentation
COMMENT ON COLUMN public.users.preferred_locale IS 'User''s preferred language locale. Currently supports ''en'' (English) and ''es'' (Spanish). Defaults to ''en''.';

-- Update the updated_at timestamp for any future changes
-- (No need to backfill existing users since they'll get the default 'en')