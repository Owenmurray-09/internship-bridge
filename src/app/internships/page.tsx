'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSupabase } from '@/lib/supabase'
import { useTranslations } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'
import DashboardNav from '@/components/DashboardNav'
import type { Internship, UserRole } from '@/types/database'

export default function BrowseInternshipsPage() {
  const router = useRouter()
  const { t } = useTranslations('internships.browse')
  const { t: tCommon } = useTranslations('common')

  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState<UserRole>('student')

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

      const { data } = await supabase
        .from('internships')
        .select('*, company_profiles(company_name, location)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      setInternships((data as Internship[]) || [])
      setLoading(false)
    }
    load()
  }, [router])

  const filtered = internships.filter((i) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.location?.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{tCommon('loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={userName} userRole={userRole} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
          <p className="text-gray-600 mt-1">{t('description')}</p>
        </div>

        <div className="mb-6">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">
                {search ? t('noResults') : t('noInternships')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((internship) => {
              const company = (internship as unknown as Record<string, unknown>).company_profiles as
                | { company_name: string; location?: string }
                | undefined
              return (
                <Card key={internship.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{internship.title}</CardTitle>
                    <CardDescription>
                      {company?.company_name}
                      {company?.location && ` - ${company.location}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {internship.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {internship.location && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {internship.location}
                        </span>
                      )}
                      {internship.remote_allowed && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {t('remote')}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto">
                      <Link href={`/internships/${internship.id}`}>
                        <Button className="w-full">{t('viewDetails')}</Button>
                      </Link>
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
