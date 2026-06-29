import { LiquidBadge } from './LiquidBlock.jsx'
import { useState } from 'react'

const NAV = [
  { id:'home',     icon:'⬡', label:'Dashboard'  },
  { id:'mock',     icon:'◎', label:'Mock Tests'  },
  { id:'progress', icon:'◈', label:'Progress'    },
  { id:'pyq',      icon:'◫', label:'PYQ Bank'    },
  { id:'practice', icon:'✦', label:'Practice'     },
  { id:'ask',      icon:'AI', label:'Ask AI'       },
]

const COURSES = [
  { id:'neet',    icon:'🧬', label:'NEET UG',       active:true  },
  { id:'jee',     icon:'⚡', label:'JEE Main',       soon:true    },
  { id:'jeeadv',  icon:'🔬', label:'JEE Advanced',  soon:true    },
  { id:'upsc',    icon:'🏛', label:'UPSC CSE',       soon:true    },
  { id:'cuet',    icon:'📝', label:'CUET UG',        soon:true    },
  { id:'boards',  icon:'📚', label:'Class 12 Boards',soon:true    },
]

export default function Layout({ page, onNav, user, children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="app-shell" style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      <div className="liquid-aurora" aria-hidden="true">
        <span className="liquid-orb one" />
        <span className="liquid-orb two" />
        <span className="liquid-orb three" />
        <span className="liquid-grain" />
      </div>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar" style={{
        width: collapsed ? 64 : 230,
        minHeight:'100vh',
        display:'flex', flexDirection:'column',
        transition:'width 0.42s var(--spring)', flexShrink:0,
        position:'sticky', top:0, height:'100vh', overflow:'hidden', zIndex:2,
      }}>

        {/* Logo */}
        <div style={{ padding: collapsed?'22px 0':'22px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:collapsed?'center':'space-between' }}>
          {!collapsed && (
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--orange)', letterSpacing:1 }}>नीतीर्थ</div>
              <div style={{ fontSize:8, color:'var(--dim)', letterSpacing:4, marginTop:1 }}>NEETIRTH</div>
            </div>
          )}
          <button onClick={()=>setCollapsed(c=>!c)} style={{ background:'none', border:'none', color:'var(--dim)', fontSize:18, padding:'2px 4px', lineHeight:1, cursor:'pointer', flexShrink:0 }}>
            {collapsed?'›':'‹'}
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>

          {/* Main nav */}
          <nav style={{ padding:'10px 8px' }}>
            {!collapsed && <div style={{ fontSize:9, color:'var(--dim)', letterSpacing:2, padding:'6px 8px 4px', textTransform:'uppercase' }}>Menu</div>}
            {NAV.map(n => {
              const active = page===n.id || (page==='mockSetup'&&n.id==='mock') || (page==='results'&&n.id==='mock') || (page==='practice'&&n.id==='practice') || (page==='ask'&&n.id==='ask')
              return (
                <button key={n.id} onClick={()=>onNav(n.id)} className={`nav-pill ${active ? 'active' : ''}`} style={{
                  width:'100%', display:'flex', alignItems:'center',
                  gap:10, padding:collapsed?'10px 0':'9px 12px',
                  justifyContent:collapsed?'center':'flex-start',
                  background:active?'#FF6B0012':'none',
                  border:`1px solid ${active?'#FF6B0030':'transparent'}`,
                  borderRadius:8, marginBottom:2,
                  color:active?'var(--orange)':'var(--muted)',
                  fontSize:13, fontWeight:active?600:400,
                  transition:'all 0.28s var(--spring)', whiteSpace:'nowrap',
                }}
                onMouseEnter={e=>{if(!active){e.currentTarget.style.color='var(--text)';e.currentTarget.style.background='#ffffff06'}}}
                onMouseLeave={e=>{if(!active){e.currentTarget.style.color='var(--muted)';e.currentTarget.style.background='none'}}}
                >
                  <span style={{ fontSize:15, flexShrink:0 }}>{n.icon}</span>
                  {!collapsed && <span>{n.label}</span>}
                </button>
              )
            })}
          </nav>

          {/* Divider */}
          <div style={{ height:'1px', background:'var(--border)', margin:'4px 12px' }}/>

          {/* Courses */}
          <div style={{ padding:'10px 8px' }}>
            {!collapsed && <div style={{ fontSize:9, color:'var(--dim)', letterSpacing:2, padding:'6px 8px 4px', textTransform:'uppercase' }}>Courses</div>}
            {COURSES.map(c => (
              <div key={c.id} title={c.soon?`${c.label} — Coming Soon`:''}
                className={`nav-pill ${c.active ? 'active' : ''}`}
                style={{
                  display:'flex', alignItems:'center',
                  gap:10, padding:collapsed?'9px 0':'8px 12px',
                  justifyContent:collapsed?'center':'flex-start',
                  borderRadius:8, marginBottom:2,
                  color:c.active?'var(--orange)':c.soon?'var(--dim)':'var(--muted)',
                  background:c.active?'#FF6B0010':'none',
                  border:`1px solid ${c.active?'#FF6B0025':'transparent'}`,
                  cursor:c.soon?'not-allowed':'pointer',
                  fontSize:13, fontWeight:c.active?600:400,
                  position:'relative',
                  transition:'all 0.28s var(--spring)',
                }}
              >
                <span style={{ fontSize:14, flexShrink:0, opacity:c.soon?0.5:1 }}>{c.icon}</span>
                {!collapsed && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flex:1, minWidth:0 }}>
                    <span style={{ opacity:c.soon?0.45:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.label}</span>
                    {c.soon && (
                      <LiquidBadge style={{ marginLeft:6 }}>SOON</LiquidBadge>
                    )}
                    {c.active && (
                      <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', flexShrink:0, marginLeft:6 }}/>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User card */}
        <div className="glass" style={{ margin:collapsed?'10px 8px':'12px', padding:collapsed?'14px 0':'14px 16px', borderTop:'1px solid var(--border)', textAlign:collapsed?'center':'left', borderRadius:16 }}>
          {collapsed
            ? <div style={{ fontSize:16, color:'var(--orange)' }}>◉</div>
            : <>
                <div style={{ fontSize:10, color:'var(--dim)', marginBottom:4, letterSpacing:1 }}>SIGNED IN</div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize:10, color:'var(--dim)', marginTop:2 }}>Free forever ✦</div>
              </>
          }
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-stage" style={{ flex:1, overflowY:'auto', minWidth:0 }}>
        {children}
      </main>
    </div>
  )
}
