// ─────────────────────────────────────────────────────────────────────────────
// Supabase client — single shared instance used across the app.
// The anon key is safe to embed in the browser; RLS enforces access control.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create client only when credentials are configured. This lets the app run
// normally (in offline-first mode) even without Supabase set up.
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function isSupabaseConfigured() {
  return Boolean(supabase)
}
