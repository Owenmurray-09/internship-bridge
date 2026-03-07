-- Performance comments table for employer feedback on student internship performance
CREATE TABLE public.performance_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    employer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at
CREATE TRIGGER update_performance_comments_updated_at
  BEFORE UPDATE ON public.performance_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.performance_comments ENABLE ROW LEVEL SECURITY;

-- Employers can create comments on applications for their internships
CREATE POLICY "Employers can create performance comments" ON public.performance_comments
  FOR INSERT WITH CHECK (
    auth.uid() = employer_id AND
    EXISTS (
      SELECT 1 FROM public.applications
      JOIN public.internships ON internships.id = applications.internship_id
      JOIN public.company_profiles ON company_profiles.id = internships.company_id
      WHERE applications.id = performance_comments.application_id
        AND company_profiles.user_id = auth.uid()
        AND applications.status = 'accepted'
    )
  );

-- Employers can view comments they created
CREATE POLICY "Employers can view own performance comments" ON public.performance_comments
  FOR SELECT USING (
    auth.uid() = employer_id
  );

-- Employers can update their own comments
CREATE POLICY "Employers can update own performance comments" ON public.performance_comments
  FOR UPDATE USING (
    auth.uid() = employer_id
  );

-- Employers can delete their own comments
CREATE POLICY "Employers can delete own performance comments" ON public.performance_comments
  FOR DELETE USING (
    auth.uid() = employer_id
  );

-- Students can view comments on their own applications
CREATE POLICY "Students can view performance comments on own applications" ON public.performance_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications
      JOIN public.student_profiles ON student_profiles.id = applications.student_id
      WHERE applications.id = performance_comments.application_id
        AND student_profiles.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_performance_comments_application_id ON public.performance_comments(application_id);
CREATE INDEX idx_performance_comments_employer_id ON public.performance_comments(employer_id);
