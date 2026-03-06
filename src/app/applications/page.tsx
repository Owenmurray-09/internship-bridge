'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSupabase } from '@/lib/supabase'
import { useTranslations } from '@/lib/i18n'
import DashboardNav from '@/components/DashboardNav'
import type { ApplicationStatus } from '@/types/database'

interface ApplicationRow {
  id: string
  status: ApplicationStatus
  applied_at: string
  reviewed_at: string | null
  cover_letter: string | null
  internship_id: string
  internships: {
    title: string
    location: string | null
    company_profiles: {
      company_name: string
    }
  }
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
}

const FILTER_TABS: Array<ApplicationStatus | 'all'> = ['all', 'pending', 'reviewed', 'accepted', 'rejected', 'withdrawn']

export default function StudentApplicationsPage() {
  const router = useRouter()
  const { t } = useTranslations('applications.student')
  const { t: tCommon } = useTranslations('common')

  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null)
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all')
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

  const fetchApplications = useCallback(async (profileId: string) => {
    const supabase = createClientSupabase()
    const { data } = await supabase
      .from('applications')
      .select(`
        id, status, applied_at, reviewed_at, cover_letter, internship_id,
        internships(title, location, company_profiles(company_name))
      `)
      .eq('student_id', profileId)
      .order('applied_at', { ascending: false })

    setApplications((data as unknown as ApplicationRow[]) || [])
  }, [])

  useEffect(() => {
    async function init() {
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

      if (userData?.role !== 'student') {
        router.push('/dashboard')
        return
      }

      setUserName(userData.full_name || user.email || '')

      const { data: profile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        router.push('/profile')
        return
      }

      setStudentProfileId(profile.id)
      await fetchApplications(profile.id)
      setLoading(false)
    }
    init()
  }, [router, fetchApplications])

  const withdrawApplication = async (id: string) => {
    const supabase = createClientSupabase()
    const { error } = await supabase
      .from('applications')
      .update({ status: 'withdrawn' as ApplicationStatus })
      .eq('id', id)

    if (!error && studentProfileId) {
      setWithdrawingId(null)
      await fetchApplications(studentProfileId)
    }
  }

  const filtered = filter === 'all'
    ? applications
    : applications.filter((a) => a.status === filter)

  const statusCounts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{tCommon('loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={userName} userRole="student" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('description')}</p>
        </div>

        {/* Summary stats */}
        {applications.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              <p className="text-xs text-gray-500">{t('stats.total')}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-2xl font-bold text-yellow-600">{statusCounts['pending'] || 0}</p>
              <p className="text-xs text-gray-500">{t('stats.pending')}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-2xl font-bold text-green-600">{statusCounts['accepted'] || 0}</p>
              <p className="text-xs text-gray-500">{t('stats.accepted')}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-2xl font-bold text-blue-600">{statusCounts['reviewed'] || 0}</p>
              <p className="text-xs text-gray-500">{t('stats.reviewed')}</p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t(`filters.${tab}`)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">
                {applications.length === 0 ? t('noApplications') : t('noResults')}
              </p>
              {applications.length === 0 && (
                <Link href="/internships">
                  <Button variant="outline">{t('browseInternships')}</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => {
              const internship = app.internships
              const company = internship?.company_profiles

              return (
                <Card key={app.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          <Link
                            href={`/internships/${app.internship_id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {internship?.title}
                          </Link>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {company?.company_name}
                          {internship?.location && ` — ${internship.location}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t('appliedOn')} {new Date(app.applied_at).toLocaleDateString()}
                          {app.reviewed_at && (
                            <> · {t('reviewedOn')} {new Date(app.reviewed_at).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[app.status]}`}>
                        {t(`status.${app.status}`)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Link href={`/internships/${app.internship_id}`}>
                        <Button size="sm" variant="outline">
                          {t('viewInternship')}
                        </Button>
                      </Link>
                      {(app.status === 'pending' || app.status === 'reviewed') && (
                        <>
                          {withdrawingId === app.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-red-600">{t('confirmWithdraw')}</span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => withdrawApplication(app.id)}
                              >
                                {tCommon('confirm')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setWithdrawingId(null)}
                              >
                                {tCommon('cancel')}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setWithdrawingId(app.id)}
                            >
                              {t('withdraw')}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
