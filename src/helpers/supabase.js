import { createClient } from '@supabase/supabase-js';

// در Vite از import.meta.env استفاده می‌شود
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// بررسی برای اطمینان از اینکه مقادیر خالی نیستند
if (!supabaseUrl || !supabaseKey) {
    console.error("⚠️ Supabase URL or Anon Key is missing in .env file");
}

export const supabase = createClient(supabaseUrl, supabaseKey);