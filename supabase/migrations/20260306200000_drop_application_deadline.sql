-- Remove application_deadline column from internships table.

ALTER TABLE public.internships DROP COLUMN IF EXISTS application_deadline;
