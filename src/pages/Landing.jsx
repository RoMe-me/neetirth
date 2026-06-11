import { useState } from 'react'
import { setUser } from '../lib/storage.js'

export default function Landing({ onEnter }) {
  const [name, setName] = useState('')
  const [err, setErr] = useState('')

  const enter = () => {
    const clean = name.trim()
    if (clean.length < 2) return setErr('Name must be at least 2 characters.')
    if (clean.length > 30) return setErr('Keep it under 30 characters.')
    if (!/^[a-zA-Z0-9_ ]+$/.test(clean)) return setErr('Letters, numbers, spaces and underscores only.')
    const u = { name:clean, joinedAt:new Date().toISOString() }
    setUser(u); onEnter(u)
  }

  return (
    <div className="app-shell" style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', position:'relative', overflow:'hidden' }}>
      <style>{`input::placeholder{color:var(--dim)} button:hover{filter:brightness(1.08)}`}</style>
      <div className="liquid-aurora" aria-hidden="true">
        <span className="liquid-orb one" />
        <span className="liquid-orb two" />
        <span className="liquid-orb three" />
        <span className="liquid-grain" />
      </div>

      {/* Left panel - branding */}
      <div className="glass" style={{ width:'45%', background:'rgba(18,18,22,0.58)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'48px', position:'sticky', top:0, height:'100vh', borderRadius:0, zIndex:1 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--orange)', letterSpacing:1 }}>नीतीर्थ</div>
          <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:4, marginTop:2 }}>NEETIRTH</div>
        </div>
        <div>
          <div style={{ fontSize:38, fontWeight:800, lineHeight:1.2, marginBottom:16 }}>
            Your NEET<br/>
            <span style={{ color:'var(--orange)' }}>pilgrimage</span><br/>
            begins here.
          </div>
          <div style={{ fontSize:14, color:'var(--muted)', lineHeight:1.8, marginBottom:32 }}>
            Real PYQs from 2006 to 2026.<br/>
            Free. No login. No payment. Ever.
          </div>
          <div style={{ fontSize:12, fontStyle:'italic', color:'var(--dim)', borderLeft:'2px solid var(--orange)', paddingLeft:12 }}>
            "उद्यमेन हि सिध्यन्ति कार्याणि"<br/>
            <span style={{ fontStyle:'normal', color:'var(--dim)', fontSize:11 }}>Success comes to those who strive.</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:24 }}>
          {[['261+','Real PYQs'],['86','Chapters'],['720','Max Marks']].map(([n,l])=>(
            <div key={l}>
              <div style={{ fontSize:20, fontWeight:800, color:'var(--orange)', fontFamily:'var(--mono)' }}>{n}</div>
              <div style={{ fontSize:10, color:'var(--dim)', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - entry */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'48px', position:'relative', zIndex:1 }}>
        <div className="glass glass-card page-in" style={{ width:'100%', maxWidth:430, padding:32, borderRadius:28 }}>
          <div style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Enter your name</div>
          <div style={{ fontSize:13, color:'var(--muted)', marginBottom:28, lineHeight:1.7 }}>
            No email. No password. Just your name — your progress is saved to your device.
          </div>
          <input
            value={name}
            onChange={e=>{ setName(e.target.value); setErr('') }}
            onKeyDown={e=>e.key==='Enter'&&enter()}
            placeholder="e.g. Aryan_Dropper27"
            maxLength={30}
            autoFocus
            style={{ width:'100%', background:'rgba(255,255,255,0.075)', border:'1px solid var(--border)', borderRadius:16, padding:'15px 16px', fontSize:15, color:'var(--text)', outline:'none', marginBottom: err?8:20, fontFamily:'var(--font)', transition:'border-color 0.15s' }}
            onFocus={e=>e.target.style.borderColor='var(--orange)'}
            onBlur={e=>e.target.style.borderColor='var(--border)'}
          />
          {err && <div style={{ fontSize:12, color:'var(--pink)', marginBottom:16 }}>⚠ {err}</div>}
          <button onClick={enter} disabled={!name.trim()}
            className={name.trim() ? 'liquid-cta' : ''}
            style={{ width:'100%', padding:'15px', background:name.trim()?'linear-gradient(135deg, var(--orange), #FF9B45)':'var(--border)', border:'1px solid rgba(255,255,255,.12)', borderRadius:16, color:name.trim()?'#fff':'var(--dim)', fontSize:15, fontWeight:800, letterSpacing:0.5, transition:'all 0.28s var(--spring)', cursor:name.trim()?'pointer':'default' }}>
            Begin →
          </button>
          <div style={{ fontSize:11, color:'var(--dim)', marginTop:20, textAlign:'center', lineHeight:1.8 }}>
            🔒 Your data stays on your device only.<br/>No tracking. No ads. Built by a NEET aspirant.
          </div>
        </div>
      </div>
    </div>
  )
}
