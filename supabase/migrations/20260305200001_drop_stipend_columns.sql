-- Remove stipend columns from internships table.
-- All internships on the platform are unpaid.

ALTER TABLE public.internships DROP COLUMN IF EXISTS stipend_amount;
ALTER TABLE public.internships DROP COLUMN IF EXISTS stipend_currency;
