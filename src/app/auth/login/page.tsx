'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSupabase } from '@/lib/supabase'
import { loginSchema, type LoginInput } from '@/lib/validation'
import { useTranslations } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useTranslations('auth.login')
  const { t: tCommon } = useTranslations('common')
  const { t: tErrors } = useTranslations('errors')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      const supabase = createClientSupabase()
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setFormError('root', { message: error.message })
        return
      }

      if (authData?.user) {
        // Give a small delay to ensure session is set
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 100)
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
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">{t('noAccount')} </span>
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              {t('signUp')}
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}