'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DashboardNav from '@/components/DashboardNav'
import { useTranslations } from '@/lib/i18n'
import type { UserRole } from '@/types/database'

interface DashboardContentProps {
  userName: string
  userRole: UserRole
}

export default function DashboardContent({ userName, userRole }: DashboardContentProps) {
  const { t } = useTranslations('dashboard')

  const isStudent = userRole === 'student'
  const isEmployer = userRole === 'employer'
  const isSchoolAdmin = userRole === 'school_admin'
  const isGlobalAdmin = userRole === 'global_admin'

  const getRoleDescription = () => {
    if (isStudent) return t('roleDescription.student')
    if (isEmployer) return t('roleDescription.employer')
    if (isSchoolAdmin) return t('roleDescription.schoolAdmin')
    if (isGlobalAdmin) return t('roleDescription.globalAdmin')
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        userName={userName}
        userRole={userRole}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('pageTitle')}
          </h2>
          <p className="text-gray-600 mt-1">{getRoleDescription()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Student Dashboard Cards */}
          {isStudent && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.browseInternships.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.browseInternships.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/internships">
                    <Button className="w-full">{t('cards.browseInternships.button')}</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.myApplications.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.myApplications.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/applications">
                    <Button className="w-full" variant="outline">{t('cards.myApplications.button')}</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.completeProfile.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.completeProfile.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/profile">
                    <Button className="w-full" variant="outline">{t('cards.completeProfile.button')}</Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          )}

          {/* Employer Dashboard Cards */}
          {isEmployer && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.postInternship.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.postInternship.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/internships/create">
                    <Button className="w-full">{t('cards.postInternship.button')}</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.myInternships.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.myInternships.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/internships/manage">
                    <Button className="w-full" variant="outline">{t('cards.myInternships.button')}</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.reviewApplications.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.reviewApplications.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/applications/review">
                    <Button className="w-full" variant="outline">{t('cards.reviewApplications.button')}</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.companyProfile.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.companyProfile.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/profile/company">
                    <Button className="w-full" variant="outline">{t('cards.companyProfile.button')}</Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          )}

          {/* School Admin Dashboard Cards */}
          {isSchoolAdmin && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.manageStudents.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.manageStudents.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/students">
                    <Button className="w-full">{t('cards.manageStudents.button')}</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.manageEmployers.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.manageEmployers.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/employers">
                    <Button className="w-full" variant="outline">{t('cards.manageEmployers.button')}</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.schoolSettings.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.schoolSettings.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/settings">
                    <Button className="w-full" variant="outline">{t('cards.schoolSettings.button')}</Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          )}

          {/* Global Admin Dashboard Cards */}
          {isGlobalAdmin && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.manageSchools.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.manageSchools.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/global-admin/schools">
                    <Button className="w-full">{t('cards.manageSchools.button')}</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.manageUsers.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.manageUsers.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/global-admin/users">
                    <Button className="w-full" variant="outline">{t('cards.manageUsers.button')}</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('cards.systemStats.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.systemStats.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/global-admin/stats">
                    <Button className="w-full" variant="outline">{t('cards.systemStats.button')}</Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('quickStats.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <p className="text-sm text-gray-600">
                  {isStudent && t('quickStats.student.submitted')}
                  {isEmployer && t('quickStats.employer.active')}
                  {isSchoolAdmin && t('quickStats.schoolAdmin.students')}
                  {isGlobalAdmin && t('quickStats.globalAdmin.schools')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">0</div>
                <p className="text-sm text-gray-600">
                  {isStudent && t('quickStats.student.invites')}
                  {isEmployer && t('quickStats.employer.applications')}
                  {isSchoolAdmin && t('quickStats.schoolAdmin.employers')}
                  {isGlobalAdmin && t('quickStats.globalAdmin.users')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <p className="text-sm text-gray-600">
                  {isStudent && t('quickStats.student.views')}
                  {isEmployer && t('quickStats.employer.thisWeek')}
                  {isSchoolAdmin && t('quickStats.schoolAdmin.internships')}
                  {isGlobalAdmin && t('quickStats.globalAdmin.internships')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <p className="text-sm text-gray-600">
                  {isStudent && t('quickStats.student.saved')}
                  {isEmployer && t('quickStats.employer.profileViews')}
                  {isSchoolAdmin && t('quickStats.schoolAdmin.thisWeek')}
                  {isGlobalAdmin && t('quickStats.globalAdmin.thisWeek')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
