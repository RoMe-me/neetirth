import { useState } from 'react'
import { CHAPTERS, SC, ICONS, getOfflineQs, getOfflineFull, getChapterCounts } from '../data/pyqBank.js'

const T = {
  bg:'#0A0A0F', card:{ background:'#0F0F1A', border:'1px solid #1E1E30', borderRadius:12, padding:20 },
  orange:'#FF6B00', blue:'#4D9FFF', pink:'#FF5588', green:'#00E5AA',
  text:'#E8E8F0', muted:'#606080', dim:'#404060',
}
const btn = (col='#FF6B00', full=false) => ({
  background:col+'18', border:`1px solid ${col}55`, color:col,
  borderRadius:8, padding:'9px 18px', cursor:'pointer',
  fontFamily:'inherit', fontSize:13, fontWeight:600, width:full?'100%':'auto'
})
const NEET_FORMAT = { Physics:45, Chemistry:45, Biology:60 }

export default function MockSetup({ user, initialCfg, onStart, onBack }) {
  const [step, setStep] = useState(initialCfg?.isFull ? 'full' : (initialCfg?.type || 'type'))
  const [subject, setSubject] = useState(null)
  const [selCh, setSelCh] = useState([])
  const [qCount, setQCount] = useState(20)
  const [loading, setLoading] = useState(false)
  const [loadMsg, setLoadMsg] = useState('')
  const [err, setErr] = useState('')

  const normalise = (q, i) => ({
    id: q.id || i,
    question: q.question || q.q,
    options: q.options || q.o,
    correct: q.correct || q.a,
    explanation: q.explanation || q.e,
    chapter: q.chapter || q.ch,
    subject: q.subject || q.sub,
    difficulty: q.difficulty || q.d || 'medium',
    pyq: true,
    year: q.year || q.y || null
  })

  const startMock = async (cfg) => {
    setLoading(true); setErr('')
    try {
      setLoadMsg('Loading questions from PYQ bank (2006–2026)…')
      await new Promise(r => setTimeout(r, 300))
      let raw = []
      if (cfg.isFull) {
        raw = getOfflineFull()
      } else {
        raw = getOfflineQs(cfg.subject, cfg.chapters, cfg.qCount)
        if (!raw.length) throw new Error('No matching questions. Try a different selection.')
      }
      const qs = raw.map((q, i) => normalise(q, i))
      const timeLimit = cfg.isFull ? 12000 : qs.length * 72
      onStart({ qs, timeLimit, cfg, startedAt: new Date().toISOString() })
    } catch(e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`*{box-sizing:border-box} button:hover{filter:brightness(1.2)} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#2A2A40}`}</style>

      {/* TOP */}
      <div style={{ background:'#0F0F1A', borderBottom:'1px solid #1E1E30', padding:'12px 28px', display:'flex', alignItems:'center', gap:16 }}>
        <button onClick={onBack} style={{ ...btn('#606080'), padding:'7px 14px', fontSize:12 }}>← Home</button>
        <div style={{ fontSize:18, fontWeight:800, color:T.orange, letterSpacing:1 }}>नीतीर्थ</div>
        <div style={{ fontSize:14, color:T.muted }}>/ Setup Mock</div>
      </div>

      <div style={{ padding:32, maxWidth:700, margin:'0 auto' }}>
        {err && (
          <div style={{ ...T.card, borderColor:T.pink, color:T.pink, marginBottom:16, fontSize:13 }}>
            ⚠ {err}
          </div>
        )}

        {/* FULL NEET */}
        {step === 'full' && (
          <div style={T.card}>
            <div style={{ fontSize:20, fontWeight:800, color:T.orange, marginBottom:4 }}>🎯 Full NEET Mock</div>
            <div style={{ fontSize:13, color:T.muted, marginBottom:20 }}>150 Questions · 570 Marks · Real PYQs 2006–2026</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
              {Object.entries(NEET_FORMAT).map(([subj,n]) => (
                <div key={subj} style={{ ...T.card, textAlign:'center', borderColor:(SC[subj]||'#888')+'40' }}>
                  <div style={{ fontSize:24 }}>{ICONS[subj]}</div>
                  <div style={{ color:SC[subj], fontSize:12, marginTop:4, fontWeight:700 }}>{subj}</div>
                  <div style={{ color:T.text, fontSize:20, fontWeight:800 }}>{n}Q</div>
                  <div style={{ color:T.dim, fontSize:10 }}>{n*4} marks</div>
                </div>
              ))}
            </div>
            <div style={{ ...T.card, borderColor:'#FFAA0030', marginBottom:16, fontSize:12, color:'#FFAA00', lineHeight:1.7 }}>
              📚 Real PYQs from NEET 2006–2026. Questions shuffled randomly each time.
              Biology section is 60Q (from our 60-question bank) instead of 90Q until we expand the bank further.
            </div>
            <button
              onClick={() => startMock({ isFull:true })}
              disabled={loading}
              style={{ ...btn(T.orange, true), padding:16, fontSize:16, opacity:loading?0.5:1 }}
            >
              {loading ? `⏳ ${loadMsg}` : '⚡ Start Full NEET Mock'}
            </button>
          </div>
        )}

        {/* CHOOSE TYPE */}
        {step === 'type' && (
          <>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>Choose Mock Type</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { type:'subject', icon:'📖', label:'Subject-wise', sub:'All questions from one subject' },
                { type:'chapter', icon:'📄', label:'Chapter-wise', sub:'Pick specific chapters to practise' },
              ].map(({ type, icon, label, sub }) => (
                <div key={type}
                  onClick={() => setStep(type)}
                  style={{ ...T.card, cursor:'pointer', textAlign:'center', padding:28 }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=T.orange}
                  onMouseLeave={e => e.currentTarget.style.borderColor='#1E1E30'}
                >
                  <div style={{ fontSize:36, marginBottom:8 }}>{icon}</div>
                  <div style={{ color:T.orange, fontSize:15, fontWeight:700 }}>{label}</div>
                  <div style={{ color:T.muted, fontSize:12, marginTop:6 }}>{sub}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* SUBJECT PICK */}
        {(step === 'subject' || step === 'chapter') && !subject && (
          <>
            <button onClick={() => setStep('type')} style={{ ...btn('#606080'), padding:'7px 14px', fontSize:12, marginBottom:16 }}>← Back</button>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>Select Subject</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {Object.keys(CHAPTERS).map(subj => (
                <div key={subj}
                  onClick={() => setSubject(subj)}
                  style={{ ...T.card, cursor:'pointer', display:'flex', alignItems:'center', gap:16 }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=SC[subj]}
                  onMouseLeave={e => e.currentTarget.style.borderColor='#1E1E30'}
                >
                  <span style={{ fontSize:28 }}>{ICONS[subj]}</span>
                  <div>
                    <div style={{ color:SC[subj], fontSize:15, fontWeight:700 }}>{subj}</div>
                    <div style={{ color:T.muted, fontSize:12 }}>
                      {Object.values(CHAPTERS[subj].sections).flat().length} chapters · {step === 'subject' ? 'all chapters included' : 'pick specific chapters'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* SUBJECT-WISE CONFIG */}
        {step === 'subject' && subject && (
          <>
            <button onClick={() => setSubject(null)} style={{ ...btn('#606080'), padding:'7px 14px', fontSize:12, marginBottom:16 }}>← Back</button>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <span style={{ fontSize:24 }}>{ICONS[subject]}</span>
              <span style={{ color:SC[subject], fontSize:18, fontWeight:700 }}>{subject}</span>
            </div>
            <div style={{ ...T.card }}>
              <div style={{ fontSize:13, color:T.muted, marginBottom:14 }}>How many questions?</div>
              <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                {[10,20,30,45].map(n => (
                  <button key={n}
                    onClick={() => setQCount(n)}
                    style={{ ...btn(qCount===n ? SC[subject] : '#505070'), padding:'8px 20px' }}>
                    {n}Q
                  </button>
                ))}
              </div>
              <button
                onClick={() => startMock({ isFull:false, subject, chapters:[], qCount })}
                disabled={loading}
                style={{ ...btn(SC[subject], true), padding:14, opacity:loading?0.5:1 }}
              >
                {loading ? `⏳ ${loadMsg}` : `⚡ Start ${subject} Mock`}
              </button>
            </div>
          </>
        )}

        {/* CHAPTER-WISE CONFIG */}
        {step === 'chapter' && subject && (
          <>
            <button onClick={() => setSubject(null)} style={{ ...btn('#606080'), padding:'7px 14px', fontSize:12, marginBottom:16 }}>← Back</button>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <span style={{ fontSize:24 }}>{ICONS[subject]}</span>
              <span style={{ color:SC[subject], fontSize:18, fontWeight:700 }}>{subject}</span>
              <span style={{ color:T.muted, fontSize:12 }}>{selCh.length > 0 ? `${selCh.length} selected` : 'tap to select chapters'}</span>
            </div>

            {Object.entries(CHAPTERS[subject].sections).map(([sec, chs]) => (
              <div key={sec} style={{ ...T.card, marginBottom:10 }}>
                <div style={{ color:SC[subject], fontSize:12, fontWeight:700, marginBottom:10 }}>{sec}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {(() => {
                    const chCounts = getChapterCounts(subject);
                    return chs.map(ch => {
                      const sel = selCh.includes(ch);
                      const n = chCounts[ch] || 0;
                      return (
                        <button key={ch}
                          onClick={() => setSelCh(prev => sel ? prev.filter(x => x!==ch) : [...prev, ch])}
                          title={`${n} questions available`}
                          style={{
                            background: sel ? SC[subject]+'28' : '#0A0A16',
                            border: `1px solid ${sel ? SC[subject] : '#1E1E30'}`,
                            color: sel ? SC[subject] : n > 0 ? T.muted : T.dim,
                            borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer',
                            opacity: n === 0 ? 0.5 : 1
                          }}
                        >
                          {ch} <span style={{fontSize:9, opacity:0.7}}>({n}Q)</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            ))}

            {selCh.length > 0 && (
              <div style={{ ...T.card, marginTop:12 }}>
                <div style={{ fontSize:13, color:T.muted, marginBottom:12 }}>How many questions?</div>
                <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                  {[10,20,30,45].map(n => (
                    <button key={n} onClick={() => setQCount(n)}
                      style={{ ...btn(qCount===n ? SC[subject] : '#505070'), padding:'8px 18px' }}>
                      {n}Q
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => startMock({ isFull:false, subject, chapters:selCh, qCount })}
                  disabled={loading}
                  style={{ ...btn(SC[subject], true), padding:14, opacity:loading?0.5:1 }}
                >
                  {loading ? `⏳ ${loadMsg}` : `⚡ Generate (${selCh.length} chapter${selCh.length>1?'s':''})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
