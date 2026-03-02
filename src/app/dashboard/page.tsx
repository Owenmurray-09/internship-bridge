import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">InternshipBridge</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {userData?.full_name || user.email}</span>
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="outline" size="sm">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            {isStudent && 'Find and apply for internships that match your skills and interests.'}
            {isEmployer && 'Manage your internship postings and review applications.'}
          </p>
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
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <p className="text-sm text-gray-600">
                  {isStudent ? 'Applications Submitted' : 'Active Internships'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">0</div>
                <p className="text-sm text-gray-600">
                  {isStudent ? 'Interview Invites' : 'Total Applications'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <p className="text-sm text-gray-600">
                  {isStudent ? 'Profile Views' : 'Applications This Week'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <p className="text-sm text-gray-600">
                  {isStudent ? 'Saved Internships' : 'Company Profile Views'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}