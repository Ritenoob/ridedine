import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default async function Home() {
  // Check for dev auth bypass
  const devAuthBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'
  
  if (devAuthBypass && process.env.NODE_ENV === 'development') {
    // In dev mode, skip auth and go to dashboard
    redirect('/dashboard')
  }

  const supabase = await createClient()
  
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
