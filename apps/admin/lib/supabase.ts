/**
 * Compatibility wrapper for older imports:
 *   import { createClient } from "@/lib/supabase"
 * or similar.
 *
 * Use supabaseServer() for server components/route handlers.
 */
export { supabaseServer as createClient } from "./supabase-server";
export { supabaseServer } from "./supabase-server";
export { supabaseBrowser as createBrowserSupabaseClient } from "./supabase-browser";
