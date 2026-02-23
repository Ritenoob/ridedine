import { createBrowserClient } from '@supabase/ssr';
import { env } from './env';

export function createClient() {
  // During build time, return a mock client to allow static generation
  if (typeof window === 'undefined') {
    return null as any;
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Supabase env vars are not configured in the browser');
    }
    return null as any;
  }

  return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}
