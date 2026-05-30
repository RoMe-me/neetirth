import { useState } from 'react'
import { setUser } from '../lib/storage.js'

const T = {
  bg: '#0A0A0F',
  card: { background:'#0F0F1A', border:'1px solid #1E1E30', borderRadius:12, padding:24 },
  orange: '#FF6B00',
  blue: '#4D9FFF',
  pink: '#FF5588',
  text: '#E8E8F0',
  muted: '#606080',
  inp: {
    background:'#0A0A16', border:'1px solid #2A2A40', borderRadius:8,
    color:'#E8E8F0', padding:'12px 16px', fontSize:15, width:'100%',
    boxSizing:'border-box', outline:'none', fontFamily:'inherit'
  }
}

const STATS = [
  { n:'22 Lakh+', l:'Aspirants 2025' },
  { n:'~1.1 Lakh', l:'MBBS Seats India' },
  { n:'Top 50,000', l:'Govt MBBS (AIQ)' },
]

export default function Landing({ onEnter }) {
  const [name, setName] = useState('')
  const [err, setErr] = useState('')

  const enter = () => {
    const clean = name.trim()
    if (clean.length < 2) return setErr('Name must be at least 2 characters.')
    if (clean.length > 30) return setErr('Keep it under 30 characters.')
    if (!/^[a-zA-Z0-9_ ]+$/.test(clean)) return setErr('Only letters, numbers, spaces, underscores.')
    const u = { name: clean, joinedAt: new Date().toISOString() }
    setUser(u)
    onEnter(u)
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:"'Segoe UI',system-ui,sans-serif", display:'flex', flexDirection:'column' }}>
      <style>{`*{box-sizing:border-box} button:hover{filter:brightness(1.15)} input::placeholder{color:#404060} a{color:inherit;text-decoration:none}`}</style>

      {/* NAV */}
      <div style={{ padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #1A1A2A' }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:T.orange, letterSpacing:1 }}>नीतीर्थ</div>
          <div style={{ fontSize:10, color:T.muted, letterSpacing:3, marginTop:1 }}>NEETIRTH</div>
        </div>
        <div style={{ fontSize:12, color:T.muted }}>Free for every aspirant. Always.</div>
      </div>

      {/* HERO */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px', maxWidth:640, margin:'0 auto', width:'100%' }}>

        {/* Sanskrit quote */}
        <div style={{ fontSize:13, color:T.muted, letterSpacing:2, marginBottom:24, textAlign:'center', fontStyle:'italic' }}>
          "उद्यमेन हि सिध्यन्ति कार्याणि" — Success comes to those who strive
        </div>

        {/* Title */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:42, fontWeight:800, lineHeight:1.1, marginBottom:12 }}>
            Your <span style={{ color:T.orange }}>NEET Pilgrimage</span><br/>starts here.
          </div>
          <div style={{ fontSize:16, color:T.muted, lineHeight:1.7 }}>
            Real PYQs. Real difficulty. Free full mocks.<br/>
            Built for the aspirant who won't give up.
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, width:'100%', marginBottom:40 }}>
          {STATS.map(s => (
            <div key={s.l} style={{ ...T.card, textAlign:'center', padding:16 }}>
              <div style={{ fontSize:18, fontWeight:700, color:T.orange }}>{s.n}</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Username entry */}
        <div style={{ ...T.card, width:'100%', borderColor:'#FF6B0030' }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>Enter your name to begin</div>
          <div style={{ fontSize:12, color:T.muted, marginBottom:16 }}>
            No email. No password. Just your name — your progress follows you everywhere.
          </div>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && enter()}
            placeholder="e.g. Aryan_Dropper27"
            style={T.inp}
            maxLength={30}
            autoFocus
          />
          {err && <div style={{ color:'#FF5588', fontSize:12, marginTop:8 }}>⚠ {err}</div>}
          <button
            onClick={enter}
            disabled={!name.trim()}
            style={{
              marginTop:16, width:'100%', padding:'14px 0', borderRadius:8,
              background: name.trim() ? T.orange : '#1A1A2A',
              border:'none', color: name.trim() ? '#fff' : T.muted,
              fontSize:15, fontWeight:700, cursor: name.trim() ? 'pointer' : 'default',
              letterSpacing:1, transition:'background 0.2s'
            }}
          >
            Begin Pilgrimage →
          </button>
        </div>

        {/* Trust line */}
        <div style={{ marginTop:24, fontSize:12, color:T.muted, textAlign:'center', lineHeight:1.8 }}>
          🔒 Your data stays on your device. No servers, no tracking, no ads.<br/>
          Built by a NEET aspirant, for every NEET aspirant.
        </div>
      </div>
    </div>
  )
}
