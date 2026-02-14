function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // During build time, use placeholder values to allow static generation
    // Runtime validation will occur in the client components
    // This is safe because Next.js 15 pre-renders pages at build time but
    // the actual Supabase client is only created at runtime in the browser
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
    if (isBuildTime) {
      if (name === "NEXT_PUBLIC_SUPABASE_URL") {
        return "https://placeholder.supabase.co";
      }
      if (name === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
        return "placeholder-anon-key";
      }
    }
    // At runtime, throw an error if env vars are missing
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Main helper used across the Admin app.
 * Keeps backward compatibility with code importing createClient().
 */
export async function createClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createSupabaseClient(url, anonKey);
}

/**
 * Explicit browser helper for client components.
 */
export function createBrowserSupabaseClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createSupabaseClient(url, anonKey);
}

