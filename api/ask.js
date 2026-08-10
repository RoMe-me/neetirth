export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(500).json({ error: 'AI is not configured yet. Add ANTHROPIC_API_KEY in Vercel environment variables.' })

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const question = typeof body.question === 'string' ? body.question.trim() : ''
  const image = body.image && typeof body.image === 'object' ? body.image : null
  if (!question && !image) return res.status(400).json({ error: 'Type a question or upload a question image first.' })
  if (question.length > 2500) return res.status(400).json({ error: 'Please keep questions under 2500 characters.' })

  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
  if (image) {
    if (!allowedTypes.has(image.mimeType) || typeof image.data !== 'string') return res.status(400).json({ error: 'Only JPG, PNG and WebP images are supported.' })
    // Base64 is roughly 4/3 the original size. Keep the request well below
    // serverless body limits so an accidental phone video cannot be submitted.
    if (image.data.length > 7_000_000) return res.status(413).json({ error: 'That image is too large. Please use an image under 5 MB.' })
  }

  const system = `You are Neetirth AI, a careful NEET UG tutor for Indian students. Answer using the current official NEET UG syllabus and NCERT-first explanations for Physics, Chemistry, and Biology. If a fact, question image, or answer key is unclear, say exactly what is uncertain instead of guessing. For numericals, show formula, substitutions, units, and final answer. Identify the chapter and the key idea when useful. Keep the tone friendly, precise, and exam-focused. Never claim to be an official NTA answer key; recommend checking the official source for disputed questions.`
  const content = []
  if (question) content.push({ type: 'text', text: question })
  if (image) content.push({ type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.data } })

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 1800,
        system,
        messages: [{ role:'user', content }],
      }),
    })
    const data = await upstream.json()
    if (!upstream.ok) {
      const message = data?.error?.message || data?.error || data?.message || `AI request failed with HTTP ${upstream.status}`
      return res.status(upstream.status).json({ error: message, upstreamStatus: upstream.status })
    }
    const answer = data?.content?.map(part => part?.text || '').join('\n').trim()
    if (!answer) return res.status(502).json({ error: 'AI returned an empty answer. Please retry.' })
    return res.status(200).json({ answer })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'AI request failed. Please retry.' })
  }
}
