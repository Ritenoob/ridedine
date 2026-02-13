import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default async function Dashboard() {
  // Check for dev auth bypass
  const devAuthBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'
  
  let pendingChefs = 0
  let totalOrders = 0
  let isDevMode = false

  if (devAuthBypass && process.env.NODE_ENV === 'development') {
    // Dev mode - skip auth check, just fetch data
    isDevMode = true
    const supabase = await createClient()
    
    const { count: pendingCount } = await supabase
      .from('chefs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    pendingChefs = pendingCount || 0
    totalOrders = ordersCount || 0
  } else {
    // Production mode - check auth
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      redirect('/login')
    }

    // Get pending chefs count
    const { count: pendingCount } = await supabase
      .from('chefs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get recent orders count
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    pendingChefs = pendingCount || 0
    totalOrders = ordersCount || 0
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <nav style={{ 
        background: 'white', 
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Home Chef Delivery - Admin
          {isDevMode && (
            <span style={{ 
              marginLeft: '1rem',
              fontSize: '0.75rem',
              background: '#fff3cd',
              color: '#856404',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px'
            }}>
              DEV MODE
            </span>
          )}
        </h1>
      </nav>

      <div style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Dashboard</h2>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
              Pending Chef Approvals
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {pendingChefs}
            </p>
          </div>

          <div style={{ 
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
              Total Orders
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {totalOrders}
            </p>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          <Link 
            href="/dashboard/chefs"
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Manage Chefs
            </h3>
            <p style={{ color: '#666' }}>
              Approve chef applications and manage existing chefs
            </p>
          </Link>

          <Link
            href="/dashboard/orders"
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              View Orders
            </h3>
            <p style={{ color: '#666' }}>
              Monitor and manage all platform orders
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
