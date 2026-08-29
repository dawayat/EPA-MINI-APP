import { createClient } from '@supabase/supabase-js';

// Supabase project credentials - hardcoded so app works on all environments
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cnwkuzihcmtenpoliqpn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9IzznKtQlwTpwG3CMLVLEA_kIROxwDF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = true;

// Helper to check if we're in demo mode (no backend) - always false now
export const isDemoMode = false;
