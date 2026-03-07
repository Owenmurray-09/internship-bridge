export type UserRole = 'student' | 'employer' | 'school_admin' | 'global_admin'
export type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'withdrawn'
export type InternshipStatus = 'draft' | 'active' | 'closed' | 'cancelled'

export interface School {
  id: string
  name: string
  slug: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface SchoolMembership {
  id: string
  user_id: string
  school_id: string
  is_primary: boolean
  created_at: string
  school?: School
  user?: User
}

export interface User {
  id: string
  email: string
  role: UserRole
  full_name?: string
  phone?: string
  preferred_school_id?: string
  preferred_locale?: string
  created_at: string
  updated_at: string
}

export interface StudentProfile {
  id: string
  user_id: string
  email?: string
  graduation_year?: number
  gender?: string
  birth_year?: number
  bio?: string
  created_at: string
  updated_at: string
  user?: User
}

export interface CompanyProfile {
  id: string
  user_id: string
  company_name: string
  industry?: string
  website_url?: string
  logo_url?: string
  description?: string
  location?: string
  verified: boolean
  is_global: boolean
  created_at: string
  updated_at: string
  user?: User
}

export interface Internship {
  id: string
  company_id: string
  title: string
  description: string
  requirements?: string[]
  responsibilities?: string[]
  skills_required?: string[]
  location?: string
  remote_allowed: boolean
  duration_months?: number
  start_date?: string
  end_date?: string
  status: InternshipStatus
  max_applications?: number
  school_id?: string
  created_at: string
  updated_at: string
  company_profile?: CompanyProfile
  school?: School
}

export interface Application {
  id: string
  internship_id: string
  student_id: string
  cover_letter?: string
  resume_url?: string
  status: ApplicationStatus
  applied_at: string
  reviewed_at?: string
  notes?: string
  created_at: string
  updated_at: string
  internship?: Internship
  student_profile?: StudentProfile
}

export interface PerformanceComment {
  id: string
  application_id: string
  employer_id: string
  comment: string
  created_at: string
  updated_at: string
  employer?: User
}

export interface Message {
  id: string
  application_id: string
  sender_id: string
  recipient_id: string
  content: string
  read_at?: string
  created_at: string
  sender?: User
  recipient?: User
}