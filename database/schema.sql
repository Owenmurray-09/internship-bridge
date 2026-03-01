-- Enable Row Level Security
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'employer', 'admin');

-- Create enum for application status
CREATE TYPE application_status AS ENUM ('pending', 'reviewed', 'accepted', 'rejected', 'withdrawn');

-- Create enum for internship status
CREATE TYPE internship_status AS ENUM ('draft', 'active', 'closed', 'cancelled');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Student profiles
CREATE TABLE public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    university TEXT,
    major TEXT,
    graduation_year INTEGER,
    gpa DECIMAL(3,2),
    resume_url TEXT,
    portfolio_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    bio TEXT,
    skills TEXT[], -- Array of skills
    location TEXT,
    available_start DATE,
    available_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Company profiles
CREATE TABLE public.company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    company_size TEXT,
    industry TEXT,
    website_url TEXT,
    logo_url TEXT,
    description TEXT,
    location TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Internships table
CREATE TABLE public.internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[],
    responsibilities TEXT[],
    skills_required TEXT[],
    location TEXT,
    remote_allowed BOOLEAN DEFAULT false,
    duration_months INTEGER,
    start_date DATE,
    end_date DATE,
    stipend_amount DECIMAL(10,2),
    stipend_currency TEXT DEFAULT 'USD',
    application_deadline DATE,
    status internship_status DEFAULT 'draft',
    max_applications INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE NOT NULL,
    cover_letter TEXT,
    resume_url TEXT,
    status application_status DEFAULT 'pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT, -- Internal notes from employer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(internship_id, student_id) -- Prevent duplicate applications
);

-- Messages table for communication
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_profiles_updated_at BEFORE UPDATE ON public.company_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_internships_updated_at BEFORE UPDATE ON public.internships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for student_profiles
CREATE POLICY "Students can view own profile" ON public.student_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can update own profile" ON public.student_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Students can insert own profile" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Employers can view student profiles" ON public.student_profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'employer'
    )
);

-- RLS Policies for company_profiles
CREATE POLICY "Companies can view own profile" ON public.company_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Companies can update own profile" ON public.company_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Companies can insert own profile" ON public.company_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view verified company profiles" ON public.company_profiles FOR SELECT USING (verified = true);

-- RLS Policies for internships
CREATE POLICY "Companies can manage own internships" ON public.internships FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.company_profiles
        WHERE company_profiles.id = internships.company_id AND company_profiles.user_id = auth.uid()
    )
);
CREATE POLICY "Students can view active internships" ON public.internships FOR SELECT USING (
    status = 'active' AND (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'student'
        )
    )
);

-- RLS Policies for applications
CREATE POLICY "Students can view own applications" ON public.applications FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.student_profiles
        WHERE student_profiles.id = applications.student_id AND student_profiles.user_id = auth.uid()
    )
);
CREATE POLICY "Students can create applications" ON public.applications FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.student_profiles
        WHERE student_profiles.id = applications.student_id AND student_profiles.user_id = auth.uid()
    )
);
CREATE POLICY "Students can update own applications" ON public.applications FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.student_profiles
        WHERE student_profiles.id = applications.student_id AND student_profiles.user_id = auth.uid()
    )
);
CREATE POLICY "Employers can view applications to their internships" ON public.applications FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.internships
        JOIN public.company_profiles ON internships.company_id = company_profiles.id
        WHERE internships.id = applications.internship_id AND company_profiles.user_id = auth.uid()
    )
);
CREATE POLICY "Employers can update applications to their internships" ON public.applications FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.internships
        JOIN public.company_profiles ON internships.company_id = company_profiles.id
        WHERE internships.id = applications.internship_id AND company_profiles.user_id = auth.uid()
    )
);

-- RLS Policies for messages
CREATE POLICY "Users can view their messages" ON public.messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.applications
        WHERE applications.id = messages.application_id AND (
            EXISTS (
                SELECT 1 FROM public.student_profiles
                WHERE student_profiles.id = applications.student_id AND student_profiles.user_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM public.internships
                JOIN public.company_profiles ON internships.company_id = company_profiles.id
                WHERE internships.id = applications.internship_id AND company_profiles.user_id = auth.uid()
            )
        )
    )
);

-- Create indexes for better performance
CREATE INDEX idx_student_profiles_user_id ON public.student_profiles(user_id);
CREATE INDEX idx_company_profiles_user_id ON public.company_profiles(user_id);
CREATE INDEX idx_internships_company_id ON public.internships(company_id);
CREATE INDEX idx_internships_status ON public.internships(status);
CREATE INDEX idx_applications_internship_id ON public.applications(internship_id);
CREATE INDEX idx_applications_student_id ON public.applications(student_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_messages_application_id ON public.messages(application_id);