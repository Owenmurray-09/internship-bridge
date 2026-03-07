'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSupabase } from '@/lib/supabase'
import { sendNotification } from '@/lib/email'
import { signupSchema, type SignupInput } from '@/lib/validation'
import type { School } from '@/types/database'
import { useTranslations } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'

export default function SignUpPage() {
  const router = useRouter()
  const { t } = useTranslations('auth.signup')
  const { t: tErrors } = useTranslations('errors')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
    watch,
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'student',
      schoolId: '',
    },
  })

  const [message, setMessage] = useState('')
  const [schools, setSchools] = useState<School[]>([])
  const watchedRole = watch('role')

  useEffect(() => {
    const loadSchools = async () => {
      const supabase = createClientSupabase()
      const { data } = await supabase
        .from('schools')
        .select('*')
        .eq('active', true)
        .order('name')
      if (data) setSchools(data as School[])
    }
    loadSchools()
  }, [])

  const onSubmit = async (data: SignupInput) => {
    setMessage('')

    try {
      const supabase = createClientSupabase()
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
          }
        }
      })

      if (error) {
        setFormError('root', { message: error.message })
        return
      }

      if (authData?.user) {
        const schoolId = data.schoolId || null

        // Insert user data into our users table
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            full_name: data.fullName,
            role: data.role,
            preferred_school_id: schoolId,
          })

        if (userError) {
          // Silent fail for user profile creation
          // The auth user is still created successfully
        }

        sendNotification({
          type: 'welcome',
          email: data.email,
          fullName: data.fullName,
        })

        // Create school membership if a school was selected
        if (schoolId) {
          await supabase
            .from('school_memberships')
            .insert({
              user_id: authData.user.id,
              school_id: schoolId,
              is_primary: true,
            })
        }

        setMessage(t('confirmationMessage'))
      }
    } catch (err) {
      setFormError('root', { message: tErrors('general') })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header with Language Toggle */}
      <div className="flex justify-between items-center p-4">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          InternshipBridge
        </Link>
        <LanguageToggle variant="compact" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t('title')}</CardTitle>
          <CardDescription className="text-center">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {errors.root.message}
              </div>
            )}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                {message}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('fullName')}</Label>
              <Input
                id="fullName"
                type="text"
                {...register('fullName')}
                disabled={isSubmitting}
                aria-invalid={!!errors.fullName}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm">{errors.fullName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
              <p className="text-gray-500 text-xs">
                {t('passwordHint')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t('role')}</Label>
              <select
                id="role"
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
                aria-invalid={!!errors.role}
              >
                <option value="student">{t('roleStudent')}</option>
                <option value="employer">{t('roleEmployer')}</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-sm">{errors.role.message}</p>
              )}
            </div>
            {schools.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="schoolId">{t('school')}</Label>
                <select
                  id="schoolId"
                  {...register('schoolId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="">
                    {watchedRole === 'employer' ? t('schoolOptionalGlobal') : t('selectSchool')}
                  </option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
                {errors.schoolId && (
                  <p className="text-red-500 text-sm">{errors.schoolId.message}</p>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">{t('hasAccount')} </span>
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              {t('signIn')}
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}