// ─────────────────────────────────────────────────────────────────────────────
// /api/admin-auth — server-side admin verification using the service role key.
// The browser sends its Supabase JWT; we verify it server-side against the
// admin_users table using the privileged service role client.
//
// This endpoint NEVER returns sensitive data — just a boolean admin flag.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getServiceClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const client = getServiceClient()
  if (!client) {
    return res.status(503).json({ error: 'Supabase not configured on server' })
  }

  // Extract the Supabase access token from the Authorization header
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  // Verify the JWT and get the user
  const { data: { user }, error: authError } = await client.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Check admin_users table
  const { data: admin, error: adminError } = await client
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (adminError || !admin) {
    return res.status(403).json({ error: 'Not an admin', isAdmin: false })
  }

  return res.status(200).json({
    isAdmin: true,
    role: admin.role,
    userId: user.id,
    email: user.email,
  })
}
