-- Migration 2 of 2: Multi-tenant schools tables, columns, and RLS policies
-- Depends on 20260305100000 which adds school_admin/global_admin enum values.

-- 1. Block legacy 'admin' role
ALTER TABLE public.users
ADD CONSTRAINT users_role_not_legacy_admin CHECK (role != 'admin');

-- 2. Create schools table
CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#2563eb',
    secondary_color TEXT DEFAULT '#1e40af',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.schools
ADD CONSTRAINT schools_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$');

CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_schools_slug ON public.schools(slug);
CREATE INDEX idx_schools_active ON public.schools(active);

-- 3. Create school_memberships table (many-to-many: users <-> schools)
CREATE TABLE public.school_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, school_id)
);

CREATE INDEX idx_school_memberships_user_id ON public.school_memberships(user_id);
CREATE INDEX idx_school_memberships_school_id ON public.school_memberships(school_id);

-- 4. Add preferred_school_id to users (mirrors preferred_locale pattern)
ALTER TABLE public.users
ADD COLUMN preferred_school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.users.preferred_school_id IS
'User preferred school context. NULL means global/all-schools view. Mirrors preferred_locale pattern.';

-- 5. Add school_id to internships (NULL = visible to all schools)
ALTER TABLE public.internships
ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

CREATE INDEX idx_internships_school_id ON public.internships(school_id);

COMMENT ON COLUMN public.internships.school_id IS
'Optional school scope. NULL = visible to all schools.';

-- 6. Add is_global to company_profiles (true = employer sees all schools)
ALTER TABLE public.company_profiles
ADD COLUMN is_global BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.company_profiles.is_global IS
'When true, employer can view students across all schools.';

-- 7. Enable RLS on new tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_memberships ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for schools
CREATE POLICY "Authenticated users can view active schools"
ON public.schools FOR SELECT
USING (active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "School admins can update their school"
ON public.schools FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.school_memberships sm
        JOIN public.users u ON u.id = sm.user_id
        WHERE sm.school_id = schools.id
        AND sm.user_id = auth.uid()
        AND u.role = 'school_admin'
    )
);

CREATE POLICY "Global admins have full access to schools"
ON public.schools FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'global_admin'
    )
);

-- 9. RLS Policies for school_memberships
CREATE POLICY "Users can view own memberships"
ON public.school_memberships FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "School admins can view school memberships"
ON public.school_memberships FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.school_memberships admin_sm
        JOIN public.users u ON u.id = admin_sm.user_id
        WHERE admin_sm.school_id = school_memberships.school_id
        AND admin_sm.user_id = auth.uid()
        AND u.role = 'school_admin'
    )
);

CREATE POLICY "Users can create own memberships"
ON public.school_memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "School admins can manage school memberships"
ON public.school_memberships FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.school_memberships admin_sm
        JOIN public.users u ON u.id = admin_sm.user_id
        WHERE admin_sm.school_id = school_memberships.school_id
        AND admin_sm.user_id = auth.uid()
        AND u.role = 'school_admin'
    )
);

CREATE POLICY "Global admins have full access to memberships"
ON public.school_memberships FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'global_admin'
    )
);

-- 10. Update internships RLS: students see global internships + their school's
DROP POLICY IF EXISTS "Students can view active internships" ON public.internships;

CREATE POLICY "Students can view active internships" ON public.internships FOR SELECT
USING (
    status = 'active' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'student'
    ) AND (
        school_id IS NULL
        OR EXISTS (
            SELECT 1 FROM public.school_memberships sm
            WHERE sm.user_id = auth.uid() AND sm.school_id = internships.school_id
        )
    )
);

-- 11. Global admin full access policies on all existing tables
CREATE POLICY "Global admins have full access to users"
ON public.users FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'global_admin')
);

CREATE POLICY "Global admins have full access to student_profiles"
ON public.student_profiles FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'global_admin')
);

CREATE POLICY "Global admins have full access to company_profiles"
ON public.company_profiles FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'global_admin')
);

CREATE POLICY "Global admins have full access to internships"
ON public.internships FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'global_admin')
);

CREATE POLICY "Global admins have full access to applications"
ON public.applications FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'global_admin')
);

CREATE POLICY "Global admins have full access to messages"
ON public.messages FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'global_admin')
);

-- 12. School admin access: can view users within their school
CREATE POLICY "School admins can view school users"
ON public.users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.school_memberships admin_sm
        JOIN public.users admin_u ON admin_u.id = admin_sm.user_id
        JOIN public.school_memberships target_sm ON target_sm.school_id = admin_sm.school_id
        WHERE admin_sm.user_id = auth.uid()
        AND admin_u.role = 'school_admin'
        AND target_sm.user_id = users.id
    )
);

CREATE POLICY "School admins can view school student profiles"
ON public.student_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.school_memberships admin_sm
        JOIN public.users admin_u ON admin_u.id = admin_sm.user_id
        JOIN public.school_memberships target_sm ON target_sm.school_id = admin_sm.school_id
        WHERE admin_sm.user_id = auth.uid()
        AND admin_u.role = 'school_admin'
        AND target_sm.user_id = student_profiles.user_id
    )
);

CREATE POLICY "School admins can view school company profiles"
ON public.company_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.school_memberships admin_sm
        JOIN public.users admin_u ON admin_u.id = admin_sm.user_id
        JOIN public.school_memberships target_sm ON target_sm.school_id = admin_sm.school_id
        WHERE admin_sm.user_id = auth.uid()
        AND admin_u.role = 'school_admin'
        AND target_sm.user_id = company_profiles.user_id
    )
);
