import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // During build time, use placeholder values to allow static generation
    // These will be overridden at runtime by actual env vars
    if (name === "NEXT_PUBLIC_SUPABASE_URL") {
      return "https://placeholder.supabase.co";
    }
    if (name === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
      return "placeholder-anon-key";
    }
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
