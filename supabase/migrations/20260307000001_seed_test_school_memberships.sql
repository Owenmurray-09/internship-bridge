-- Link test accounts to Lincoln School so branding is visible during development
-- Idempotent: uses ON CONFLICT to avoid duplicates

INSERT INTO public.school_memberships (user_id, school_id, is_primary)
SELECT u.id, s.id, true
FROM public.users u
CROSS JOIN public.schools s
WHERE u.email IN ('employer@mail.com', 'student2@mail.com')
  AND s.slug = 'lincoln-school'
ON CONFLICT DO NOTHING;
