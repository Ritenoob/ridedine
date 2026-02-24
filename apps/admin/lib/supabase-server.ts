import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabaseServer = () =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export const getSupabaseServer = supabaseServer;
