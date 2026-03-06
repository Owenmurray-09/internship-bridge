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
import { companyProfileSchema, type CompanyProfileInput } from '@/lib/validation'
import { useTranslations } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'

export default function CompanyProfilePage() {
  const router = useRouter()
  const { t } = useTranslations('companyProfile')
  const { t: tErrors } = useTranslations('errors')

  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
    reset,
  } = useForm<CompanyProfileInput>({
    resolver: zodResolver(companyProfileSchema),
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
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setIsEditing(true)
        reset({
          companyName: profile.company_name,
          companySize: profile.company_size || undefined,
          industry: profile.industry || '',
          websiteUrl: profile.website_url || '',
          description: profile.description || '',
          location: profile.location || '',
        })
      }

      setLoading(false)
    }
    loadProfile()
  }, [router, reset])

  const onSubmit = async (data: CompanyProfileInput) => {
    try {
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const row = {
        user_id: user.id,
        company_name: data.companyName,
        company_size: data.companySize || null,
        industry: data.industry || null,
        website_url: data.websiteUrl || null,
        description: data.description || null,
        location: data.location || null,
      }

      const { error } = await supabase
        .from('company_profiles')
        .upsert(row, { onConflict: 'user_id' })

      if (error) {
        setFormError('root', { message: error.message })
        return
      }

      router.push(isEditing ? '/dashboard' : '/internships/create')
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
                <Label htmlFor="companyName">{t('fields.companyName')}</Label>
                <Input
                  id="companyName"
                  {...register('companyName')}
                  placeholder={t('placeholders.companyName')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.companyName}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">{t('fields.industry')}</Label>
                <Input
                  id="industry"
                  {...register('industry')}
                  placeholder={t('placeholders.industry')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t('fields.location')}</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder={t('placeholders.location')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">{t('fields.website')}</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  {...register('websiteUrl')}
                  placeholder={t('placeholders.website')}
                  disabled={isSubmitting}
                />
                {errors.websiteUrl && (
                  <p className="text-red-500 text-sm">{errors.websiteUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">{t('fields.companySize')}</Label>
                <select
                  id="companySize"
                  {...register('companySize')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="">{t('placeholders.companySize')}</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('fields.description')}</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder={t('placeholders.description')}
                  rows={4}
                  disabled={isSubmitting}
                />
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
