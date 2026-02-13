import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  
  // Warn if using placeholders at runtime
  if (typeof window !== 'undefined' && supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('⚠️ Supabase environment variables not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
