import { LiquidBadge } from './LiquidBlock.jsx'
import { useEffect, useState } from 'react'

const NAV = [
  { id:'home',     icon:'⬡', label:'Dashboard' },
  { id:'study',    icon:'⌘', label:'Study Hub' },
  { id:'mock',     icon:'◎', label:'Mock Tests' },
  { id:'progress', icon:'◈', label:'Progress' },
  { id:'pyq',      icon:'◫', label:'PYQ Bank' },
  { id:'practice', icon:'✦', label:'Practice' },
  { id:'ask',      icon:'AI', label:'Ask AI' },
]

const COURSES = [
  { id:'neet',    icon:'🧬', label:'NEET UG',       active:true },
  { id:'jee',     icon:'⚡', label:'JEE Main',       soon:true },
  { id:'jeeadv',  icon:'🔬', label:'JEE Advanced',   soon:true },
  { id:'upsc',    icon:'🏛', label:'UPSC CSE',       soon:true },
  { id:'cuet',    icon:'📝', label:'CUET UG',        soon:true },
  { id:'boards',  icon:'📚', label:'Class 12 Boards', soon:true },
]

function isActive(page, id) {
  return page === id ||
    (page === 'mockSetup' && id === 'mock') ||
    (page === 'results' && id === 'mock')
}

export default function Layout({ page, onNav, user, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <div className="app-shell" style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      <div className="liquid-aurora" aria-hidden="true">
        <span className="liquid-orb one" />
        <span className="liquid-orb two" />
        <span className="liquid-orb three" />
        <span className="liquid-grain" />
      </div>

      <aside className="sidebar" style={{
        width: collapsed ? 64 : 230,
        minHeight:'100vh',
        display:'flex', flexDirection:'column',
        transition:'width 0.42s var(--spring)', flexShrink:0,
        position:'sticky', top:0, height:'100vh', overflow:'hidden', zIndex:2,
      }}>
        <div style={{ padding:collapsed?'22px 0':'22px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:collapsed?'center':'space-between' }}>
          {!collapsed && (
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--orange)', letterSpacing:1 }}>नीतीर्थ</div>
              <div style={{ fontSize:8, color:'var(--dim)', letterSpacing:4, marginTop:1 }}>NEETIRTH</div>
            </div>
          )}
          <button aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(value => !value)} style={{ background:'none', border:'none', color:'var(--dim)', fontSize:18, padding:'2px 4px', lineHeight:1, cursor:'pointer', flexShrink:0 }}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          <nav style={{ padding:'10px 8px' }} aria-label="Main navigation">
            {!collapsed && <div style={{ fontSize:9, color:'var(--dim)', letterSpacing:2, padding:'6px 8px 4px', textTransform:'uppercase' }}>Workspace</div>}
            {NAV.map(item => {
              const active = isActive(page, item.id)
              return (
                <button key={item.id} onClick={() => onNav(item.id)} className={`nav-pill ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined} style={{
                  width:'100%', display:'flex', alignItems:'center', gap:10,
                  padding:collapsed?'10px 0':'9px 12px', justifyContent:collapsed?'center':'flex-start',
                  background:active?'#FF6B0012':'none', border:`1px solid ${active?'#FF6B0030':'transparent'}`,
                  borderRadius:8, marginBottom:2, color:active?'var(--orange)':'var(--muted)',
                  fontSize:13, fontWeight:active?600:400, transition:'all 0.28s var(--spring)', whiteSpace:'nowrap',
                }}>
                  <span style={{ fontSize:15, flexShrink:0 }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </nav>

          <div style={{ height:'1px', background:'var(--border)', margin:'4px 12px' }} />

          <div className="course-list" style={{ padding:'10px 8px' }}>
            {!collapsed && <div style={{ fontSize:9, color:'var(--dim)', letterSpacing:2, padding:'6px 8px 4px', textTransform:'uppercase' }}>Courses</div>}
            {COURSES.map(course => (
              <div key={course.id} title={course.soon ? `${course.label} — Coming soon` : 'Current course'} className={`nav-pill ${course.active ? 'active' : ''}`} style={{
                display:'flex', alignItems:'center', gap:10, padding:collapsed?'9px 0':'8px 12px',
                justifyContent:collapsed?'center':'flex-start', borderRadius:8, marginBottom:2,
                color:course.active?'var(--orange)':course.soon?'var(--dim)':'var(--muted)',
                background:course.active?'#FF6B0010':'none', border:`1px solid ${course.active?'#FF6B0025':'transparent'}`,
                cursor:course.soon?'not-allowed':'default', fontSize:13, fontWeight:course.active?600:400, position:'relative', transition:'all 0.28s var(--spring)',
              }}>
                <span style={{ fontSize:14, flexShrink:0, opacity:course.soon?0.5:1 }}>{course.icon}</span>
                {!collapsed && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flex:1, minWidth:0 }}>
                    <span style={{ opacity:course.soon?0.45:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{course.label}</span>
                    {course.soon && <LiquidBadge style={{ marginLeft:6 }}>SOON</LiquidBadge>}
                    {course.active && <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', flexShrink:0, marginLeft:6 }} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass" style={{ margin:collapsed?'10px 8px':'12px', padding:collapsed?'14px 0':'14px 16px', borderTop:'1px solid var(--border)', textAlign:collapsed?'center':'left', borderRadius:16 }}>
          {collapsed
            ? <div style={{ fontSize:16, color:'var(--orange)' }}>◉</div>
            : <>
                <div style={{ fontSize:10, color:'var(--dim)', marginBottom:4, letterSpacing:1 }}>SIGNED IN</div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name || 'Student'}</div>
                <div style={{ fontSize:10, color:'var(--dim)', marginTop:2 }}>Free forever · data stays local</div>
              </>
          }
        </div>
      </aside>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {NAV.map(item => {
          const active = isActive(page, item.id)
          return <button key={item.id} onClick={() => onNav(item.id)} aria-label={item.label} aria-current={active ? 'page' : undefined} className={active ? 'active' : ''}><span>{item.icon}</span><small>{item.label === 'Dashboard' ? 'Home' : item.label.split(' ')[0]}</small></button>
        })}
      </nav>

      <main className="main-stage" style={{ flex:1, overflowY:'auto', minWidth:0 }}>
        <div className="workspace-status" role="status">
          <span><b>NEET UG</b> · offline-first study space</span>
          <span className={online ? 'status-online' : 'status-offline'}><i />{online ? 'Online' : 'Offline'} · progress saved on this device</span>
        </div>
        {children}
      </main>
    </div>
  )
}
