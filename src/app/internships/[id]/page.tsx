'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSupabase } from '@/lib/supabase'
import { useTranslations } from '@/lib/i18n'
import DashboardNav from '@/components/DashboardNav'
import type { Internship } from '@/types/database'

interface InternshipWithCompany extends Internship {
  company_profiles?: {
    company_name: string
    description?: string
    location?: string
    website_url?: string
    industry?: string
  }
}

export default function InternshipDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslations('internships.detail')
  const { t: tCommon } = useTranslations('common')
  const { t: tErrors } = useTranslations('errors')

  const [internship, setInternship] = useState<InternshipWithCompany | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState<string>('student')
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

      setUserName(userData?.full_name || user.email || '')
      setUserRole(userData?.role || 'student')

      const { data, error } = await supabase
        .from('internships')
        .select('*, company_profiles(company_name, description, location, website_url, industry)')
        .eq('id', params.id as string)
        .single()

      if (error || !data) {
        router.push('/internships')
        return
      }

      setInternship(data as InternshipWithCompany)

      // Check if student has already applied
      if (userData?.role === 'student') {
        const { data: profile } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          const { data: application } = await supabase
            .from('applications')
            .select('id')
            .eq('internship_id', params.id as string)
            .eq('student_id', profile.id)
            .single()

          setHasApplied(!!application)
        }
      }

      setLoading(false)
    }
    load()
  }, [router, params.id])

  const formatDate = (date?: string) => {
    if (!date) return null
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{tCommon('loading')}</p>
      </div>
    )
  }

  if (!internship) return null

  const company = internship.company_profiles

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={userName} userRole={userRole} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/internships"
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          &larr; {t('backToList')}
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{internship.title}</CardTitle>
                <p className="text-lg text-gray-600 mt-1">
                  {company?.company_name}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {internship.location && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {internship.location}
                  </span>
                )}
                {internship.remote_allowed && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {t('remote')}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              {internship.duration_months && (
                <div>
                  <p className="text-sm text-gray-500">{t('duration')}</p>
                  <p className="font-medium">
                    {internship.duration_months} {t('months')}
                  </p>
                </div>
              )}
              {internship.start_date && (
                <div>
                  <p className="text-sm text-gray-500">{t('startDate')}</p>
                  <p className="font-medium">{formatDate(internship.start_date)}</p>
                </div>
              )}
              {internship.application_deadline && (
                <div>
                  <p className="text-sm text-gray-500">{t('deadline')}</p>
                  <p className="font-medium">{formatDate(internship.application_deadline)}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('description')}</h3>
              <p className="text-gray-700 whitespace-pre-line">{internship.description}</p>
            </div>

            {/* Requirements */}
            {internship.requirements && internship.requirements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('requirements')}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {internship.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {internship.responsibilities && internship.responsibilities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('responsibilities')}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {internship.responsibilities.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            {internship.skills_required && internship.skills_required.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('skills')}</h3>
                <div className="flex flex-wrap gap-2">
                  {internship.skills_required.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Company info */}
            {company && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-2">{t('aboutCompany')}</h3>
                <p className="font-medium text-gray-900">{company.company_name}</p>
                {company.industry && (
                  <p className="text-sm text-gray-600">{company.industry}</p>
                )}
                {company.location && (
                  <p className="text-sm text-gray-600">{company.location}</p>
                )}
                {company.description && (
                  <p className="text-gray-700 mt-2">{company.description}</p>
                )}
                {company.website_url && (
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                  >
                    {company.website_url}
                  </a>
                )}
              </div>
            )}

            {/* Apply button (students only) */}
            {userRole === 'student' && (
              <div className="border-t pt-6">
                {hasApplied ? (
                  <p className="text-green-600 font-medium text-center">
                    {t('alreadyApplied')}
                  </p>
                ) : (
                  <Link href={`/internships/${internship.id}/apply`}>
                    <Button className="w-full" size="lg">
                      {t('applyNow')}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
