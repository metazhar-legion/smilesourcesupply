import { createClient } from '@supabase/supabase-js';

// Load URL and ANON_KEY from the Vite env instead of exposing it
const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.warn("Missing VITE_SUPABASE_ANON_KEY! The frontend cannot authenticate with Supabase without it.");
}

export const supabase = createClient(supabaseUrl, supabaseKey || "dummykey");
