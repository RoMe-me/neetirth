export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(500).json({ error: 'AI generation is not configured. Add ANTHROPIC_API_KEY in Vercel environment variables.' })

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const messages = Array.isArray(body.messages) ? body.messages : []
  if (!messages.length) return res.status(400).json({ error: 'A generation prompt is required.' })

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || body.model || 'claude-sonnet-4-6',
        max_tokens: Math.min(Number(body.max_tokens) || 16000, 20000),
        messages,
      }),
    })
    const data = await upstream.json()
    if (!upstream.ok) {
      const message = data?.error?.message || data?.error || data?.message || `Anthropic request failed with HTTP ${upstream.status}`
      return res.status(upstream.status).json({ error:message, upstreamStatus:upstream.status })
    }
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error:error?.message || 'AI generation failed. Please retry.' })
  }
}
