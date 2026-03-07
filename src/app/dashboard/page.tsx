import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardContent from './DashboardContent'

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

  return (
    <DashboardContent
      userName={userData?.full_name || user.email || ''}
      userRole={userData?.role ?? 'student'}
    />
  )
}
