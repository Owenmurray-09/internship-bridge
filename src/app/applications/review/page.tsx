'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createClientSupabase } from '@/lib/supabase'
import { sendNotification } from '@/lib/email'
import { useTranslations } from '@/lib/i18n'
import DashboardNav from '@/components/DashboardNav'
import type { ApplicationStatus } from '@/types/database'

interface CommentRow {
  id: string
  comment: string
  created_at: string
  updated_at: string
  employer_id: string
  users: {
    full_name: string | null
  }
}

interface ApplicationRow {
  id: string
  cover_letter: string | null
  status: ApplicationStatus
  applied_at: string
  reviewed_at: string | null
  notes: string | null
  internship_id: string
  student_id: string
  internships: {
    title: string
  }
  student_profiles: {
    email: string | null
    graduation_year: number | null
    bio: string | null
    users: {
      full_name: string | null
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

const FILTER_TABS: Array<ApplicationStatus | 'all'> = ['all', 'pending', 'reviewed', 'accepted', 'rejected']

export default function ReviewApplicationsPage() {
  const router = useRouter()
  const { t } = useTranslations('applications.review')
  const { t: tCommon } = useTranslations('common')

  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, CommentRow[]>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  const fetchApplications = useCallback(async (cId: string) => {
    const supabase = createClientSupabase()
    const { data } = await supabase
      .from('applications')
      .select(`
        id, cover_letter, status, applied_at, reviewed_at, notes, internship_id, student_id,
        internships!inner(title, company_id),
        student_profiles(email, graduation_year, bio, users(full_name))
      `)
      .eq('internships.company_id', cId)
      .order('applied_at', { ascending: false })

    setApplications((data as unknown as ApplicationRow[]) || [])
  }, [])

  const fetchComments = useCallback(async (applicationId: string) => {
    const supabase = createClientSupabase()
    const { data } = await supabase
      .from('performance_comments')
      .select('id, comment, created_at, updated_at, employer_id, users(full_name)')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true })

    setComments((prev) => ({
      ...prev,
      [applicationId]: (data as unknown as CommentRow[]) || [],
    }))
  }, [])

  const addComment = async (applicationId: string) => {
    const text = newComment[applicationId]?.trim()
    if (!text || !userId) return

    setSubmittingComment(applicationId)
    const supabase = createClientSupabase()
    const { error } = await supabase
      .from('performance_comments')
      .insert({ application_id: applicationId, employer_id: userId, comment: text })

    if (!error) {
      sendNotification({
        type: 'performance_comment_added',
        applicationId,
        comment: text,
      })
      setNewComment((prev) => ({ ...prev, [applicationId]: '' }))
      await fetchComments(applicationId)
    }
    setSubmittingComment(null)
  }

  const deleteComment = async (commentId: string, applicationId: string) => {
    const supabase = createClientSupabase()
    const { error } = await supabase
      .from('performance_comments')
      .delete()
      .eq('id', commentId)

    if (!error) {
      setDeletingCommentId(null)
      await fetchComments(applicationId)
    }
  }

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

      if (userData?.role !== 'employer') {
        router.push('/dashboard')
        return
      }

      setUserName(userData.full_name || user.email || '')
      setUserId(user.id)

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
      await fetchApplications(profile.id)

      // Fetch comments for accepted applications
      const { data: apps } = await supabase
        .from('applications')
        .select('id, status, internships!inner(company_id)')
        .eq('internships.company_id', profile.id)
        .eq('status', 'accepted')

      if (apps) {
        await Promise.all(apps.map((a) => fetchComments(a.id)))
      }

      setLoading(false)
    }
    init()
  }, [router, fetchApplications, fetchComments])

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const supabase = createClientSupabase()
    const { error } = await supabase
      .from('applications')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id)

    if (!error && companyId) {
      if (status === 'accepted' || status === 'rejected') {
        sendNotification({
          type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
          applicationId: id,
        })
      }
      await fetchApplications(companyId)
      if (status === 'accepted') {
        await fetchComments(id)
      }
    }
  }

  const filtered = filter === 'all'
    ? applications
    : applications.filter((a) => a.status === filter)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{tCommon('loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={userName} userRole="employer" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('description')}</p>
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

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">{t('noApplications')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => {
              const student = app.student_profiles
              const studentName = student?.users?.full_name || student?.email || t('unknownStudent')
              const isExpanded = expandedId === app.id

              return (
                <Card key={app.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{studentName}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {t('appliedTo')}: <span className="font-medium">{app.internships?.title}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t('appliedOn')} {new Date(app.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                        {t(`status.${app.status}`)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {/* Student info summary */}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      {student?.email && (
                        <span>{student.email}</span>
                      )}
                      {student?.graduation_year && (
                        <span>{t('gradYear')}: {student.graduation_year}</span>
                      )}
                    </div>

                    {/* Expand/collapse cover letter */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {isExpanded ? t('hideCoverLetter') : t('showCoverLetter')}
                    </button>

                    {isExpanded && app.cover_letter && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('coverLetter')}</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{app.cover_letter}</p>
                      </div>
                    )}

                    {isExpanded && student?.bio && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('studentBio')}</h4>
                        <p className="text-sm text-gray-600">{student.bio}</p>
                      </div>
                    )}

                    {/* Performance Comments - only for accepted applications */}
                    {app.status === 'accepted' && (
                      <div className="border-t pt-3 mt-1">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          {t('performanceComments.title')}
                        </h4>

                        {/* Existing comments */}
                        {(comments[app.id] || []).length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {comments[app.id].map((c) => (
                              <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <p className="text-sm text-gray-700 whitespace-pre-line flex-1">{c.comment}</p>
                                  {c.employer_id === userId && (
                                    deletingCommentId === c.id ? (
                                      <div className="flex gap-1 ml-2 shrink-0">
                                        <Button
                                          size="xs"
                                          variant="destructive"
                                          onClick={() => deleteComment(c.id, app.id)}
                                        >
                                          {tCommon('confirm')}
                                        </Button>
                                        <Button
                                          size="xs"
                                          variant="outline"
                                          onClick={() => setDeletingCommentId(null)}
                                        >
                                          {tCommon('cancel')}
                                        </Button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setDeletingCommentId(c.id)}
                                        className="text-xs text-gray-400 hover:text-red-500 ml-2 shrink-0"
                                      >
                                        {tCommon('delete')}
                                      </button>
                                    )
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {c.users?.full_name || ''} &middot; {new Date(c.created_at).toLocaleDateString()}
                                  {c.updated_at !== c.created_at && ` (${t('performanceComments.edited')})`}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 mb-3">{t('performanceComments.noComments')}</p>
                        )}

                        {/* Add new comment */}
                        <div className="flex gap-2">
                          <Textarea
                            value={newComment[app.id] || ''}
                            onChange={(e) => setNewComment((prev) => ({ ...prev, [app.id]: e.target.value }))}
                            placeholder={t('performanceComments.placeholder')}
                            className="text-sm min-h-[60px]"
                            rows={2}
                          />
                          <Button
                            size="sm"
                            onClick={() => addComment(app.id)}
                            disabled={!newComment[app.id]?.trim() || submittingComment === app.id}
                            className="shrink-0 self-end"
                          >
                            {submittingComment === app.id
                              ? t('performanceComments.submitting')
                              : t('performanceComments.submit')}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      {app.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(app.id, 'reviewed')}
                          >
                            {t('actions.markReviewed')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            onClick={() => updateStatus(app.id, 'accepted')}
                          >
                            {t('actions.accept')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => updateStatus(app.id, 'rejected')}
                          >
                            {t('actions.reject')}
                          </Button>
                        </>
                      )}
                      {app.status === 'reviewed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            onClick={() => updateStatus(app.id, 'accepted')}
                          >
                            {t('actions.accept')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => updateStatus(app.id, 'rejected')}
                          >
                            {t('actions.reject')}
                          </Button>
                        </>
                      )}
                      {(app.status === 'accepted' || app.status === 'rejected') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(app.id, 'reviewed')}
                        >
                          {t('actions.moveBack')}
                        </Button>
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
