import { useState } from 'react'

const NAV = [
  { id:'home',     icon:'⬡',  label:'Dashboard'  },
  { id:'mock',     icon:'◎',  label:'Mock Tests'  },
  { id:'progress', icon:'◈',  label:'Progress'    },
  { id:'pyq',      icon:'◫',  label:'PYQ Bank'    },
]

export default function Layout({ page, onNav, user, children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 64 : 220, minHeight:'100vh',
        background:'var(--surface)', borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column',
        transition:'width 0.2s ease', flexShrink:0,
        position:'sticky', top:0, height:'100vh', overflow:'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? '22px 0' : '22px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && (
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--orange)', letterSpacing:1 }}>नीतीर्थ</div>
              <div style={{ fontSize:8, color:'var(--dim)', letterSpacing:4, marginTop:1 }}>NEETIRTH</div>
            </div>
          )}
          <button onClick={() => setCollapsed(c=>!c)} style={{ background:'none', border:'none', color:'var(--dim)', fontSize:18, padding:'2px 4px', lineHeight:1, cursor:'pointer' }}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ padding:'10px 8px', flex:1 }}>
          {NAV.map(n => {
            const active = page === n.id || (page==='mockSetup'&&n.id==='mock') || (page==='results'&&n.id==='mock')
            return (
              <button key={n.id} onClick={() => onNav(n.id)} style={{
                width:'100%', display:'flex', alignItems:'center',
                gap:10, padding: collapsed ? '11px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? '#FF6B0012' : 'none',
                border: `1px solid ${active ? '#FF6B0030' : 'transparent'}`,
                borderRadius:8, marginBottom:2,
                color: active ? 'var(--orange)' : 'var(--muted)',
                fontSize:13, fontWeight: active ? 600 : 400,
                transition:'all 0.15s',
              }}
              onMouseEnter={e=>{ if(!active) e.currentTarget.style.color='var(--text)'; e.currentTarget.style.background='#ffffff06' }}
              onMouseLeave={e=>{ if(!active) e.currentTarget.style.color='var(--muted)'; if(!active) e.currentTarget.style.background='none' }}
              >
                <span style={{ fontSize:16, flexShrink:0 }}>{n.icon}</span>
                {!collapsed && <span>{n.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding: collapsed ? '16px 0' : '16px 20px', borderTop:'1px solid var(--border)', textAlign: collapsed ? 'center' : 'left' }}>
          {collapsed
            ? <div style={{ fontSize:16, color:'var(--orange)' }}>◉</div>
            : <>
                <div style={{ fontSize:10, color:'var(--dim)', marginBottom:4, letterSpacing:1 }}>LOGGED IN AS</div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize:10, color:'var(--dim)', marginTop:2 }}>Free forever ✦</div>
              </>
          }
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, overflowY:'auto', minWidth:0 }}>
        {children}
      </main>
    </div>
  )
}
