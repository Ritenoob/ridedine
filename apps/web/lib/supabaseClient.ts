/**
 * Compatibility wrapper for older imports:
 *   import supabase from "@/lib/supabaseClient"
 *   import { supabaseClient } from "@/lib/supabaseClient"
 */
import { createClient } from "@supabase/supabase-js";
import { env, assertEnv } from "./env";

assertEnv();

export const supabaseClient = () =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Some codebases default-export the client factory.
export default supabaseClient;
