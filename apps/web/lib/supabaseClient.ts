import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let supabase: SupabaseClient | null = null;

function createSupabaseClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}

export function getSupabaseClient() {
  if (!supabase) {
    supabase = createSupabaseClient();
  }
  return supabase;
}

export { getSupabaseClient as default };
