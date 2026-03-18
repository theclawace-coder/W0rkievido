import { createClient } from '@supabase/supabase-js';

// dotenv only needed for local dev, Vercel injects env vars
try { const dotenv = await import('dotenv'); dotenv.config(); } catch {}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in env');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
