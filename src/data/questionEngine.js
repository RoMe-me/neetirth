// ═══════════════════════════════════════════════════════════════
// NEETIRTH QUESTION ENGINE
// Single source of truth for all question delivery.
// Combines PYQ bank + Practice bank + AI cache.
// Handles adaptive difficulty automatically.
// ═══════════════════════════════════════════════════════════════

import { PYQ, CHAPTERS, SC, ICONS } from './pyqBank.js'
import { PRACTICE } from './practiceBank.js'

const CACHE_PREFIX = 'neetirth_genq_'
const PERF_PREFIX  = 'neetirth_perf_'

// ── Performance tracking ──────────────────────────────────────
export function recordPerformance(chapter, correct, total) {
  try {
    const key = PERF_PREFIX + chapter
    const existing = JSON.parse(localStorage.getItem(key) || '{"c":0,"t":0}')
    existing.c += correct
    existing.t += total
    localStorage.setItem(key, JSON.stringify(existing))
  } catch {}
}

export function getChapterAccuracy(chapter) {
  try {
    const d = JSON.parse(localStorage.getItem(PERF_PREFIX + chapter) || '{"c":0,"t":0}')
    return d.t > 0 ? Math.round(d.c / d.t * 100) : null
  } catch { return null }
}

// Adaptive difficulty: based on past accuracy
export function getAdaptiveDifficulty(chapter) {
  const acc = getChapterAccuracy(chapter)
  if (acc === null) return null        // no data → balanced
  if (acc >= 80)   return 'hard'       // crushing it → hard only
  if (acc >= 60)   return 'medium'     // good → medium+hard
  return 'easy'                        // struggling → start easy
}

// ── Cache helpers ─────────────────────────────────────────────
function getCached(chapter) {
  try {
    if (typeof localStorage === 'undefined') return []
    const v = localStorage.getItem(CACHE_PREFIX + chapter)
    return v ? JSON.parse(v) : []
  } catch { return [] }
}

export function setCached(chapter, qs) {
  try { localStorage.setItem(CACHE_PREFIX + chapter, JSON.stringify(qs)) } catch {}
}

export function getCacheStats() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX))
    const total = keys.reduce((a, k) => {
      try { return a + (JSON.parse(localStorage.getItem(k)) || []).length } catch { return a }
    }, 0)
    return { chapters: keys.length, total }
  } catch { return { chapters: 0, total: 0 } }
}

export function clearCache() {
  try {
    Object.keys(localStorage).filter(k =>
      k.startsWith(CACHE_PREFIX) || k.startsWith(PERF_PREFIX)
    ).forEach(k => localStorage.removeItem(k))
  } catch {}
}

// ── Balanced difficulty picker ────────────────────────────────
export function balancedPick(pool, count, diffOverride = null) {
  if (diffOverride) {
    const filtered = pool.filter(q => (q.d || q.diff) === diffOverride)
    return filtered.sort(() => Math.random() - 0.5).slice(0, count)
  }
  const e = pool.filter(q => (q.d || q.diff) === 'easy').sort(()   => Math.random() - 0.5)
  const m = pool.filter(q => (q.d || q.diff) === 'medium').sort(() => Math.random() - 0.5)
  const h = pool.filter(q => (q.d || q.diff) === 'hard').sort(()   => Math.random() - 0.5)
  const nE = Math.min(Math.round(count * 0.30), e.length)
  const nH = Math.min(Math.round(count * 0.20), h.length)
  const nM = Math.min(count - nE - nH, m.length)
  const picked = [...e.slice(0, nE), ...m.slice(0, nM), ...h.slice(0, nH)]
  const remain = count - picked.length
  if (remain > 0) {
    const used = new Set(picked.map(q => q.id))
    const extra = pool.filter(q => !used.has(q.id)).sort(() => Math.random() - 0.5).slice(0, remain)
    picked.push(...extra)
  }
  return picked.sort(() => Math.random() - 0.5)
}

