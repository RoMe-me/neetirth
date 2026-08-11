// ─────────────────────────────────────────────────────────────────────────────
// /api/health — lightweight health endpoint for the monitoring workflow.
// Returns 200 with basic status; never exposes secrets or internal details.
// ─────────────────────────────────────────────────────────────────────────────
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.status(200).json({
    status: 'ok',
    service: 'neetirth',
    timestamp: new Date().toISOString(),
    env: process.env.VERCEL_ENV || 'development',
  })
}
