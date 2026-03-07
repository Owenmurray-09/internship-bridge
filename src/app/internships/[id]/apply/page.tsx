'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSupabase } from '@/lib/supabase'
import { sendNotification } from '@/lib/email'
import { useTranslations } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'

type ApplyInput = {
  coverLetter: string
}

export default function ApplyToInternshipPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslations('internships.apply')
  const { t: tCommon } = useTranslations('common')
  const { t: tErrors } = useTranslations('errors')
  const { t: tVal } = useTranslations('validation')

  const applySchema = z.object({
    coverLetter: z
      .string()
      .min(1, tVal('coverLetterRequired'))
      .max(3000, tVal('coverLetterTooLong')),
  })

  const [loading, setLoading] = useState(true)
  const [internshipTitle, setInternshipTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<ApplyInput>({
    resolver: zodResolver(applySchema),
  })

  useEffect(() => {
    async function load() {
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get internship details
      const { data: internship } = await supabase
        .from('internships')
        .select('title, status, company_profiles(company_name)')
        .eq('id', params.id as string)
        .single()

      if (!internship || internship.status !== 'active') {
        router.push('/internships')
        return
      }

      setInternshipTitle(internship.title)
      const company = internship.company_profiles as unknown as { company_name: string } | null
      setCompanyName(company?.company_name || '')

      // Get student profile
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        router.push('/profile')
        return
      }

      // Check if already applied
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('internship_id', params.id as string)
        .eq('student_id', profile.id)
        .single()

      if (existing) {
        router.push(`/internships/${params.id}`)
        return
      }

      setStudentProfileId(profile.id)
      setLoading(false)
    }
    load()
  }, [router, params.id])

  const onSubmit = async (data: ApplyInput) => {
    if (!studentProfileId) return

    try {
      const supabase = createClientSupabase()

      const { data: inserted, error } = await supabase.from('applications').insert({
        internship_id: params.id as string,
        student_id: studentProfileId,
        cover_letter: data.coverLetter,
        status: 'pending',
      }).select('id').single()

      if (error) {
        setFormError('root', { message: error.message })
        return
      }

      if (inserted) {
        sendNotification({
          type: 'application_submitted',
          applicationId: inserted.id,
          internshipId: params.id as string,
        })
      }

      setSubmitted(true)
    } catch {
      setFormError('root', { message: tErrors('general') })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{tCommon('loading')}</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex justify-between items-center p-4">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
            InternshipBridge
          </Link>
          <LanguageToggle variant="compact" />
        </div>
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-lg text-center">
            <CardHeader>
              <CardTitle className="text-2xl">{t('success.title')}</CardTitle>
              <CardDescription>{t('success.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/internships">
                <Button variant="outline" className="w-full">{t('success.browseMore')}</Button>
              </Link>
              <Link href="/dashboard">
                <Button className="w-full">{t('success.backToDashboard')}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
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

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {t('title')}
            </CardTitle>
            <CardDescription className="text-center">
              {internshipTitle} — {companyName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {errors.root.message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="coverLetter">{t('fields.coverLetter')}</Label>
                <p className="text-sm text-gray-500">{t('fields.coverLetterHint')}</p>
                <Textarea
                  id="coverLetter"
                  {...register('coverLetter')}
                  placeholder={t('placeholders.coverLetter')}
                  rows={8}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.coverLetter}
                />
                {errors.coverLetter && (
                  <p className="text-red-500 text-sm">{errors.coverLetter.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Link href={`/internships/${params.id}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full" disabled={isSubmitting}>
                    {tCommon('cancel')}
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? t('submitting') : t('submit')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
