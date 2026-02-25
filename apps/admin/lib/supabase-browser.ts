import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let supabase: SupabaseClient | null = null;

/**
 * Returns a browser-ready Supabase client.
 *
 * If env vars are missing we return null to allow static builds to succeed
 * while clearly warning in development. Callers should handle the null case
 * (e.g., by showing a configuration error or skipping Supabase calls).
 */
export const supabaseBrowser = (): SupabaseClient | null => {
  if (!supabase) {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Supabase env vars are not configured in the browser");
      }
      return null;
    }
    supabase = createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }
  return supabase;
};

export const createClient = supabaseBrowser;
