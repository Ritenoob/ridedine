import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env, assertEnv } from "./env";

assertEnv();

export const supabaseBrowser = () =>
  createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export const createBrowserClient = supabaseBrowser;
export const createClientBrowser = supabaseBrowser;
export const createClient = supabaseBrowser;
