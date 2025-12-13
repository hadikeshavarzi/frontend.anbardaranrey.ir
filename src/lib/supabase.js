import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hcvdgqkhrjkdilqeovkp.supabase.co";
const SUPABASE_ANON_KEY = "PUBLIC_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
