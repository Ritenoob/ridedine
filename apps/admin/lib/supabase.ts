/**
 * Compatibility wrapper for older imports:
 *   import { createClient } from "@/lib/supabase"
 * or similar.
 *
 * Use createClient() for server components/route handlers with SSR support.
 */
export { createClient, createActionClient } from "./supabase-server";
export { createClient as createBrowserClient } from "./supabase-browser";
