export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'AI is not configured yet. Add ANTHROPIC_API_KEY in Vercel environment variables.' });

  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  if (!question) return res.status(400).json({ error: 'Please type a question first.' });
  if (question.length > 2500) return res.status(400).json({ error: 'Please keep questions under 2500 characters.' });

  const system = `You are Neetirth AI, a careful NEET UG tutor for Indian students. Answer using NCERT-first explanations for Physics, Chemistry, and Biology. If a fact is uncertain or outside NCERT/NEET scope, say so clearly instead of guessing. For numericals, show steps, units, and final answer. Keep the tone friendly and concise.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1400,
        system,
        messages: [{ role: 'user', content: question }]
      })
    });

    const data = await r.json();
    if (!r.ok) {
      const message = data?.error?.message || data?.error || data?.message || `AI request failed with HTTP ${r.status}`;
      return res.status(r.status).json({ error: message, upstreamStatus: r.status });
    }

    const answer = data?.content?.map(part => part?.text || '').join('\n').trim();
    if (!answer) return res.status(502).json({ error: 'AI returned an empty answer. Please retry.' });
    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'AI request failed. Please retry.' });
  }
}
