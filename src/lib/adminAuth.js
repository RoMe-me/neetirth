// ─────────────────────────────────────────────────────────────────────────────
// Admin authentication — checks Supabase session + admin_users table.
// Never trusts the client alone; RLS and the admin API enforce access too.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase, isSupabaseConfigured } from './supabase.js'

/**
 * Returns the current Supabase session, or null if not authenticated.
 */
export async function getSession() {
  if (!isSupabaseConfigured()) return null
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) return null
    return session
  } catch {
    return null
  }
}

/**
 * Returns true if the current user is an authenticated admin.
 * Checks both the auth session and the admin_users table via RLS-protected query.
 */
export async function isAdmin() {
  if (!isSupabaseConfigured()) return false
  try {
    const session = await getSession()
    if (!session?.user) return false

    // Query the admin_users table — RLS ensures only admins can read it
    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (error || !data) return false
    return data.role === 'admin' || data.role === 'superadmin'
  } catch {
    return false
  }
}

/**
 * Sign in with email + password.
 */
export async function signIn(email, password) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.')
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) return () => {}
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return () => subscription.unsubscribe()
}
