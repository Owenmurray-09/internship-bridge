-- Create helper functions that bypass RLS (SECURITY DEFINER) to check user roles.
-- This prevents infinite recursion when RLS policies on the users table
-- need to query the users table to check the current user's role.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'global_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_school_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'school_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Now replace all policies that had self-referencing queries on the users table.

-- users table: replace global admin policy
DROP POLICY IF EXISTS "Global admins have full access to users" ON public.users;
CREATE POLICY "Global admins have full access to users"
ON public.users FOR ALL
USING (public.is_global_admin());

-- users table: replace school admin policy
DROP POLICY IF EXISTS "School admins can view school users" ON public.users;
CREATE POLICY "School admins can view school users"
ON public.users FOR SELECT
USING (
    public.is_school_admin()
    AND EXISTS (
        SELECT 1 FROM public.school_memberships admin_sm
        JOIN public.school_memberships target_sm ON target_sm.school_id = admin_sm.school_id
        WHERE admin_sm.user_id = auth.uid()
        AND target_sm.user_id = users.id
    )
);

-- schools table: replace global admin policy
DROP POLICY IF EXISTS "Global admins have full access to schools" ON public.schools;
CREATE POLICY "Global admins have full access to schools"
ON public.schools FOR ALL
USING (public.is_global_admin());

-- schools table: replace school admin policy
DROP POLICY IF EXISTS "School admins can update their school" ON public.schools;
CREATE POLICY "School admins can update their school"
ON public.schools FOR UPDATE
USING (
    public.is_school_admin()
    AND EXISTS (
        SELECT 1 FROM public.school_memberships sm
        WHERE sm.school_id = schools.id AND sm.user_id = auth.uid()
    )
);

-- school_memberships: replace policies
DROP POLICY IF EXISTS "School admins can view school memberships" ON public.school_memberships;
CREATE POLICY "School admins can view school memberships"
ON public.school_memberships FOR SELECT
USING (
    public.is_school_admin()
    AND school_id IN (
        SELECT sm.school_id FROM public.school_memberships sm
        WHERE sm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "School admins can manage school memberships" ON public.school_memberships;
CREATE POLICY "School admins can manage school memberships"
ON public.school_memberships FOR DELETE
USING (
    public.is_school_admin()
    AND school_id IN (
        SELECT sm.school_id FROM public.school_memberships sm
        WHERE sm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Global admins have full access to memberships" ON public.school_memberships;
CREATE POLICY "Global admins have full access to memberships"
ON public.school_memberships FOR ALL
USING (public.is_global_admin());

-- student_profiles: replace policies
DROP POLICY IF EXISTS "Global admins have full access to student_profiles" ON public.student_profiles;
CREATE POLICY "Global admins have full access to student_profiles"
ON public.student_profiles FOR ALL
USING (public.is_global_admin());

DROP POLICY IF EXISTS "School admins can view school student profiles" ON public.student_profiles;
CREATE POLICY "School admins can view school student profiles"
ON public.student_profiles FOR SELECT
USING (
    public.is_school_admin()
    AND EXISTS (
        SELECT 1 FROM public.school_memberships admin_sm
        JOIN public.school_memberships target_sm ON target_sm.school_id = admin_sm.school_id
        WHERE admin_sm.user_id = auth.uid()
        AND target_sm.user_id = student_profiles.user_id
    )
);

-- company_profiles: replace policies
DROP POLICY IF EXISTS "Global admins have full access to company_profiles" ON public.company_profiles;
CREATE POLICY "Global admins have full access to company_profiles"
ON public.company_profiles FOR ALL
USING (public.is_global_admin());

DROP POLICY IF EXISTS "School admins can view school company profiles" ON public.company_profiles;
CREATE POLICY "School admins can view school company profiles"
ON public.company_profiles FOR SELECT
USING (
    public.is_school_admin()
    AND EXISTS (
        SELECT 1 FROM public.school_memberships admin_sm
        JOIN public.school_memberships target_sm ON target_sm.school_id = admin_sm.school_id
        WHERE admin_sm.user_id = auth.uid()
        AND target_sm.user_id = company_profiles.user_id
    )
);

-- internships: replace policies
DROP POLICY IF EXISTS "Global admins have full access to internships" ON public.internships;
CREATE POLICY "Global admins have full access to internships"
ON public.internships FOR ALL
USING (public.is_global_admin());

-- applications: replace policy
DROP POLICY IF EXISTS "Global admins have full access to applications" ON public.applications;
CREATE POLICY "Global admins have full access to applications"
ON public.applications FOR ALL
USING (public.is_global_admin());

-- messages: replace policy
DROP POLICY IF EXISTS "Global admins have full access to messages" ON public.messages;
CREATE POLICY "Global admins have full access to messages"
ON public.messages FOR ALL
USING (public.is_global_admin());
