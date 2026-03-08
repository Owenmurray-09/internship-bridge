'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSupabase } from '@/lib/supabase'
import { useTranslations } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'
import JobPostingChat from '@/components/ai/JobPostingChat'
import type { GeneratedPosting } from '@/components/ai/JobPostingChat'
import type { InternshipStatus } from '@/types/database'

type CreateInternshipInput = {
  title: string
  description: string
  location?: string
  remoteAllowed: boolean
}

export default function CreateInternshipPage() {
  const router = useRouter()
  const { t } = useTranslations('internships.create')
  const { t: tErrors } = useTranslations('errors')
  const { t: tVal } = useTranslations('validation')

  const createInternshipSchema = z.object({
    title: z.string().min(1, tVal('titleRequired')).max(200, tVal('titleTooLong')),
    description: z.string().min(1, tVal('descriptionRequired')).max(5000, tVal('descriptionTooLong')),
    location: z.string().max(200, tVal('locationTooLong')).optional(),
    remoteAllowed: z.boolean(),
  })

  const [companyId, setCompanyId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>()
  const [industry, setIndustry] = useState<string>()
  const [loading, setLoading] = useState(true)

  // Extra fields from AI that don't have form inputs
  const [requirements, setRequirements] = useState<string[]>([])
  const [responsibilities, setResponsibilities] = useState<string[]>([])
  const [skillsRequired, setSkillsRequired] = useState<string[]>([])
  const [durationMonths, setDurationMonths] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<CreateInternshipInput>({
    resolver: zodResolver(createInternshipSchema),
    defaultValues: {
      remoteAllowed: false,
    },
  })

  useEffect(() => {
    async function checkCompanyProfile() {
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('company_profiles')
        .select('id, company_name, industry')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        router.push('/profile/company')
        return
      }

      setCompanyId(profile.id)
      setCompanyName(profile.company_name)
      setIndustry(profile.industry || undefined)
      setLoading(false)
    }
    checkCompanyProfile()
  }, [router])

  const handleApplyPosting = (posting: GeneratedPosting) => {
    setValue('title', posting.title, { shouldValidate: true })
    setValue('description', posting.description, { shouldValidate: true })
    if (posting.location) {
      setValue('location', posting.location)
    }
    if (posting.remote_allowed !== undefined) {
      setValue('remoteAllowed', posting.remote_allowed)
    }
    if (posting.requirements) setRequirements(posting.requirements)
    if (posting.responsibilities) setResponsibilities(posting.responsibilities)
    if (posting.skills_required) setSkillsRequired(posting.skills_required)
    if (posting.duration_months) setDurationMonths(posting.duration_months)
  }

  const removeTag = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index))
  }

  const submitForm = async (data: CreateInternshipInput, status: InternshipStatus) => {
    if (!companyId) return

    try {
      const supabase = createClientSupabase()

      const row: Record<string, unknown> = {
        company_id: companyId,
        title: data.title.trim(),
        description: data.description,
        location: data.location || null,
        remote_allowed: data.remoteAllowed,
        status,
      }

      if (requirements.length > 0) row.requirements = requirements
      if (responsibilities.length > 0) row.responsibilities = responsibilities
      if (skillsRequired.length > 0) row.skills_required = skillsRequired
      if (durationMonths) row.duration_months = durationMonths

      const { data: inserted, error } = await supabase
        .from('internships')
        .insert(row)
        .select('id')
        .single()

      if (error) {
        setFormError('root', { message: error.message })
        return
      }

      // Auto-embed in background (fire-and-forget)
      if (inserted?.id) {
        fetch('/api/ai/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'internship', id: inserted.id }),
        }).catch(() => {})
      }

      router.push('/internships/manage')
    } catch {
      setFormError('root', { message: tErrors('general') })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{t('title')}</p>
      </div>
    )
  }

  const hasAiFields = requirements.length > 0 || responsibilities.length > 0 || skillsRequired.length > 0

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
            <CardTitle className="text-2xl font-bold text-center">{t('title')}</CardTitle>
            <CardDescription className="text-center">{t('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              {errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {errors.root.message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">{t('fields.title')}</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder={t('fields.titlePlaceholder')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.title}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('fields.description')}</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder={t('fields.descriptionPlaceholder')}
                  rows={5}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.description}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t('fields.location')}</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder={t('fields.locationPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="remoteAllowed"
                  type="checkbox"
                  {...register('remoteAllowed')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <Label htmlFor="remoteAllowed">{t('fields.remoteAllowed')}</Label>
              </div>

              {/* AI-generated structured fields */}
              {hasAiFields && (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">
                    {t('aiGenerated')}
                  </p>

                  {responsibilities.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-sm">{t('fields.responsibilities')}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {responsibilities.map((r, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-md">
                            {r}
                            <button type="button" onClick={() => removeTag(responsibilities, setResponsibilities, i)} className="text-blue-400 hover:text-blue-600">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {requirements.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-sm">{t('fields.requirements')}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {requirements.map((r, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs px-2 py-1 rounded-md">
                            {r}
                            <button type="button" onClick={() => removeTag(requirements, setRequirements, i)} className="text-amber-400 hover:text-amber-600">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {skillsRequired.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-sm">{t('fields.skillsRequired')}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {skillsRequired.map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-green-50 text-green-800 text-xs px-2 py-1 rounded-md">
                            {s}
                            <button type="button" onClick={() => removeTag(skillsRequired, setSkillsRequired, i)} className="text-green-400 hover:text-green-600">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {durationMonths && (
                    <div className="text-sm text-gray-600">
                      {t('fields.duration')}: {durationMonths} {t('fields.months')}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting}
                  onClick={() => router.push('/dashboard')}
                >
                  {t('actions.cancel')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                  onClick={handleSubmit((data) => submitForm(data, 'draft'))}
                >
                  {isSubmitting ? t('actions.savingDraft') : t('actions.saveDraft')}
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={isSubmitting}
                  onClick={handleSubmit((data) => submitForm(data, 'active'))}
                >
                  {isSubmitting ? t('actions.publishing') : t('actions.publish')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Assistant */}
      <JobPostingChat
        companyName={companyName}
        industry={industry}
        onApplyPosting={handleApplyPosting}
      />
    </div>
  )
}
