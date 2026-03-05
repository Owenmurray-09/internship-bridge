'use client'

import { Button } from '@/components/ui/button'
import SchoolPicker from '@/components/SchoolPicker'
import LanguageToggle from '@/components/LanguageToggle'
import type { UserRole } from '@/types/database'

interface DashboardNavProps {
  userName: string
  userRole: UserRole
}

export default function DashboardNav({ userName, userRole }: DashboardNavProps) {
  const showAllSchoolsOption = userRole === 'global_admin' || userRole === 'employer'

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">InternshipBridge</h1>
          </div>
          <div className="flex items-center space-x-4">
            <SchoolPicker variant="compact" showAllSchoolsOption={showAllSchoolsOption} />
            <LanguageToggle variant="compact" />
            <span className="text-sm text-gray-600">Welcome, {userName}</span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
