'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import SchoolPicker from '@/components/SchoolPicker'
import LanguageToggle from '@/components/LanguageToggle'
import type { UserRole } from '@/types/database'

interface NavLink {
  href: string
  label: string
}

const NAV_LINKS: Record<string, NavLink[]> = {
  student: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/internships', label: 'Browse Internships' },
    { href: '/applications', label: 'My Applications' },
    { href: '/profile', label: 'My Profile' },
  ],
  employer: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/internships/create', label: 'Post Internship' },
    { href: '/internships/manage', label: 'My Internships' },
    { href: '/applications/review', label: 'Review Applications' },
    { href: '/profile/company', label: 'Company Profile' },
  ],
  school_admin: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/admin/students', label: 'Manage Students' },
    { href: '/admin/employers', label: 'Manage Employers' },
    { href: '/admin/settings', label: 'School Settings' },
  ],
  global_admin: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/global-admin/schools', label: 'Manage Schools' },
    { href: '/global-admin/users', label: 'Manage Users' },
    { href: '/global-admin/stats', label: 'System Statistics' },
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

  return (
    <nav className="bg-white shadow-sm border-b relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Menu"
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
            <span className="text-sm text-gray-600 hidden sm:inline">Welcome, {userName}</span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Sign Out
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
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
