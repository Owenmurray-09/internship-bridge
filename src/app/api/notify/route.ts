import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase-server'
import {
  getSubject,
  applicationSubmittedHtml,
  applicationAcceptedHtml,
  applicationRejectedHtml,
  welcomeHtml,
  performanceCommentHtml,
} from '@/lib/email-templates'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}
const FROM_ADDRESS = 'InternshipBridge <noreply@owenmurraymusic.com>'

// Service role client bypasses RLS for cross-user data lookups
function createServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

function resolveRecipient(email: string): string | null {
  const override = process.env.DEV_EMAIL_OVERRIDE
  if (process.env.NODE_ENV === 'production') {
    return email
  }
  // In dev/test: only send if override is set
  return override || null
}

type Locale = 'en' | 'es'

function toLocale(value: string | null | undefined): Locale {
  return value === 'es' ? 'es' : 'en'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body
    const baseUrl = getBaseUrl()
    const db = createServiceSupabase()

    switch (type) {
      case 'application_submitted': {
        const { applicationId, internshipId } = body

        // Look up internship → company → employer user
        const { data: internship } = await db
          .from('internships')
          .select('title, company_id')
          .eq('id', internshipId)
          .single()

        if (!internship) break

        const { data: company } = await db
          .from('company_profiles')
          .select('user_id, company_name')
          .eq('id', internship.company_id)
          .single()

        if (!company) break

        const { data: employer } = await db
          .from('users')
          .select('email, full_name, preferred_locale')
          .eq('id', company.user_id)
          .single()

        if (!employer) break

        // Get student name
        const { data: studentUser } = await db
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single()

        const recipientEmail = resolveRecipient(employer.email)
        if (!recipientEmail) break

        const locale = toLocale(employer.preferred_locale)
        await getResend().emails.send({
          from: FROM_ADDRESS,
          to: [recipientEmail],
          subject: getSubject('application_submitted', locale),
          html: applicationSubmittedHtml({
            recipientName: employer.full_name || 'Employer',
            studentName: studentUser?.full_name || user.email || 'A student',
            internshipTitle: internship.title,
            reviewUrl: `${baseUrl}/applications/review`,
            locale,
          }),
        })
        break
      }

      case 'application_accepted':
      case 'application_rejected': {
        const { applicationId } = body

        const { data: application } = await db
          .from('applications')
          .select('student_id, internship_id')
          .eq('id', applicationId)
          .single()

        if (!application) break

        // Get student user via student_profiles
        const { data: studentProfile } = await db
          .from('student_profiles')
          .select('user_id')
          .eq('id', application.student_id)
          .single()

        if (!studentProfile) break

        const { data: student } = await db
          .from('users')
          .select('email, full_name, preferred_locale')
          .eq('id', studentProfile.user_id)
          .single()

        if (!student) break

        // Get internship + company info
        const { data: internship } = await db
          .from('internships')
          .select('title, company_id')
          .eq('id', application.internship_id)
          .single()

        if (!internship) break

        const { data: company } = await db
          .from('company_profiles')
          .select('company_name')
          .eq('id', internship.company_id)
          .single()

        const recipientEmail = resolveRecipient(student.email)
        if (!recipientEmail) break

        const locale = toLocale(student.preferred_locale)
        const htmlFn = type === 'application_accepted' ? applicationAcceptedHtml : applicationRejectedHtml
        await getResend().emails.send({
          from: FROM_ADDRESS,
          to: [recipientEmail],
          subject: getSubject(type, locale),
          html: htmlFn({
            recipientName: student.full_name || 'Student',
            internshipTitle: internship.title,
            companyName: company?.company_name || 'the company',
            applicationsUrl: `${baseUrl}/applications`,
            locale,
          }),
        })
        break
      }

      case 'welcome': {
        const { email, fullName } = body
        const recipientEmail = resolveRecipient(email)
        if (!recipientEmail) break

        // Try to get user's preferred locale
        const { data: userData } = await db
          .from('users')
          .select('preferred_locale')
          .eq('email', email)
          .single()

        const locale = toLocale(userData?.preferred_locale)
        await getResend().emails.send({
          from: FROM_ADDRESS,
          to: [recipientEmail],
          subject: getSubject('welcome', locale),
          html: welcomeHtml({
            recipientName: fullName || 'there',
            dashboardUrl: `${baseUrl}/dashboard`,
            locale,
          }),
        })
        break
      }

      case 'performance_comment_added': {
        const { applicationId, comment } = body

        const { data: application } = await db
          .from('applications')
          .select('student_id, internship_id')
          .eq('id', applicationId)
          .single()

        if (!application) break

        const { data: studentProfile } = await db
          .from('student_profiles')
          .select('user_id')
          .eq('id', application.student_id)
          .single()

        if (!studentProfile) break

        const { data: student } = await db
          .from('users')
          .select('email, full_name, preferred_locale')
          .eq('id', studentProfile.user_id)
          .single()

        if (!student) break

        const { data: internship } = await db
          .from('internships')
          .select('title, company_id')
          .eq('id', application.internship_id)
          .single()

        if (!internship) break

        const { data: company } = await db
          .from('company_profiles')
          .select('company_name')
          .eq('id', internship.company_id)
          .single()

        const recipientEmail = resolveRecipient(student.email)
        if (!recipientEmail) break

        const locale = toLocale(student.preferred_locale)
        const preview = comment.length > 200 ? comment.slice(0, 200) + '...' : comment
        await getResend().emails.send({
          from: FROM_ADDRESS,
          to: [recipientEmail],
          subject: getSubject('performance_comment_added', locale),
          html: performanceCommentHtml({
            recipientName: student.full_name || 'Student',
            internshipTitle: internship.title,
            companyName: company?.company_name || 'the company',
            commentPreview: preview,
            applicationsUrl: `${baseUrl}/applications`,
            locale,
          }),
        })
        break
      }

      default:
        return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
