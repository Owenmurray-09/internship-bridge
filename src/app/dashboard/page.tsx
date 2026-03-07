import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/auth/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const isStudent = userData?.role === 'student'
  const isEmployer = userData?.role === 'employer'
  const isSchoolAdmin = userData?.role === 'school_admin'
  const isGlobalAdmin = userData?.role === 'global_admin'

  const getRoleDescription = () => {
    if (isStudent) return 'Find and apply for internships that match your skills and interests.'
    if (isEmployer) return 'Manage your internship postings and review applications.'
    if (isSchoolAdmin) return 'Manage your school\'s students, employers, and settings.'
    if (isGlobalAdmin) return 'System-wide administration across all schools.'
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        userName={userData?.full_name || user.email || ''}
        userRole={userData?.role ?? 'student'}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h2>
          <p className="text-gray-600 mt-1">{getRoleDescription()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Student Dashboard Cards */}
          {isStudent && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Browse Internships</CardTitle>
                  <CardDescription>
                    Find internship opportunities that match your profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/internships">
                    <Button className="w-full">Browse Opportunities</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Applications</CardTitle>
                  <CardDescription>
                    Track the status of your internship applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/applications">
                    <Button className="w-full" variant="outline">View Applications</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Complete Profile</CardTitle>
                  <CardDescription>
                    Update your profile to attract employers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/profile">
                    <Button className="w-full" variant="outline">Edit Profile</Button>
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
                  <CardTitle>Post New Internship</CardTitle>
                  <CardDescription>
                    Create a new internship opportunity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/internships/create">
                    <Button className="w-full">Post Internship</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Internships</CardTitle>
                  <CardDescription>
                    Manage your posted internship opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/internships/manage">
                    <Button className="w-full" variant="outline">Manage Postings</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Review Applications</CardTitle>
                  <CardDescription>
                    Review and respond to student applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/applications/review">
                    <Button className="w-full" variant="outline">Review Applications</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Company Profile</CardTitle>
                  <CardDescription>
                    Update your company information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/profile/company">
                    <Button className="w-full" variant="outline">Edit Company Profile</Button>
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
                  <CardTitle>Manage Students</CardTitle>
                  <CardDescription>
                    View and manage students at your school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/students">
                    <Button className="w-full">View Students</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manage Employers</CardTitle>
                  <CardDescription>
                    View employers affiliated with your school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/employers">
                    <Button className="w-full" variant="outline">View Employers</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>School Settings</CardTitle>
                  <CardDescription>
                    Update school branding and configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/settings">
                    <Button className="w-full" variant="outline">School Settings</Button>
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
                  <CardTitle>Manage Schools</CardTitle>
                  <CardDescription>
                    Add, edit, and manage all schools in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/global-admin/schools">
                    <Button className="w-full">Manage Schools</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manage Users</CardTitle>
                  <CardDescription>
                    View and manage all users across all schools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/global-admin/users">
                    <Button className="w-full" variant="outline">View Users</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Statistics</CardTitle>
                  <CardDescription>
                    View aggregate statistics across all schools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/global-admin/stats">
                    <Button className="w-full" variant="outline">View Stats</Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}