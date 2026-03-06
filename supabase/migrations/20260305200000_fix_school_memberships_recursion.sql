-- Fix infinite recursion in school_memberships RLS policies.
-- The "School admins can view school memberships" policy queries school_memberships
-- inside its own USING clause, re-triggering the same policy → infinite loop.
--
-- Solution: wrap the self-referencing subquery in a SECURITY DEFINER function
-- so it bypasses RLS on school_memberships.

CREATE OR REPLACE FUNCTION public.get_user_school_ids()
RETURNS SETOF UUID AS $$
  SELECT school_id FROM public.school_memberships WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1. Fix school_memberships policies (the direct source of recursion)
DROP POLICY IF EXISTS "School admins can view school memberships" ON public.school_memberships;
CREATE POLICY "School admins can view school memberships"
ON public.school_memberships FOR SELECT
USING (
    public.is_school_admin()
    AND school_id IN (SELECT public.get_user_school_ids())
);

DROP POLICY IF EXISTS "School admins can manage school memberships" ON public.school_memberships;
CREATE POLICY "School admins can manage school memberships"
ON public.school_memberships FOR DELETE
USING (
    public.is_school_admin()
    AND school_id IN (SELECT public.get_user_school_ids())
);

-- 2. Fix users policy that joins school_memberships (indirect recursion source)
DROP POLICY IF EXISTS "School admins can view school users" ON public.users;
CREATE POLICY "School admins can view school users"
ON public.users FOR SELECT
USING (
    public.is_school_admin()
    AND EXISTS (
        SELECT 1 FROM public.school_memberships target_sm
        WHERE target_sm.school_id IN (SELECT public.get_user_school_ids())
        AND target_sm.user_id = users.id
    )
);

-- 3. Fix student_profiles policy that joins school_memberships
DROP POLICY IF EXISTS "School admins can view school student profiles" ON public.student_profiles;
CREATE POLICY "School admins can view school student profiles"
ON public.student_profiles FOR SELECT
USING (
    public.is_school_admin()
    AND EXISTS (
        SELECT 1 FROM public.school_memberships target_sm
        WHERE target_sm.school_id IN (SELECT public.get_user_school_ids())
        AND target_sm.user_id = student_profiles.user_id
    )
);

-- 4. Fix company_profiles policy that joins school_memberships
DROP POLICY IF EXISTS "School admins can view school company profiles" ON public.company_profiles;
CREATE POLICY "School admins can view school company profiles"
ON public.company_profiles FOR SELECT
USING (
    public.is_school_admin()
    AND EXISTS (
        SELECT 1 FROM public.school_memberships target_sm
        WHERE target_sm.school_id IN (SELECT public.get_user_school_ids())
        AND target_sm.user_id = company_profiles.user_id
    )
);

-- 5. Fix schools update policy that joins school_memberships
DROP POLICY IF EXISTS "School admins can update their school" ON public.schools;
CREATE POLICY "School admins can update their school"
ON public.schools FOR UPDATE
USING (
    public.is_school_admin()
    AND id IN (SELECT public.get_user_school_ids())
);
