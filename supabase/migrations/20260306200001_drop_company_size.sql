-- Remove company_size column from company_profiles table.

ALTER TABLE public.company_profiles DROP COLUMN IF EXISTS company_size;
