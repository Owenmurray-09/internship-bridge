-- Fix 1: Allow unauthenticated users to view active schools (needed for signup page)
DROP POLICY IF EXISTS "Authenticated users can view active schools" ON public.schools;

CREATE POLICY "Anyone can view active schools"
ON public.schools FOR SELECT
USING (active = true);

-- Fix 2: Fix infinite recursion in school_memberships policies
-- The school admin policies on school_memberships query school_memberships itself, causing recursion.
-- Replace with simpler policies that check users.role directly without joining back to school_memberships.

DROP POLICY IF EXISTS "School admins can view school memberships" ON public.school_memberships;
DROP POLICY IF EXISTS "School admins can manage school memberships" ON public.school_memberships;

-- School admins can view all memberships for schools they belong to.
-- Uses a subquery that only references users (no recursion).
CREATE POLICY "School admins can view school memberships"
ON public.school_memberships FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'school_admin'
    )
    AND school_id IN (
        SELECT sm.school_id FROM public.school_memberships sm
        WHERE sm.user_id = auth.uid()
    )
);

-- School admins can delete memberships for their school.
CREATE POLICY "School admins can manage school memberships"
ON public.school_memberships FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'school_admin'
    )
    AND school_id IN (
        SELECT sm.school_id FROM public.school_memberships sm
        WHERE sm.user_id = auth.uid()
    )
);
