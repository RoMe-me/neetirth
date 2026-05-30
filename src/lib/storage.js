// All data stored in localStorage.
// Supabase kicks in automatically when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set (Phase 2).

const PREFIX = 'neetirth_';

export const store = {
  get(key) {
    try { const v = localStorage.getItem(PREFIX + key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  },
  set(key, val) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); }
    catch(e) { console.warn('Storage full:', e); }
  },
  del(key) { try { localStorage.removeItem(PREFIX + key); } catch {} },
};

// User identity
export function getUser() { return store.get('user'); }
export function setUser(u) { store.set('user', u); }

// Mock history
export function getHistory() { return store.get('history') || []; }
export function saveHistory(h) { store.set('history', h); }

// Weakness data
export function getWeakness() { return store.get('weakness') || {}; }
export function saveWeakness(w) { store.set('weakness', w); }

// Resume state
export function getResume() { return store.get('resume'); }
export function saveResume(r) { store.set('resume', r); }
export function clearResume() { store.del('resume'); }

// Update weakness after mock
export function updateWeakness(chapterMap) {
  const w = getWeakness();
  Object.entries(chapterMap).forEach(([ch, d]) => {
    if (!w[ch]) w[ch] = { c: 0, w: 0, t: 0, sub: d.sub };
    w[ch].c += d.c; w[ch].w += d.w; w[ch].t += d.t;
  });
  saveWeakness(w);
  return w;
}
