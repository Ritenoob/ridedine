import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default async function Home() {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Access Denied</h1>
        <p>You must be an admin to access this dashboard.</p>
      </div>
    )
  }

  redirect('/dashboard')
}
