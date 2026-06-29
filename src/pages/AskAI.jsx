import { useMemo, useState } from 'react'
import LiquidBlock from '../components/LiquidBlock.jsx'

const EXAMPLES = [
  'Explain meiosis I vs meiosis II for NEET.',
  'Solve: a body starts from rest with acceleration 2 m/s² for 5 s.',
  'Why is phenol more acidic than alcohol?',
]

export default function AskAI() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const canAsk = question.trim().length > 0 && !loading
  const remaining = useMemo(() => 2500 - question.length, [question.length])

  const ask = async (text = question) => {
    const clean = text.trim()
    if (!clean || loading) return
    setErr('')
    setLoading(true)
    setQuestion('')
    setMessages(prev => [...prev, { role:'student', text:clean }])
    try {
      const res = await fetch('/api/ask', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ question:clean })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'AI could not answer right now. Please retry.')
      setMessages(prev => [...prev, { role:'ai', text:data.answer }])
    } catch (e) {
      const message = e?.message || 'AI could not answer right now. Please retry.'
      setErr(message)
      setMessages(prev => [...prev, { role:'ai', text:`I could not answer that yet: ${message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-in" style={{ padding:'32px 36px', maxWidth:860, margin:'0 auto' }}>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:24, fontWeight:800, color:'var(--text)', marginBottom:6 }}>Ask Neetirth AI</div>
        <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>
          Ask any NEET doubt anytime. Answers are NCERT-first, step-by-step, and honest when something needs verification.
        </div>
      </div>

      <LiquidBlock fillColor="rgba(100,174,255,0.14)" fillHeight={24} style={{ padding:'18px 20px', marginBottom:18 }}>
        <div style={{ display:'grid', gap:8 }}>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value.slice(0, 2500))}
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') ask() }}
            placeholder="Type any Physics, Chemistry, or Biology doubt…"
            rows={4}
            style={{ width:'100%', resize:'vertical', minHeight:96, background:'rgba(255,255,255,0.055)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text)', padding:'13px 14px', outline:'none', fontFamily:'var(--font)', fontSize:14, lineHeight:1.65, boxSizing:'border-box' }}
          />
          <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'space-between', flexWrap:'wrap' }}>
            <span style={{ fontSize:11, color:remaining < 150 ? 'var(--gold)' : 'var(--dim)' }}>{remaining} characters left · Ctrl/⌘ + Enter to ask</span>
            <button onClick={() => ask()} disabled={!canAsk}
              className="liquid-cta"
              style={{ border:'none', borderRadius:10, padding:'10px 18px', background:canAsk?'var(--orange)':'var(--border)', color:canAsk?'#fff':'var(--dim)', fontWeight:700, cursor:canAsk?'pointer':'default', opacity:canAsk?1:.65 }}>
              {loading ? 'Thinking…' : 'Ask AI →'}
            </button>
          </div>
        </div>
      </LiquidBlock>

      {err && (
        <div style={{ background:'rgba(255,77,141,0.08)', border:'1px solid rgba(255,77,141,0.28)', color:'var(--pink)', borderRadius:10, padding:'11px 14px', fontSize:12, marginBottom:16 }}>
          ⚠ {err}
        </div>
      )}

      {messages.length === 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:10, marginBottom:16 }}>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => ask(ex)} disabled={loading}
              style={{ textAlign:'left', background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px', color:'var(--muted)', fontSize:12, lineHeight:1.55, cursor:'pointer' }}>
              ✦ {ex}
            </button>
          ))}
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((m, i) => (
          <div key={i} className="glass" style={{ alignSelf:m.role==='student'?'flex-end':'stretch', maxWidth:m.role==='student'?'78%':'100%', padding:'14px 16px', borderRadius:14, background:m.role==='student'?'rgba(255,122,26,0.10)':'var(--glass-bg)' }}>
            <div style={{ fontSize:10, color:m.role==='student'?'var(--orange)':'var(--blue)', fontWeight:700, letterSpacing:1, marginBottom:7 }}>
              {m.role==='student'?'YOU':'NEETIRTH AI'}
            </div>
            <div style={{ whiteSpace:'pre-wrap', color:'var(--text)', fontSize:13, lineHeight:1.75 }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="glass" style={{ padding:'14px 16px', borderRadius:14, color:'var(--muted)', fontSize:13 }}>
            नीतीर्थ AI is thinking…
          </div>
        )}
      </div>
    </div>
  )
}
