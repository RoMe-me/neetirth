// Neetirth is offline-first: all progress is stored locally and every read is
// defensive so an old/corrupt browser record can never blank the application.
const PREFIX = 'neetirth_'

const asObject = value => value && typeof value === 'object' ? value : null

export const store = {
  get(key, fallback = null) {
    try {
      if (typeof localStorage === 'undefined') return fallback
      const raw = localStorage.getItem(PREFIX + key)
      if (!raw) return fallback
      const value = JSON.parse(raw)
      return value ?? fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PREFIX + key, JSON.stringify(value))
      }
      return true
    } catch (e) {
      console.warn('Neetirth could not save local data:', e)
      return false
    }
  },
  del(key) {
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(PREFIX + key) } catch {}
  },
}

// User identity
export function getUser() {
  const user = asObject(store.get('user'))
  return user && typeof user.name === 'string' && user.name.trim() ? user : null
}
export function setUser(user) { store.set('user', user) }

// Mock history — only return records that can be rendered safely.
export function getHistory() {
  const history = store.get('history', [])
  if (!Array.isArray(history)) return []
  return history.filter(record => record && typeof record === 'object').map(record => ({
    ...record,
    score: Number.isFinite(Number(record.score)) ? Number(record.score) : 0,
    max: Number.isFinite(Number(record.max)) && Number(record.max) > 0 ? Number(record.max) : 720,
    pct: Number.isFinite(Number(record.pct)) ? Number(record.pct) : 0,
    c: Number.isFinite(Number(record.c)) ? Number(record.c) : 0,
    w: Number.isFinite(Number(record.w)) ? Number(record.w) : 0,
    s: Number.isFinite(Number(record.s)) ? Number(record.s) : 0,
    n: Number.isFinite(Number(record.n)) ? Number(record.n) : 0,
    cm: record.cm && typeof record.cm === 'object' ? record.cm : {},
  }))
}
export function saveHistory(history) { store.set('history', Array.isArray(history) ? history : []) }

// Weakness data
export function getWeakness() {
  const weakness = store.get('weakness', {})
  if (!weakness || typeof weakness !== 'object' || Array.isArray(weakness)) return {}
return Object.fromEntries(Object.entries(weakness).filter(([, value]) => value && typeof value === 'object').map(([chapter, value]) => [chapter, {
      c: Math.max(0, Number(value.c) || 0),
      w: Math.max(0, Number(value.w) || 0),
      t: Math.max(0, Number(value.t) || 0),
      sub: typeof value.sub === 'string' ? value.sub : 'Mixed',
    }]))
}
export function saveWeakness(weakness) { store.set('weakness', weakness && typeof weakness === 'object' ? weakness : {}) }

// Resume state
export function getResume() {
  const resume = store.get('resume')
  return resume && typeof resume === 'object' && Array.isArray(resume.qs) ? resume : null
}
export function saveResume(resume) { store.set('resume', resume) }
export function clearResume() { store.del('resume') }

// PYQ/practice bookmarks. IDs are kept as strings so generated questions and
// numeric legacy IDs behave consistently.
export function getBookmarks() {
  const ids = store.get('bookmarks', [])
  return Array.isArray(ids) ? ids.map(String) : []
}
export function saveBookmarks(ids) { store.set('bookmarks', [...new Set((ids || []).map(String))]) }
export function toggleBookmark(id) {
  const key = String(id)
  const next = new Set(getBookmarks())
  if (next.has(key)) next.delete(key)
  else next.add(key)
  saveBookmarks([...next])
  return [...next]
}

// Update weakness after mock/practice. The merge is tolerant of legacy records
// and always returns the exact object written to storage.
export function updateWeakness(chapterMap) {
  const weakness = getWeakness()
  if (!chapterMap || typeof chapterMap !== 'object') return weakness
  Object.entries(chapterMap).forEach(([chapter, raw]) => {
    if (!raw || typeof raw !== 'object') return
    const current = weakness[chapter] || { c: 0, w: 0, t: 0, sub: raw.sub || 'Mixed' }
    const c = Math.max(0, Number(raw.c) || 0)
    const w = Math.max(0, Number(raw.w) || 0)
    const t = Math.max(0, Number(raw.t) || c + w)
    weakness[chapter] = {
      c: current.c + c,
      w: current.w + w,
      t: current.t + t,
      sub: current.sub || raw.sub || 'Mixed',
    }
  })
  saveWeakness(weakness)
  return weakness
}

export function clearAllLocalData() {
  ;['user', 'history', 'weakness', 'resume', 'bookmarks'].forEach(key => store.del(key))
}
