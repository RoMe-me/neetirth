import { useState, memo, useCallback } from 'react'
import { PRACTICE, getPracticeQs, getPracticeStats, searchPractice } from '../data/practiceBank.js'
import { CHAPTERS, SC, ICONS } from '../data/pyqBank.js'
import LiquidBlock, { LiquidTag, LiquidBadge } from '../components/LiquidBlock.jsx'

const diffCol = d => d==='hard'?'var(--pink)':d==='medium'?'var(--gold)':'var(--green)'
const SUBJECTS = ['All','Chemistry','Physics','Biology']
const DIFFS    = ['All','easy','medium','hard']
const TYPES    = ['All','mcq','ar']

// ── localStorage cache for AI-generated questions ──────────────
const CACHE_KEY = 'neetirth_genq_'

function getCached(chapter) {
  try { const v = localStorage.getItem(CACHE_KEY + chapter); return v ? JSON.parse(v) : null } catch { return null }
}
function setCached(chapter, qs) {
  try { localStorage.setItem(CACHE_KEY + chapter, JSON.stringify(qs)) } catch {}
}
function clearCache() {
  try {
    Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY)).forEach(k => localStorage.removeItem(k))
  } catch {}
}
function getCacheStats() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY))
    const total = keys.reduce((a, k) => {
      try { return a + (JSON.parse(localStorage.getItem(k))||[]).length } catch { return a }
    }, 0)
    return { chapters: keys.length, total }
  } catch { return { chapters: 0, total: 0 } }
}

// ── AI generation via Vercel serverless ───────────────────────
async function generateChapterQs(chapter, subject, count=25) {
  const prompt = `Generate exactly ${count} NEET UG practice MCQs for the chapter "${chapter}" (${subject}).
Rules:
- NCERT-based only. NEET difficulty and style.
- Mix: 40% easy, 40% medium, 20% hard.
- Include 4-5 Assertion-Reasoning (type:"ar") questions.
- For A-R questions use these 4 options exactly:
  A: "Both A and R correct, R explains A"
  B: "Both A and R correct, R does not explain A"  
  C: "A correct, R wrong"
  D: "A wrong"
- Make questions unique and exam-worthy.

Return ONLY a JSON array, no markdown, no explanation:
[{"id":"g1","q":"question text","o":{"A":"","B":"","C":"","D":""},"a":"A","e":"explanation","ch":"${chapter}","sub":"${subject}","d":"easy","type":"mcq"}]`

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  if (!res.ok) throw new Error('API error ' + res.status)
  const data = await res.json()
  const raw = data?.content?.[0]?.text || ''
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array in response')
  const parsed = JSON.parse(match[0])
  // add unique IDs and timestamp
  return parsed.map((q, i) => ({ ...q, id: `gen_${Date.now()}_${i}`, pyq: false }))
}

