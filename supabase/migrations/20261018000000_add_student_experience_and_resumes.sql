-- Free-text experience/accomplishments section on student profiles, plus the
-- storage path of the student's resume PDF (in the resumes bucket)
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS experience TEXT,
  ADD COLUMN IF NOT EXISTS resume_path TEXT;

-- Private bucket for student resume PDFs, stored at <user_id>/resume.pdf
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resumes', 'resumes', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Who may read a given student's resume: the student, employers the student
-- applied to, school admins sharing a school with the student, global admins.
-- SECURITY DEFINER so the joins don't re-enter RLS on the joined tables.
CREATE OR REPLACE FUNCTION public.can_view_resume(owner_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    auth.uid() = owner_id
    OR public.is_global_admin()
    OR EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.student_profiles sp ON sp.id = a.student_id
      JOIN public.internships i ON i.id = a.internship_id
      JOIN public.company_profiles cp ON cp.id = i.company_id
      WHERE sp.user_id = owner_id
        AND cp.user_id = auth.uid()
    )
    OR (
      public.is_school_admin()
      AND EXISTS (
        SELECT 1 FROM public.school_memberships admin_sm
        JOIN public.school_memberships target_sm ON target_sm.school_id = admin_sm.school_id
        WHERE admin_sm.user_id = auth.uid()
          AND target_sm.user_id = owner_id
      )
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

DROP POLICY IF EXISTS "Students manage own resume - insert" ON storage.objects;
CREATE POLICY "Students manage own resume - insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Students manage own resume - update" ON storage.objects;
CREATE POLICY "Students manage own resume - update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Students manage own resume - delete" ON storage.objects;
CREATE POLICY "Students manage own resume - delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Permitted users can read resumes" ON storage.objects;
CREATE POLICY "Permitted users can read resumes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes' AND public.can_view_resume(((storage.foldername(name))[1])::uuid));
