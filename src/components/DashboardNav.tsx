'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import SchoolPicker from '@/components/SchoolPicker'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslations } from '@/lib/i18n'
import type { UserRole } from '@/types/database'

interface NavLink {
  href: string
  labelKey: string
}

const NAV_LINKS: Record<string, NavLink[]> = {
  student: [
    { href: '/dashboard', labelKey: 'navigation.dashboard' },
    { href: '/internships', labelKey: 'navigation.browseInternships' },
    { href: '/applications', labelKey: 'navigation.myApplications' },
    { href: '/profile', labelKey: 'navigation.myProfile' },
  ],
  employer: [
    { href: '/dashboard', labelKey: 'navigation.dashboard' },
    { href: '/internships/create', labelKey: 'navigation.postInternship' },
    { href: '/internships/manage', labelKey: 'navigation.myInternships' },
    { href: '/applications/review', labelKey: 'navigation.reviewApplications' },
    { href: '/profile/company', labelKey: 'navigation.companyProfile' },
  ],
  school_admin: [
    { href: '/dashboard', labelKey: 'navigation.dashboard' },
    { href: '/admin/students', labelKey: 'navigation.manageStudents' },
    { href: '/admin/employers', labelKey: 'navigation.manageEmployers' },
    { href: '/admin/settings', labelKey: 'navigation.schoolSettings' },
  ],
  global_admin: [
    { href: '/dashboard', labelKey: 'navigation.dashboard' },
    { href: '/global-admin/schools', labelKey: 'navigation.manageSchools' },
    { href: '/global-admin/users', labelKey: 'navigation.manageUsers' },
    { href: '/global-admin/stats', labelKey: 'navigation.systemStatistics' },
  ],
}

interface DashboardNavProps {
  userName: string
  userRole: UserRole
}

export default function DashboardNav({ userName, userRole }: DashboardNavProps) {
  const showAllSchoolsOption = userRole === 'global_admin' || userRole === 'employer'
  const [menuOpen, setMenuOpen] = useState(false)
  const links = NAV_LINKS[userRole] || NAV_LINKS.student
  const { t } = useTranslations()

  return (
    <nav className="bg-white shadow-sm border-b relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label={t('navigation.menu')}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <Link href="/dashboard" className="text-xl font-semibold text-gray-900">InternshipBridge</Link>
          </div>
          <div className="flex items-center space-x-4">
            <SchoolPicker variant="compact" showAllSchoolsOption={showAllSchoolsOption} />
            <LanguageToggle variant="compact" />
            <span className="text-sm text-gray-600 hidden sm:inline">{t('common.welcome', { name: userName })}</span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm">
                {t('common.signOut')}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute top-16 left-0 w-64 bg-white border border-gray-200 shadow-lg rounded-b-md z-50">
          <div className="py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