// ── Question card ──────────────────────────────────────────────
const QuestionCard = memo(function QuestionCard({ q, idx }) {
  const [sel,   setSel]   = useState(null)
  const [shown, setShown] = useState(false)
  const isAR = q.type === 'ar'

  return (
    <div className="glass glass-card" style={{ padding:'18px 22px', marginBottom:10 }}>
      <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap', alignItems:'center' }}>
        <LiquidTag color={SC[q.sub]||'#888'}>{ICONS[q.sub]} {q.sub}</LiquidTag>
        <LiquidBlock fillColor={diffCol(q.d)+'28'} fillHeight={55}
          style={{ display:'inline-flex', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, color:diffCol(q.d) }}>
          {q.d}
        </LiquidBlock>
        {isAR && (
          <LiquidBlock fillColor="rgba(170,136,255,0.18)" fillHeight={55}
            style={{ display:'inline-flex', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, color:'#AA88FF' }}>
            A-R
          </LiquidBlock>
        )}
        <span style={{ fontSize:10, color:'var(--dim)' }}>{q.ch}</span>
        {!q.pyq && <span style={{ fontSize:9, color:'var(--dim)', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:3, padding:'1px 5px' }}>AI</span>}
      </div>

      <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.8, marginBottom:14, whiteSpace:'pre-line' }}>
        <span style={{ color:'var(--dim)', marginRight:6, fontFamily:'var(--mono)', fontSize:11 }}>Q{idx+1}.</span>{q.q}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
        {['A','B','C','D'].map(opt => {
          const correct = q.a === opt, isSel = sel === opt
          let bg='rgba(255,255,255,0.03)', border='var(--border)', col='var(--muted)'
          if (isSel && !shown)            { bg='rgba(255,107,0,0.10)';  border='rgba(255,107,0,0.40)';  col='var(--orange)' }
          if (shown && correct)           { bg='rgba(0,229,170,0.10)';  border='rgba(0,229,170,0.40)';  col='var(--green)'  }
          if (shown && isSel && !correct) { bg='rgba(255,77,141,0.10)'; border='rgba(255,77,141,0.40)'; col='var(--pink)'   }
          return (
            <div key={opt} onClick={() => { if (!shown) setSel(opt) }}
              style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'9px 12px', borderRadius:8, background:bg, border:`1px solid ${border}`, cursor:shown?'default':'pointer', transition:'all 0.12s' }}>
              <span style={{ fontSize:11, fontWeight:700, color:col, fontFamily:'var(--mono)', flexShrink:0, marginTop:1 }}>{opt}</span>
              <span style={{ fontSize:12, color:col, lineHeight:1.6 }}>{q.o[opt]}</span>
            </div>
          )
        })}
      </div>

      {!shown ? (
        <button onClick={() => setShown(true)} disabled={!sel}
          style={{ background:sel?'var(--orange)':'var(--border)', border:'none', color:sel?'#fff':'var(--dim)', borderRadius:7, padding:'7px 18px', fontSize:12, fontWeight:600, cursor:sel?'pointer':'default', opacity:sel?1:0.5 }}>
          Check Answer
        </button>
      ) : (
        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--muted)', lineHeight:1.7, borderLeft:`3px solid ${sel===q.a?'var(--green)':'var(--pink)'}` }}>
          {sel===q.a ? '✅ Correct — ' : `❌ Wrong (Ans: ${q.a}) — `}{q.e}
        </div>
      )}
    </div>
  )
})

