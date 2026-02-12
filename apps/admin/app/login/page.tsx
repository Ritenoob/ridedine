'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Dev auth bypass flag
  const devAuthBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

  useEffect(() => {
    // Auto-login in dev mode if bypass is enabled
    if (devAuthBypass && process.env.NODE_ENV === 'development') {
      handleDevBypass()
    }
  }, [])

  const handleDevBypass = async () => {
    console.log('DEV MODE: Auth bypass enabled - auto-login as admin')
    // In dev mode, we'll just skip to dashboard
    // The pages will need to handle dev mode separately
    router.push('/dashboard')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role !== 'admin') {
      setError('Access denied. Admin privileges required.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  // Show dev bypass notice
  if (devAuthBypass && process.env.NODE_ENV === 'development') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffc107',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <strong>DEV MODE ACTIVE</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
              Authentication bypass enabled. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f5f5f5'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          Admin Login
        </h1>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              required
            />
          </div>
          
          {error && (
            <div style={{ 
              color: '#d32f2f', 
              marginBottom: '1rem',
              padding: '0.75rem',
              background: '#ffebee',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '0.75rem',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
