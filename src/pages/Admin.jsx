// ─────────────────────────────────────────────────────────────────────────────
// Admin Dashboard — authenticated content management for Neetirth.
//
// Features:
//   • Login gate — requires Supabase auth + admin_users membership
//   • Site content editor (hero text, footer, maintenance mode)
//   • Announcements CRUD
//   • Content audit stats
//   • Audit log viewer
//
// Security:
//   • RLS prevents unauthenticated reads/writes at the database level
//   • Server-side verification via /api/admin-auth before any mutations
//   • No secrets are ever embedded in this component
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { isAdmin, signIn, signOut, getSession } from '../lib/adminAuth.js'
import { getContentStats, DATA_QUALITY_NOTE } from '../lib/contentAudit.js'

// ── Styles (inline, scoped) ────────────────────────────────────────────────
const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 24px', maxWidth: 960, margin: '0 auto', fontFamily: 'var(--font)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 24, fontWeight: 800, color: 'var(--orange)', letterSpacing: 1 },
  subtitle: { fontSize: 11, color: 'var(--dim)', letterSpacing: 3, marginTop: 2 },
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  input: { width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', outline: 'none' },
  textarea: { width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', outline: 'none', minHeight: 80, resize: 'vertical' },
  btn: { background: 'var(--orange)18', border: '1px solid var(--orange)55', color: 'var(--orange)', borderRadius: 8, padding: '9px 20px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' },
  btnDanger: { background: '#ff4d4d18', border: '1px solid #ff4d4d55', color: '#ff4d4d', borderRadius: 8, padding: '9px 20px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' },
  btnSmall: { background: 'var(--orange)18', border: '1px solid var(--orange)55', color: 'var(--orange)', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' },
  label: { fontSize: 11, color: 'var(--muted)', marginBottom: 6, display: 'block', letterSpacing: 1, textTransform: 'uppercase' },
  row: { display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  field: { flex: 1, minWidth: 200 },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, letterSpacing: 1 },
  badgeGreen: { background: '#00E5AA18', color: 'var(--green)', border: '1px solid #00E5AA30' },
  badgeRed: { background: '#ff4d4d18', color: '#ff4d4d', border: '1px solid #ff4d4d30' },
  badgeOrange: { background: '#FF6B0018', color: 'var(--orange)', border: '1px solid #FF6B0030' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  td: { padding: '8px 12px', borderBottom: '1px solid var(--border)' },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' },
  tab: { padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid transparent', background: 'none', color: 'var(--muted)', fontFamily: 'var(--font)' },
  tabActive: { background: 'var(--orange)15', color: 'var(--orange)', border: '1px solid var(--orange)30', fontWeight: 600 },
  error: { background: '#ff4d4d12', border: '1px solid #ff4d4d30', borderRadius: 8, padding: '12px 16px', color: '#ff6b6b', fontSize: 12, marginBottom: 16 },
  success: { background: '#00E5AA12', border: '1px solid #00E5AA30', borderRadius: 8, padding: '12px 16px', color: 'var(--green)', fontSize: 12, marginBottom: 16 },
  stat: { textAlign: 'center', flex: 1, minWidth: 120, padding: '16px 12px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' },
  statValue: { fontSize: 28, fontWeight: 800, color: 'var(--orange)' },
  statLabel: { fontSize: 10, color: 'var(--muted)', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' },
  loginBox: { maxWidth: 400, margin: '80px auto', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 40, textAlign: 'center' },
}

// ── Login form ─────────────────────────────────────────────────────────────
function LoginForm({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isSupabaseConfigured()) {
    return (
      <div style={s.loginBox}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--orange)', marginBottom: 8 }}>Admin Access</div>
        <div style={s.error}>
          Supabase is not configured. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment.
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      // Verify admin status after sign-in
      const admin = await isAdmin()
      if (!admin) {
        await signOut()
        setError('Your account is not authorized for admin access.')
      } else {
        onSuccess()
      }
    } catch (err) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.loginBox}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--orange)', marginBottom: 4 }}>Admin Access</div>
      <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 24 }}>Sign in to manage Neetirth content</div>

      {error && <div style={s.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14, textAlign: 'left' }}>
          <label style={s.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@example.com"
            style={s.input}
            required
            autoComplete="email"
          />
        </div>
        <div style={{ marginBottom: 20, textAlign: 'left' }}>
          <label style={s.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={s.input}
            required
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ ...s.btn, width: '100%', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 20 }}>
        Admin access is restricted to authorized users only.<br/>
        Contact the project owner to request access.
      </div>
    </div>
  )
}