// ── Main component ─────────────────────────────────────────────
export default function Practice() {
  const [tab,        setTab]        = useState('generate')
  const [subject,    setSubject]    = useState('Chemistry')
  const [chapter,    setChapter]    = useState('')
  const [diff,       setDiff]       = useState('All')
  const [type,       setType]       = useState('All')
  const [count,      setCount]      = useState(20)
  const [search,     setSearch]     = useState('')
  const [qs,         setQs]         = useState([])
  const [loading,    setLoading]    = useState(false)
  const [loadMsg,    setLoadMsg]    = useState('')
  const [cacheStats, setCacheStats] = useState(getCacheStats())
  const [err,        setErr]        = useState('')

  const stats    = getPracticeStats()
  const arQs     = PRACTICE.filter(q => q.type === 'ar')
  const chapters = chapter ? [] : (subject && CHAPTERS[subject]
    ? Object.values(CHAPTERS[subject].sections).flat()
    : [])
  const searchResults = search.length > 1 ? searchPractice(search, subject==='All'?null:subject) : []

  const generateQs = useCallback(async () => {
    if (!chapter) return setErr('Please select a chapter first.')
    setErr(''); setLoading(true)

    // Check cache first
    const cached = getCached(chapter)
    if (cached && cached.length >= 10) {
      setQs(cached.sort(() => Math.random() - 0.5))
      setLoading(false)
      setLoadMsg(`Loaded ${cached.length} cached questions for ${chapter}`)
      return
    }

    // Generate fresh
    setLoadMsg(`Generating ${count} questions for ${chapter}…`)
    try {
      const generated = await generateChapterQs(chapter, subject, count)
      // Merge with any existing cached
      const existing = getCached(chapter) || []
      const merged = [...existing, ...generated]
      setCached(chapter, merged)
      setQs(merged.sort(() => Math.random() - 0.5))
      setCacheStats(getCacheStats())
      setLoadMsg(`Generated ${generated.length} questions! (${merged.length} total cached for ${chapter})`)
    } catch(e) {
      setErr('Generation failed: ' + e.message + '. Check if ANTHROPIC_API_KEY is set in Vercel.')
    }
    setLoading(false)
  }, [chapter, subject, count])

  const loadOffline = () => {
    setErr('')
    try {
      const result = getPracticeQs({
        subject: subject==='All' ? null : subject,
        difficulty: diff==='All' ? null : diff,
        type: type==='All' ? null : type,
        count,
      })
      setQs(result)
    } catch(e) { setErr(e.message) }
  }

  const Btn = ({ active, col='var(--orange)', onClick, children, style={} }) => (
    <button onClick={onClick} style={{ padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:active?600:400, background:active?col+'18':'rgba(255,255,255,0.04)', border:`1px solid ${active?col+'50':'var(--border)'}`, color:active?col:'var(--muted)', transition:'all 0.12s', cursor:'pointer', ...style }}>
      {children}
    </button>
  )

  return (
    <div className="page-in" style={{ padding:'32px 36px', maxWidth:880, margin:'0 auto' }}>
      <style>{`button:hover{filter:brightness(1.1)} input::placeholder{color:var(--dim)} select{font-family:var(--font)}`}</style>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Practice Questions</div>
        <div style={{ fontSize:13, color:'var(--muted)' }}>
          AI generates unlimited questions per chapter · Cached offline · Never repeats until you clear
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        {[
          { v:stats.total,          l:'Hardcoded',        c:'var(--orange)' },
          { v:cacheStats.total,     l:'AI Generated',     c:'var(--blue)'   },
          { v:cacheStats.chapters,  l:'Chapters Cached',  c:'var(--green)'  },
          { v:arQs.length,          l:'A-R Questions',    c:'#AA88FF'       },
        ].map(s => (
          <LiquidBlock key={s.l} fillColor={s.c+'22'} fillHeight={38} style={{ padding:'14px 18px' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.c, fontFamily:'var(--mono)' }}>{s.v}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{s.l}</div>
          </LiquidBlock>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, marginBottom:20, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:4, width:'fit-content', border:'1px solid var(--border)' }}>
        {[
          ['generate','✦ Generate (AI)'],
          ['offline',  '📚 Offline Bank'],
          ['search',   '🔍 Search'],
          ['ar',       'A-R Type'],
        ].map(([id,label]) => (
          <button key={id} onClick={() => { setTab(id); setQs([]); setErr('') }}
            style={{ padding:'7px 16px', borderRadius:7, fontSize:12, fontWeight:tab===id?600:400, background:tab===id?'var(--card)':'none', border:tab===id?'1px solid var(--border)':'1px solid transparent', color:tab===id?'var(--text)':'var(--muted)', cursor:'pointer', whiteSpace:'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {err && (
        <div style={{ background:'rgba(255,77,141,0.08)', border:'1px solid rgba(255,77,141,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'var(--pink)' }}>
          ⚠ {err}
        </div>
      )}

      {/* ── GENERATE (AI) TAB ── */}
      {tab==='generate' && (
        <>
          <div className="glass" style={{ padding:'20px 22px', marginBottom:20 }}>
            <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>SELECT CHAPTER TO GENERATE</div>

            {/* Subject select */}
            <div style={{ display:'flex', gap:6, marginBottom:14 }}>
              {['Chemistry','Physics','Biology'].map(s => (
                <Btn key={s} active={subject===s} col={SC[s]} onClick={() => { setSubject(s); setChapter('') }}>{ICONS[s]} {s}</Btn>
              ))}
            </div>

            {/* Chapter select */}
            <select
              value={chapter}
              onChange={e => setChapter(e.target.value)}
              style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:13, color: chapter ? 'var(--text)' : 'var(--muted)', outline:'none', marginBottom:14, cursor:'pointer' }}
            >
              <option value="">Select a chapter…</option>
              {CHAPTERS[subject] && Object.entries(CHAPTERS[subject].sections).map(([sec, chs]) => (
                <optgroup key={sec} label={sec}>
                  {chs.map(ch => {
                    const cached = getCached(ch)
                    const n = cached ? cached.length : 0
                    return <option key={ch} value={ch}>{ch}{n > 0 ? ` (${n} cached)` : ''}</option>
                  })}
                </optgroup>
              ))}
            </select>

            {/* Count */}
            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:16 }}>
              <span style={{ fontSize:12, color:'var(--muted)' }}>Generate:</span>
              {[10,20,30,50].map(n => (
                <Btn key={n} active={count===n} onClick={() => setCount(n)}>{n}Q</Btn>
              ))}
            </div>

            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button onClick={generateQs} disabled={loading || !chapter}
                style={{ background:chapter?'var(--orange)':'var(--border)', border:'none', color:chapter?'#fff':'var(--dim)', borderRadius:8, padding:'10px 24px', fontSize:13, fontWeight:700, cursor:chapter?'pointer':'default', opacity:loading?0.7:1 }}>
                {loading ? '⏳ Generating…' : `Generate ${count} Questions →`}
              </button>
              {cacheStats.total > 0 && (
                <button onClick={() => { clearCache(); setCacheStats({ chapters:0, total:0 }); setQs([]) }}
                  style={{ background:'none', border:'1px solid var(--border)', color:'var(--muted)', borderRadius:8, padding:'9px 16px', fontSize:12, cursor:'pointer' }}>
                  Clear Cache
                </button>
              )}
            </div>

            {loadMsg && <div style={{ fontSize:11, color:'var(--green)', marginTop:10 }}>✅ {loadMsg}</div>}

            <div style={{ fontSize:11, color:'var(--dim)', marginTop:10, lineHeight:1.8 }}>
              💡 Questions are cached on your device after first generation.<br/>
              Same chapter next time → loads instantly from cache. No API call needed.
            </div>
          </div>

          {qs.length > 0 && (
            <>
              <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>
                {qs.length} QUESTIONS — {chapter}
              </div>
              {qs.map((q,i) => <QuestionCard key={q.id||i} q={q} idx={i}/>)}
            </>
          )}
        </>
      )}

      {/* ── OFFLINE BANK TAB ── */}
      {tab==='offline' && (
        <>
          <div className="glass" style={{ padding:'18px 20px', marginBottom:20 }}>
            <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>FILTER HARDCODED QUESTIONS ({stats.total} total)</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
              <div style={{ display:'flex', gap:4 }}>
                {SUBJECTS.map(s => <Btn key={s} active={subject===s} col={SC[s]||'var(--orange)'} onClick={() => setSubject(s)}>{s}</Btn>)}
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {DIFFS.map(d => <Btn key={d} active={diff===d} col={diffCol(d)} onClick={() => setDiff(d)}>{d==='All'?'All Levels':d}</Btn>)}
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {TYPES.map(t => <Btn key={t} active={type===t} col="#AA88FF" onClick={() => setType(t)}>{t==='All'?'All Types':t.toUpperCase()}</Btn>)}
              </div>
            </div>
            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:12, color:'var(--muted)' }}>Count:</span>
              {[10,20,30,50].map(n => <Btn key={n} active={count===n} onClick={() => setCount(n)}>{n}Q</Btn>)}
            </div>
            <button onClick={loadOffline}
              style={{ background:'var(--orange)', border:'none', color:'#fff', borderRadius:8, padding:'10px 24px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              Load Questions →
            </button>
          </div>
          {qs.length > 0 && (
            <>
              <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>{qs.length} QUESTIONS LOADED</div>
              {qs.map((q,i) => <QuestionCard key={q.id||i} q={q} idx={i}/>)}
            </>
          )}
        </>
      )}

      {/* ── SEARCH TAB ── */}
      {tab==='search' && (
        <>
          <div className="glass" style={{ padding:'16px 20px', marginBottom:16 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search topic, keyword, chapter… e.g. hybridisation, lac operon, refraction"
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:8, padding:'11px 14px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'var(--font)' }}
              onFocus={e => e.target.style.borderColor='var(--orange)'}
              onBlur={e  => e.target.style.borderColor='var(--border)'}
            />
            {search.length > 0 && (
              <div style={{ fontSize:11, color:'var(--dim)', marginTop:8 }}>
                {searchResults.length} result{searchResults.length!==1?'s':''} in hardcoded bank
              </div>
            )}
          </div>
          {searchResults.length > 0
            ? searchResults.map((q,i) => <QuestionCard key={q.id||i} q={q} idx={i}/>)
            : search.length > 1 && (
              <div className="glass" style={{ padding:'40px', textAlign:'center', color:'var(--muted)' }}>
                <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
                No results for "{search}". Try the Generate tab for AI-powered questions.
              </div>
            )
          }
        </>
      )}

      {/* ── A-R TAB ── */}
      {tab==='ar' && (
        <>
          <div className="glass" style={{ padding:'14px 18px', marginBottom:18, fontSize:12, color:'var(--muted)', lineHeight:1.9 }}>
            <span style={{ color:'#AA88FF', fontWeight:700, display:'block', marginBottom:6 }}>How to solve Assertion-Reasoning</span>
            <span style={{ color:'var(--text)', fontWeight:600 }}>Option A</span> — Both A & R correct; R correctly explains A<br/>
            <span style={{ color:'var(--text)', fontWeight:600 }}>Option B</span> — Both correct; R does NOT explain A<br/>
            <span style={{ color:'var(--text)', fontWeight:600 }}>Option C</span> — A correct, R wrong<br/>
            <span style={{ color:'var(--text)', fontWeight:600 }}>Option D</span> — A wrong (R may be right or wrong)
          </div>
          <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>{arQs.length} A-R QUESTIONS</div>
          {arQs.map((q,i) => <QuestionCard key={q.id||i} q={q} idx={i}/>)}
        </>
      )}
    </div>
  )
}
