import { createClient } from "@supabase/supabase-js";
import { env, assertEnv } from "./env";

assertEnv();

export const supabaseBrowser = () =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Compatibility export for older code:
export const createBrowserClient = supabaseBrowser;
export const createClientBrowser = supabaseBrowser;
