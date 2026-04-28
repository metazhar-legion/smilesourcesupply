import { createClient } from '@supabase/supabase-js';

// We hardcode the URL since it's practically public API data, and look for the ANON_KEY in the Vite env
const supabaseUrl = 'https://jasbsbzuwmmgpanketwr.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.warn("Missing VITE_SUPABASE_ANON_KEY! The frontend cannot authenticate with Supabase without it.");
}

export const supabase = createClient(supabaseUrl, supabaseKey || "dummykey");
