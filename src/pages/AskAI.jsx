import { useMemo, useRef, useState } from 'react'
import LiquidBlock from '../components/LiquidBlock.jsx'

const EXAMPLES = [
  'Explain meiosis I vs meiosis II for NEET.',
  'Solve: a body starts from rest with acceleration 2 m/s² for 5 s.',
  'Why is phenol more acidic than alcohol?',
]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Please choose a JPG, PNG or WebP image.'))
    if (file.size > MAX_IMAGE_BYTES) return reject(new Error('Keep the image under 5 MB for a fast answer.'))
    const reader = new FileReader()
    reader.onload = () => resolve({ name:file.name || 'question-image', mimeType:file.type, data:String(reader.result).split(',')[1], preview:String(reader.result) })
    reader.onerror = () => reject(new Error('Could not read that image. Try another one.'))
    reader.readAsDataURL(file)
  })
}

export default function AskAI() {
  const [question, setQuestion] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef(null)

  const canAsk = (question.trim().length > 0 || attachment) && !loading
  const remaining = useMemo(() => 2500 - question.length, [question.length])

  const attachFile = async file => {
    try { setErr(''); setAttachment(await readImage(file)) }
    catch (error) { setAttachment(null); setErr(error.message) }
  }

  const ask = async (text = question) => {
    const clean = text.trim()
    if ((!clean && !attachment) || loading) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErr('Ask AI needs an internet connection. Your PYQ Bank and Practice pages still work offline.')
      return
    }
    setErr(''); setLoading(true); setQuestion('')
    const imageForMessage = attachment?.preview || null
    const imagePayload = attachment ? { data:attachment.data, mimeType:attachment.mimeType } : undefined
    setMessages(prev => [...prev, { role:'student', text:clean || 'Please solve this question image.', image:imageForMessage }])
    setAttachment(null)
    try {
      const res = await fetch('/api/ask', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ question:clean, image:imagePayload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'AI could not answer right now. Please retry.')
      setMessages(prev => [...prev, { role:'ai', text:data.answer }])
    } catch (error) {
      const message = error?.message || 'AI could not answer right now. Please retry.'
      setErr(message)
      setMessages(prev => [...prev, { role:'ai', text:`I could not answer that yet: ${message}` }])
    } finally { setLoading(false) }
  }

  const onPaste = event => {
    const image = [...(event.clipboardData?.items || [])].find(item => item.type.startsWith('image/'))
    if (image) { event.preventDefault(); attachFile(image.getAsFile()) }
  }

  return (
    <div className="page-in" style={{ padding:'32px 36px 64px', maxWidth:860, margin:'0 auto' }}>
      <style>{`
        .ask-composer{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end}
        .ask-attach{display:inline-flex;align-items:center;gap:7px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 11px;font-size:11px;cursor:pointer}
        .ask-attach:hover{color:var(--text);border-color:var(--border2)}
        @media(max-width:640px){.ask-composer{grid-template-columns:1fr}.ask-send{width:100%}}
      `}</style>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:11, color:'var(--blue)', letterSpacing:2, marginBottom:8 }}>DOUBT SOLVER</div>
        <div style={{ fontSize:25, fontWeight:800, color:'var(--text)', marginBottom:6 }}>Ask Neetirth AI</div>
        <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.65 }}>Type a doubt or upload a question photo. Answers are NCERT-first, step-by-step, and honest when the official source should be checked.</div>
      </div>

      <LiquidBlock fillColor="rgba(100,174,255,0.14)" fillHeight={24} style={{ padding:'18px 20px', marginBottom:18 }}>
        <div>
          <textarea value={question} onChange={event => setQuestion(event.target.value.slice(0,2500))} onPaste={onPaste} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') ask() }} placeholder="Type any Physics, Chemistry, or Biology doubt…" rows={4} style={{ width:'100%', resize:'vertical', minHeight:96, background:'rgba(255,255,255,.055)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text)', padding:'13px 14px', outline:'none', fontFamily:'var(--font)', fontSize:14, lineHeight:1.65, boxSizing:'border-box' }} />
          {attachment && <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:10, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:9, padding:7 }}><img src={attachment.preview} alt="Question preview" style={{ width:48, height:48, objectFit:'cover', borderRadius:6 }} /><div style={{ flex:1, minWidth:0, color:'var(--muted)', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{attachment.name}</div><button onClick={() => setAttachment(null)} aria-label="Remove image" style={{ background:'none', border:'none', color:'var(--muted)', fontSize:16 }}>×</button></div>}
          <div className="ask-composer" style={{ marginTop:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => attachFile(event.target.files?.[0])} style={{ display:'none' }} />
              <button className="ask-attach" onClick={() => fileRef.current?.click()}>▧ Add question photo</button>
              <span style={{ fontSize:10, color:remaining < 150 ? 'var(--gold)' : 'var(--dim)' }}>{remaining} characters · paste an image or use Ctrl/⌘ + Enter</span>
            </div>
            <button className="ask-send liquid-cta" onClick={() => ask()} disabled={!canAsk} style={{ border:'none', borderRadius:10, padding:'10px 18px', background:canAsk?'var(--orange)':'var(--border)', color:canAsk?'#fff':'var(--dim)', fontWeight:700, cursor:canAsk?'pointer':'default', opacity:canAsk?1:.65 }}>{loading ? 'Thinking…' : 'Ask AI →'}</button>
          </div>
        </div>
      </LiquidBlock>

      {err && <div role="alert" style={{ background:'rgba(255,77,141,.08)', border:'1px solid rgba(255,77,141,.28)', color:'var(--pink)', borderRadius:10, padding:'11px 14px', fontSize:12, marginBottom:16 }}>⚠ {err}</div>}

      {messages.length === 0 && <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:10, marginBottom:16 }}>{EXAMPLES.map(example => <button key={example} onClick={() => ask(example)} disabled={loading} style={{ textAlign:'left', background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px', color:'var(--muted)', fontSize:12, lineHeight:1.55, cursor:'pointer' }}>✦ {example}</button>)}</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((message, index) => <div key={index} className="glass" style={{ alignSelf:message.role === 'student' ? 'flex-end' : 'stretch', maxWidth:message.role === 'student' ? '78%' : '100%', padding:'14px 16px', borderRadius:14, background:message.role === 'student' ? 'rgba(255,122,26,.10)' : 'var(--glass-bg)' }}><div style={{ fontSize:10, color:message.role === 'student' ? 'var(--orange)' : 'var(--blue)', fontWeight:700, letterSpacing:1, marginBottom:7 }}>{message.role === 'student' ? 'YOU' : 'NEETIRTH AI'}</div>{message.image && <img src={message.image} alt="Uploaded question" style={{ display:'block', maxWidth:'100%', maxHeight:260, borderRadius:9, marginBottom:10 }} />}<div style={{ whiteSpace:'pre-wrap', color:'var(--text)', fontSize:13, lineHeight:1.75 }}>{message.text}</div></div>)}
        {loading && <div className="glass" style={{ padding:'14px 16px', borderRadius:14, color:'var(--muted)', fontSize:13 }}>नीतीर्थ AI is thinking…</div>}
      </div>
    </div>
  )
}
