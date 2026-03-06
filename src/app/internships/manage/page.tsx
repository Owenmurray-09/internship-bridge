'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSupabase } from '@/lib/supabase'
import { useTranslations } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'
import type { Internship, InternshipStatus } from '@/types/database'

const STATUS_COLORS: Record<InternshipStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

const FILTER_TABS: Array<InternshipStatus | 'all'> = ['all', 'draft', 'active', 'closed', 'cancelled']

export default function ManageInternshipsPage() {
  const router = useRouter()
  const { t } = useTranslations('internships.manage')

  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [filter, setFilter] = useState<InternshipStatus | 'all'>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchInternships = useCallback(async (cId: string) => {
    const supabase = createClientSupabase()
    const { data } = await supabase
      .from('internships')
      .select('*')
      .eq('company_id', cId)
      .order('created_at', { ascending: false })

    setInternships(data || [])
  }, [])

  useEffect(() => {
    async function init() {
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        router.push('/profile/company')
        return
      }

      setCompanyId(profile.id)
      await fetchInternships(profile.id)
      setLoading(false)
    }
    init()
  }, [router, fetchInternships])

  const updateStatus = async (id: string, status: InternshipStatus) => {
    const supabase = createClientSupabase()
    const { error } = await supabase
      .from('internships')
      .update({ status })
      .eq('id', id)

    if (!error && companyId) {
      await fetchInternships(companyId)
    }
  }

  const deleteInternship = async (id: string) => {
    const supabase = createClientSupabase()
    const { error } = await supabase
      .from('internships')
      .delete()
      .eq('id', id)

    if (!error && companyId) {
      setDeleteConfirm(null)
      await fetchInternships(companyId)
    }
  }

  const filtered = filter === 'all'
    ? internships
    : internships.filter((i) => i.status === filter)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{t('title')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex justify-between items-center p-4">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
          InternshipBridge
        </Link>
        <LanguageToggle variant="compact" />
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('description')}</p>
          </div>
          <Link href="/internships/create">
            <Button>+ {t('createFirst')}</Button>
          </Link>
        </div>

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

        {/* Internship list */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">{t('noInternships')}</p>
              <Link href="/internships/create">
                <Button variant="outline">{t('createFirst')}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((internship) => (
              <Card key={internship.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{internship.title}</CardTitle>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        {internship.location && <span>{internship.location}</span>}
                        <span>{new Date(internship.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[internship.status]}`}>
                      {t(`status.${internship.status}`)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    {internship.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/internships/${internship.id}/edit`)}
                        >
                          {t('actions.edit')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateStatus(internship.id, 'active')}
                        >
                          {t('actions.publish')}
                        </Button>
                        {deleteConfirm === internship.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-red-600">{t('confirmDelete.message')}</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteInternship(internship.id)}
                            >
                              {t('confirmDelete.confirm')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              {t('confirmDelete.cancel')}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirm(internship.id)}
                          >
                            {t('actions.delete')}
                          </Button>
                        )}
                      </>
                    )}
                    {internship.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(internship.id, 'closed')}
                        >
                          {t('actions.close')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(internship.id, 'draft')}
                        >
                          {t('actions.moveToDraft')}
                        </Button>
                      </>
                    )}
                    {(internship.status === 'closed' || internship.status === 'cancelled') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(internship.id, 'draft')}
                      >
                        {t('actions.moveToDraft')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
