'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSupabase } from '@/lib/supabase'
import { studentProfileSchema, type StudentProfileInput } from '@/lib/validation'
import { useTranslations } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'

export default function StudentProfilePage() {
  const router = useRouter()
  const { t } = useTranslations('studentProfile')
  const { t: tErrors } = useTranslations('errors')

  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
    reset,
  } = useForm<StudentProfileInput>({
    resolver: zodResolver(studentProfileSchema),
  })

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setIsEditing(true)
        reset({
          email: profile.email || '',
          graduationYear: profile.graduation_year || undefined,
          gender: profile.gender || '',
          birthYear: profile.birth_year || undefined,
          bio: profile.bio || '',
        })
      } else {
        reset({ email: user.email || '' })
      }

      setLoading(false)
    }
    loadProfile()
  }, [router, reset])

  const onSubmit = async (data: StudentProfileInput) => {
    try {
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const row = {
        user_id: user.id,
        email: data.email,
        graduation_year: data.graduationYear,
        gender: data.gender || null,
        birth_year: data.birthYear,
        bio: data.bio || null,
      }

      const { data: upserted, error } = await supabase
        .from('student_profiles')
        .upsert(row, { onConflict: 'user_id' })
        .select('id')
        .single()

      if (error) {
        setFormError('root', { message: error.message })
        return
      }

      // Auto-embed profile in background
      if (upserted?.id) {
        fetch('/api/ai/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'student_profile', id: upserted.id }),
        }).catch(() => {})
      }

      router.push('/dashboard')
    } catch {
      setFormError('root', { message: tErrors('general') })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{t('loading')}</p>
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
              {isEditing ? t('titleEdit') : t('titleCreate')}
            </CardTitle>
            <CardDescription className="text-center">
              {isEditing ? t('descriptionEdit') : t('descriptionCreate')}
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
                <Label htmlFor="email">{t('fields.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder={t('placeholders.email')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">{t('fields.graduationYear')}</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    {...register('graduationYear', { valueAsNumber: true })}
                    placeholder={t('placeholders.graduationYear')}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.graduationYear}
                  />
                  {errors.graduationYear && (
                    <p className="text-red-500 text-sm">{errors.graduationYear.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthYear">{t('fields.birthYear')}</Label>
                  <Input
                    id="birthYear"
                    type="number"
                    {...register('birthYear', { valueAsNumber: true })}
                    placeholder={t('placeholders.birthYear')}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.birthYear}
                  />
                  {errors.birthYear && (
                    <p className="text-red-500 text-sm">{errors.birthYear.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">{t('fields.gender')}</Label>
                <select
                  id="gender"
                  {...register('gender')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="">{t('placeholders.gender')}</option>
                  <option value="male">{t('genderOptions.male')}</option>
                  <option value="female">{t('genderOptions.female')}</option>
                  <option value="non-binary">{t('genderOptions.nonBinary')}</option>
                  <option value="prefer-not-to-say">{t('genderOptions.preferNotToSay')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t('fields.bio')}</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  placeholder={t('placeholders.bio')}
                  rows={3}
                  disabled={isSubmitting}
                />
                {errors.bio && (
                  <p className="text-red-500 text-sm">{errors.bio.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('submitting') : (isEditing ? t('submitEdit') : t('submitCreate'))}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