// ── Content Editor tab ─────────────────────────────────────────────────────
function ContentEditor() {
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const loadContent = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('site_content').select('key, value')
    if (!error && data) {
      const map = {}
      data.forEach(row => { map[row.key] = row.value })
      setContent(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadContent() }, [loadContent])

  const saveField = async (key, value) => {
    setSaving(true)
    setMessage(null)
    try {
      const { error } = await supabase
        .from('site_content')
        .upsert({ key, value, updated_by: (await getSession())?.user?.id || null })
      if (error) throw error
      setContent(prev => ({ ...prev, [key]: value }))
      setMessage({ type: 'success', text: `"${key}" saved.` })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ color: 'var(--muted)', padding: 20 }}>Loading content…</div>

  const fields = [
    { key: 'hero_title', label: 'Hero Title', type: 'text' },
    { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'footer_text', label: 'Footer Text', type: 'text' },
    { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'toggle' },
  ]

  return (
    <div>
      {message && (
        <div style={message.type === 'success' ? s.success : s.error}>
          {message.text}
        </div>
      )}

      {fields.map(field => {
        const raw = content[field.key]
        const displayValue = typeof raw === 'string' ? raw : (raw != null ? JSON.stringify(raw) : '')

        return (
          <div key={field.key} style={{ ...s.card }}>
            <div style={s.cardTitle}>
              <span>{field.label}</span>
              <span style={{ fontSize: 10, color: 'var(--dim)' }}>key: {field.key}</span>
            </div>

            {field.type === 'toggle' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: displayValue === 'true' ? '#ff4d4d' : 'var(--green)' }}>
                  {displayValue === 'true' ? '🔴 Maintenance ON' : '🟢 Live'}
                </span>
                <button
                  onClick={() => saveField(field.key, displayValue === 'true' ? 'false' : 'true')}
                  style={s.btnSmall}
                  disabled={saving}
                >
                  Toggle
                </button>
              </div>
            ) : field.type === 'textarea' ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <textarea
                  value={displayValue}
                  onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                  style={{ ...s.textarea, flex: 1 }}
                />
                <button onClick={() => saveField(field.key, displayValue)} style={s.btnSmall} disabled={saving}>
                  Save
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={displayValue}
                  onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                  style={{ ...s.input, flex: 1 }}
                />
                <button onClick={() => saveField(field.key, displayValue)} style={s.btnSmall} disabled={saving}>
                  Save
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Announcements tab ──────────────────────────────────────────────────────
function AnnouncementsManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', body: '', active: true, priority: 0 })
  const [message, setMessage] = useState(null)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setMessage(null)
    try {
      const userId = (await getSession())?.user?.id || null
      if (editing) {
        const { error } = await supabase
          .from('announcements')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', editing)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert({ ...form, created_by: userId })
        if (error) throw error
      }
      setMessage({ type: 'success', text: editing ? 'Announcement updated.' : 'Announcement created.' })
      setForm({ title: '', body: '', active: true, priority: 0 })
      setEditing(null)
      load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this announcement?')) return
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
      load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  const startEdit = (item) => {
    setEditing(item.id)
    setForm({ title: item.title, body: item.body, active: item.active, priority: item.priority })
  }

  if (loading) return <div style={{ color: 'var(--muted)', padding: 20 }}>Loading…</div>

  return (
    <div>
      {message && <div style={message.type === 'success' ? s.success : s.error}>{message.text}</div>}

      <div style={s.card}>
        <div style={s.cardTitle}>{editing ? '✏️ Edit Announcement' : '➕ New Announcement'}</div>
        <div style={s.row}>
          <div style={s.field}>
            <label style={s.label}>Title</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={s.input}
              placeholder="Announcement title"
            />
          </div>
          <div style={{ minWidth: 80 }}>
            <label style={s.label}>Priority</label>
            <input
              type="number"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
              style={{ ...s.input, width: 80 }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Body</label>
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            style={s.textarea}
            placeholder="Announcement details…"
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
            />
            Active
          </label>
          <div style={{ flex: 1 }} />
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ title: '', body: '', active: true, priority: 0 }) }} style={s.btnDanger}>
              Cancel
            </button>
          )}
          <button onClick={save} style={s.btn} disabled={!form.title.trim()}>
            {editing ? 'Update' : 'Create'}
          </button>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>📢 All Announcements ({items.length})</div>
        {items.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>No announcements yet.</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Title</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Priority</th>
                <th style={s.th}>Created</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={s.td}>
                    <div style={{ fontWeight: 600 }}>{item.title}</div>
                    {item.body && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{item.body.slice(0, 60)}{item.body.length > 60 ? '…' : ''}</div>}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, ...(item.active ? s.badgeGreen : s.badgeRed) }}>
                      {item.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={s.td}>{item.priority}</td>
                  <td style={{ ...s.td, fontSize: 11, color: 'var(--muted)' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => startEdit(item)} style={s.btnSmall}>Edit</button>
                      <button onClick={() => remove(item.id)} style={{ ...s.btnSmall, ...s.btnDanger, padding: '5px 10px' }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Content Audit tab ──────────────────────────────────────────────────────
function ContentAuditTab() {
  const stats = getContentStats()

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={s.stat}>
          <div style={s.statValue}>{stats.pyq}</div>
          <div style={s.statLabel}>PYQ Items</div>
        </div>
        <div style={s.stat}>
          <div style={s.statValue}>{stats.practice}</div>
          <div style={s.statLabel}>Practice Items</div>
        </div>
        <div style={s.stat}>
          <div style={s.statValue}>{stats.chapters}</div>
          <div style={s.statLabel}>Chapters</div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>📊 Subject Breakdown</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Subject</th>
              <th style={s.th}>PYQ</th>
              <th style={s.th}>Practice</th>
              <th style={s.th}>Chapters</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.bySubject).map(([subject, data]) => (
              <tr key={subject}>
                <td style={{ ...s.td, fontWeight: 600 }}>{subject}</td>
                <td style={s.td}>{data.pyq}</td>
                <td style={s.td}>{data.practice}</td>
                <td style={s.td}>{data.chapters}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {[stats.pyqAudit, stats.practiceAudit].map(audit => (
        <div key={audit.name} style={s.card}>
          <div style={s.cardTitle}>
            🔍 {audit.name}
            <span style={{ ...s.badge, ...(audit.invalid.length === 0 && audit.duplicateIds.length === 0 ? s.badgeGreen : s.badgeRed) }}>
              {audit.valid}/{audit.total} valid
            </span>
          </div>
          {audit.invalid.length > 0 && (
            <div style={{ fontSize: 12, color: '#ff6b6b', marginBottom: 8 }}>
              ⚠️ {audit.invalid.length} invalid records: {audit.invalid.slice(0, 5).join(', ')}{audit.invalid.length > 5 ? ` +${audit.invalid.length - 5} more` : ''}
            </div>
          )}
          {audit.duplicateIds.length > 0 && (
            <div style={{ fontSize: 12, color: '#ff6b6b', marginBottom: 8 }}>
              ⚠️ {audit.duplicateIds.length} duplicate IDs: {audit.duplicateIds.slice(0, 5).join(', ')}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Difficulty: Easy {audit.difficulty.easy} · Medium {audit.difficulty.medium} · Hard {audit.difficulty.hard}
            {audit.difficulty.unknown > 0 && <span style={{ color: 'var(--orange)' }}> · Unknown {audit.difficulty.unknown}</span>}
          </div>
        </div>
      ))}

      <div style={s.card}>
        <div style={s.cardTitle}>ℹ️ {DATA_QUALITY_NOTE.title}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
          {DATA_QUALITY_NOTE.body}
        </div>
        <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 8 }}>
          ✅ {DATA_QUALITY_NOTE.checked}
        </div>
      </div>
    </div>
  )
}

// ── Audit Log tab ──────────────────────────────────────────────────────────
function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error) setLogs(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div style={{ color: 'var(--muted)', padding: 20 }}>Loading…</div>

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>📋 Recent Admin Actions (last 50)</div>
      {logs.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>No admin actions recorded yet.</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Time</th>
              <th style={s.th}>Action</th>
              <th style={s.th}>Target</th>
              <th style={s.th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{ ...s.td, fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td style={{ ...s.td, fontWeight: 600 }}>{log.action}</td>
                <td style={s.td}>{log.target || '—'}</td>
                <td style={{ ...s.td, fontSize: 11, color: 'var(--muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {JSON.stringify(log.details || {})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'content', icon: '✏️', label: 'Site Content' },
  { id: 'announcements', icon: '📢', label: 'Announcements' },
  { id: 'audit', icon: '🔍', label: 'Content Audit' },
  { id: 'log', icon: '📋', label: 'Audit Log' },
]

function Dashboard({ userEmail, onLogout }) {
  const [tab, setTab] = useState('content')

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.title}>🏛 Neetirth Admin</div>
          <div style={s.subtitle}>CONTENT MANAGEMENT</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{userEmail}</span>
          <span style={{ ...s.badge, ...s.badgeGreen }}>ADMIN</span>
          <a href="/" style={{ ...s.btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            ← Site
          </a>
          <button onClick={onLogout} style={s.btnDanger}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'content' && <ContentEditor />}
      {tab === 'announcements' && <AnnouncementsManager />}
      {tab === 'audit' && <ContentAuditTab />}
      {tab === 'log' && <AuditLog />}
    </div>
  )
}

// ── Admin page root ────────────────────────────────────────────────────────
export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const admin = await isAdmin()
      if (admin) {
        const session = await getSession()
        setUserEmail(session?.user?.email || '')
        setAuthenticated(true)
      }
    } catch {
      // Not authenticated
    } finally {
      setChecking(false)
    }
  }

  async function handleLogout() {
    try {
      await signOut()
    } catch {
      // Ignore
    }
    setAuthenticated(false)
    setUserEmail('')
  }

  if (checking) {
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)' }}>Verifying access…</div>
      </div>
    )
  }

  if (!authenticated) {
    return <LoginForm onSuccess={checkAuth} />
  }

  return <Dashboard userEmail={userEmail} onLogout={handleLogout} />
}
