import { useState } from 'react'
import { CHAPTERS, SC, ICONS, getOfflineFull, getChapterCounts } from '../data/pyqBank.js'
import { getQuestions, generateAndCache } from '../data/questionEngine.js'

const NEET_FORMAT = { Physics:45, Chemistry:45, Biology:90 }

export default function MockSetup({ user, initialCfg, onStart, onBack }) {
  const [step, setStep]       = useState(initialCfg?.isFull ? 'full' : (initialCfg?.type || 'type'))
  const [subject, setSubject] = useState(null)
  const [selCh, setSelCh]     = useState([])
  const [qCount, setQCount]   = useState(20)
  const [loading, setLoading] = useState(false)
  const [loadMsg, setLoadMsg] = useState('')
  const [err, setErr]         = useState('')

  const normalise = (q,i) => ({
    id:q.id||i, question:q.question||q.q, options:q.options||q.o,
    correct:q.correct||q.a, explanation:q.explanation||q.e,
    chapter:q.chapter||q.ch, subject:q.subject||q.sub,
    difficulty:q.difficulty||q.d||'medium', pyq:!!q.pyq, year:q.year||q.y||null
  })

  const startMock = async (cfg) => {
    setLoading(true); setErr('')
    try {
      await new Promise(r=>setTimeout(r,150))
      let raw = []
      if (cfg.isFull) {
        raw = getOfflineFull()
      } else {
        // Use unified engine — combines PYQ + practice + AI cache
        raw = getQuestions({ subject: cfg.subject, chapters: cfg.chapters||[], count: cfg.qCount })
        // Build real depth on first visit to a sparse chapter — not just enough for
        // THIS mock, or every repeat attempt on the same chapter overlaps heavily.
        // Loop up to 3 generation calls (cache is additive, never overwrites)
        // targeting a healthy pool before settling for whatever's available.
        if (raw.length < cfg.qCount && cfg.chapters?.length > 0) {
          const TARGET_POOL = 80
          for (const ch of cfg.chapters) {
            for (let attempt = 0; attempt < 3; attempt++) {
              const currentPool = getQuestions({ subject: cfg.subject, chapters: [ch], count: 9999 })
              if (currentPool.length >= Math.max(cfg.qCount, TARGET_POOL)) break
              setLoadMsg(`Building question bank for ${ch}… (${currentPool.length} so far)`)
              try {
                await generateAndCache(ch, cfg.subject, 28)
              } catch (genErr) {
                console.error('Question generation failed for', ch, genErr?.message || genErr)
                break
              }
            }
          }
          raw = getQuestions({ subject: cfg.subject, chapters: cfg.chapters, count: cfg.qCount })
        }
      }
      if (!raw.length) throw new Error(
        'No questions found. Visit the Practice page → Generate Questions for this chapter first.'
      )
      onStart({ qs:raw.map(normalise), timeLimit:cfg.isFull?12000:raw.length*72, cfg, startedAt:new Date().toISOString() })
    } catch(e) { setErr(e.message) }
    finally { setLoading(false); setLoadMsg('') }
  }

  return (
    <div className="page-in" style={{ padding:'32px 36px', maxWidth:640, margin:'0 auto' }}>
      <style>{`button:hover{filter:brightness(1.12)}`}</style>

      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:28, fontSize:12, color:'var(--muted)' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:12, padding:0 }}>Dashboard</button>
        <span>›</span>
        <span style={{ color:'var(--text)' }}>
          {step==='full'?'Full NEET Mock':step==='type'?'Choose Type':step==='subject'?'Subject Mock':step==='chapter'?'Chapter Mock':subject||'Setup'}
        </span>
      </div>

      {err && (
        <div style={{ background:'#FF4D8D0C', border:'1px solid #FF4D8D30', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'var(--pink)' }}>
          {err}
        </div>
      )}

      {/* FULL MOCK */}
      {step==='full' && (
        <div>
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Full NEET Mock</div>
            <div style={{ fontSize:13, color:'var(--muted)' }}>180 Questions · 720 Marks · Real PYQs 2006–2026 · 3 Hours 20 Minutes</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
            {Object.entries(NEET_FORMAT).map(([subj,n])=>(
              <div key={subj} style={{ background:'var(--card)', border:`1px solid ${SC[subj]}25`, borderRadius:10, padding:'16px', textAlign:'center' }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{ICONS[subj]}</div>
                <div style={{ fontSize:11, color:SC[subj], fontWeight:600, marginBottom:4 }}>{subj}</div>
                <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', fontFamily:'var(--mono)' }}>{n}Q</div>
                <div style={{ fontSize:10, color:'var(--muted)' }}>{n*4} marks</div>
              </div>
            ))}
          </div>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', marginBottom:20, fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>
            📚 Physics 45Q (180 marks) · Chemistry 45Q (180 marks) · Biology 90Q (360 marks) = 180Q total = 720 marks.
            Questions shuffled randomly from real NEET PYQs each time.
          </div>
          <button onClick={()=>startMock({isFull:true})} disabled={loading}
            style={{ width:'100%', padding:'14px', background:'var(--orange)', border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:700, opacity:loading?0.6:1, letterSpacing:0.5 }}>
            {loading ? 'Loading questions…' : 'Start Full Mock →'}
          </button>
        </div>
      )}

      {/* CHOOSE TYPE */}
      {step==='type' && (
        <div>
          <div style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Choose Mock Type</div>
          <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>How do you want to practise today?</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { type:'subject', icon:'📖', label:'Subject-wise', sub:'All chapters of one subject' },
              { type:'chapter', icon:'📄', label:'Chapter-wise', sub:'Pick specific chapters' },
            ].map(({type,icon,label,sub})=>(
              <div key={type} onClick={()=>setStep(type)}
                style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'28px 20px', cursor:'pointer', textAlign:'center', transition:'border-color 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--orange)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
              >
                <div style={{ fontSize:32, marginBottom:10 }}>{icon}</div>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--orange)', marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBJECT PICK */}
      {(step==='subject'||step==='chapter') && !subject && (
        <div>
          <button onClick={()=>setStep('type')} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:12, padding:'0 0 20px 0', cursor:'pointer' }}>← Back</button>
          <div style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Select Subject</div>
          <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>Which subject do you want to practise?</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {Object.keys(CHAPTERS).map(subj=>(
              <div key={subj} onClick={()=>setSubject(subj)}
                style={{ background:'var(--card)', border:`1px solid var(--border)`, borderRadius:12, padding:'16px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:16, transition:'border-color 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=SC[subj]}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
              >
                <span style={{ fontSize:26 }}>{ICONS[subj]}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:SC[subj] }}>{subj}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{Object.values(CHAPTERS[subj].sections).flat().length} chapters · {step==='subject'?'all chapters':'pick chapters'}</div>
                </div>
                <span style={{ marginLeft:'auto', color:'var(--dim)', fontSize:18 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBJECT-WISE COUNT */}
      {step==='subject' && subject && (
        <div>
          <button onClick={()=>setSubject(null)} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:12, padding:'0 0 20px 0', cursor:'pointer' }}>← Back</button>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <span style={{ fontSize:22 }}>{ICONS[subject]}</span>
            <span style={{ fontSize:22, fontWeight:700, color:SC[subject] }}>{subject}</span>
          </div>
          <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>How many questions?</div>
          <div style={{ display:'flex', gap:8, marginBottom:24 }}>
            {[10,20,30,45].map(n=>(
              <button key={n} onClick={()=>setQCount(n)} style={{
                padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:600,
                background:qCount===n?SC[subject]+'20':'var(--card)',
                border:`1px solid ${qCount===n?SC[subject]+'60':'var(--border)'}`,
                color:qCount===n?SC[subject]:'var(--muted)'
              }}>{n}Q</button>
            ))}
          </div>
          <button onClick={()=>startMock({isFull:false,subject,chapters:[],qCount})} disabled={loading}
            style={{ width:'100%', padding:'13px', background:SC[subject], border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, opacity:loading?0.6:1 }}>
            {loading?'Loading…':`Start ${subject} Mock →`}
          </button>
        </div>
      )}

      {/* CHAPTER-WISE PICK */}
      {step==='chapter' && subject && (
        <div>
          <button onClick={()=>setSubject(null)} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:12, padding:'0 0 16px 0', cursor:'pointer' }}>← Back</button>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <span style={{ fontSize:20 }}>{ICONS[subject]}</span>
            <span style={{ fontSize:20, fontWeight:700, color:SC[subject] }}>{subject}</span>
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:20 }}>
            {selCh.length>0 ? `${selCh.length} chapter${selCh.length>1?'s':''} selected` : 'Tap chapters to select — number shows available questions'}
          </div>
          {Object.entries(CHAPTERS[subject].sections).map(([sec,chs])=>{
            const counts=(()=>{
                const pyqC=getChapterCounts(subject)
                // Also count from practiceBank for fuller display
                return pyqC
              })()
            return (
              <div key={sec} style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'var(--dim)', letterSpacing:1, marginBottom:8, textTransform:'uppercase' }}>{sec}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {chs.map(ch=>{
                    const sel=selCh.includes(ch), n=counts[ch]||0
                    return (
                      <button key={ch} onClick={()=>setSelCh(prev=>sel?prev.filter(x=>x!==ch):[...prev,ch])}
                        style={{
                          padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:sel?600:400,
                          background:sel?SC[subject]+'20':'var(--card)',
                          border:`1px solid ${sel?SC[subject]+'60':'var(--border)'}`,
                          color:sel?SC[subject]:n>0?'var(--muted)':'var(--dim)',
                          opacity:n===0?0.45:1,
                        }}
                      >{ch} <span style={{ opacity:0.6 }}>({n})</span></button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {selCh.length>0 && (
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'20px', marginTop:8 }}>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>Number of questions</div>
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {[10,20,30,45].map(n=>(
                  <button key={n} onClick={()=>setQCount(n)} style={{
                    padding:'9px 18px', borderRadius:8, fontSize:13, fontWeight:600,
                    background:qCount===n?SC[subject]+'20':'var(--surface)',
                    border:`1px solid ${qCount===n?SC[subject]+'60':'var(--border)'}`,
                    color:qCount===n?SC[subject]:'var(--muted)'
                  }}>{n}Q</button>
                ))}
              </div>
              <button onClick={()=>startMock({isFull:false,subject,chapters:selCh,qCount})} disabled={loading}
                style={{ width:'100%', padding:'13px', background:SC[subject], border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, opacity:loading?0.6:1 }}>
                {loading?'Loading…':`Generate Mock (${selCh.length} chapter${selCh.length>1?'s':''}) →`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