// ── Core getter: combines PYQ + Practice + AI cache ──────────
export function getQuestions({ subject = null, chapters = [], count = 20, difficulty = null } = {}) {
  // Build combined pool
  let pool = []

  // From PYQ bank
  let pyqPool = [...PYQ]
  if (subject)       pyqPool = pyqPool.filter(q => q.sub === subject)
  if (chapters.length) pyqPool = pyqPool.filter(q => chapters.includes(q.ch))
  pool.push(...pyqPool)

  // From practice bank
  let pracPool = [...PRACTICE]
  if (subject)       pracPool = pracPool.filter(q => q.sub === subject)
  if (chapters.length) pracPool = pracPool.filter(q => chapters.includes(q.ch))
  pool.push(...pracPool)

  // From AI cache
  chapters.forEach(ch => {
    const cached = getCached(ch)
    pool.push(...cached)
  })
  if (!chapters.length && subject) {
    // Get all cached for subject chapters
    const allChs = CHAPTERS[subject]
      ? Object.values(CHAPTERS[subject].sections).flat()
      : []
    allChs.forEach(ch => {
      const cached = getCached(ch)
      pool.push(...cached.filter(q => q.sub === subject))
    })
  }

  // Deduplicate
  const seen = new Set()
  pool = pool.filter(q => {
    const key = q.id || q.q
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (!pool.length) return []

  return balancedPick(pool, Math.min(count, pool.length), difficulty)
}

// ── Chapter question count (for UI display) ───────────────────
export function getChapterCount(subject, chapter) {
  try {
    const pyqN  = PYQ.filter(q => q.sub === subject && q.ch === chapter).length
    const pracN = PRACTICE.filter(q => q.sub === subject && q.ch === chapter).length
    const cacheN = getCached(chapter).length
    return pyqN + pracN + cacheN
  } catch { return 0 }
}

// ── AI generation (silent) ────────────────────────────────────
export async function generateAndCache(chapter, subject, count = 25) {
  // Cap the per-call batch size regardless of what's requested — asking the AI for
  // too many questions in one shot reliably truncates the response before max_tokens
  // covers it, which fails JSON parsing and silently yields ZERO new questions.
  // Better to reliably get 25-30 good ones than to ask for 45 and get none.
  const safeCount = Math.min(count, 28)
  const prompt = `Generate exactly ${safeCount} NEET UG practice questions for "${chapter}" (${subject}).

Difficulty (STRICT — real NEET 2024 pattern):
30% easy | 50% medium | 20% hard

Include 4-5 Assertion-Reasoning questions (type:"ar").
Medium/hard must require reasoning, not just recall.
Hard questions should have NEET-style traps (exception, wrong-looking correct answer).

For A-R use EXACTLY these options:
A:"Both A and R correct, R explains A"
B:"Both A and R correct, R does not explain A"
C:"A correct, R wrong"
D:"A wrong"

Return ONLY JSON array, no markdown:
[{"id":"g1","q":"...","o":{"A":"","B":"","C":"","D":""},"a":"A","e":"brief explanation","ch":"${chapter}","sub":"${subject}","d":"medium","type":"mcq"}]`

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 16000, messages: [{ role: 'user', content: prompt }] })
  })
  if (!res.ok) {
    let errMsg = 'Generation failed.'
    try { const err = await res.json(); errMsg = err.error || errMsg } catch {}
    if (res.status === 500) errMsg = 'API key not configured. Go to Vercel → Settings → Environment Variables → add ANTHROPIC_API_KEY.'
    throw new Error(errMsg)
  }
  const data = await res.json()
  const raw = data?.content?.[0]?.text || ''
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Invalid response from AI. Try again.')
  const generated = JSON.parse(match[0]).map((q, i) => ({ ...q, id: `gen_${Date.now()}_${i}`, pyq: false }))

  // Merge with existing cache
  const existing = getCached(chapter)
  const merged = [...existing, ...generated]
  setCached(chapter, merged)
  return { generated, total: merged.length }
}
