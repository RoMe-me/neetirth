import { useState, memo, useCallback, useEffect } from 'react'
import { PRACTICE, getPracticeStats, searchPractice } from '../data/practiceBank.js'
import { CHAPTERS, SC, ICONS } from '../data/pyqBank.js'
import LiquidBlock, { LiquidTag } from '../components/LiquidBlock.jsx'
import {
  getQuestions, generateAndCache, getCacheStats, clearCache,
  getChapterAccuracy, getAdaptiveDifficulty, recordPerformance
} from '../data/questionEngine.js'

const diffCol = d => d==='hard'?'var(--pink)':d==='medium'?'var(--gold)':'var(--green)'
const DIFFS   = ['auto','easy','medium','hard']

const QuestionCard = memo(function QuestionCard({ q, idx, onAnswered }) {
  const [sel,   setSel]   = useState(null)
  const [shown, setShown] = useState(false)
  const isAR = q.type === 'ar'

  const check = () => {
    setShown(true)
    if (onAnswered) onAnswered(sel === q.a)
  }

  return (
    <div className="glass glass-card" style={{ padding:'18px 22px', marginBottom:10 }}>
      <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap', alignItems:'center' }}>
        <LiquidTag color={SC[q.sub]||'#888'}>{ICONS[q.sub]} {q.sub}</LiquidTag>
        <LiquidBlock fillColor={diffCol(q.d||q.diff||'medium')+'28'} fillHeight={55}
          style={{ display:'inline-flex', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, color:diffCol(q.d||q.diff||'medium') }}>
          {q.d||q.diff||'medium'}
        </LiquidBlock>
        {isAR && (
          <LiquidBlock fillColor="rgba(170,136,255,0.18)" fillHeight={55}
            style={{ display:'inline-flex', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, color:'#AA88FF' }}>
            A-R
          </LiquidBlock>
        )}
        <span style={{ fontSize:10, color:'var(--dim)' }}>{q.ch}</span>
      </div>
      <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.8, marginBottom:14, whiteSpace:'pre-line' }}>
        <span style={{ color:'var(--dim)', marginRight:6, fontFamily:'var(--mono)', fontSize:11 }}>Q{idx+1}.</span>{q.q}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
        {['A','B','C','D'].map(opt => {
          const correct = (q.a||q.correct) === opt, isSel = sel === opt
          let bg='rgba(255,255,255,0.03)', border='var(--border)', col='var(--muted)'
          if (isSel && !shown)            { bg='rgba(255,107,0,0.10)';  border='rgba(255,107,0,0.40)';  col='var(--orange)' }
          if (shown && correct)           { bg='rgba(0,229,170,0.10)';  border='rgba(0,229,170,0.40)';  col='var(--green)'  }
          if (shown && isSel && !correct) { bg='rgba(255,77,141,0.10)'; border='rgba(255,77,141,0.40)'; col='var(--pink)'   }
          return (
            <div key={opt} onClick={() => { if (!shown) setSel(opt) }}
              style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'9px 12px', borderRadius:8, background:bg, border:`1px solid ${border}`, cursor:shown?'default':'pointer', transition:'all 0.12s' }}>
              <span style={{ fontSize:11, fontWeight:700, color:col, fontFamily:'var(--mono)', flexShrink:0, marginTop:1 }}>{opt}</span>
              <span style={{ fontSize:12, color:col, lineHeight:1.6 }}>{(q.o||q.options)?.[opt]}</span>
            </div>
          )
        })}
      </div>
      {!shown ? (
        <button onClick={check} disabled={!sel}
          style={{ background:sel?'var(--orange)':'var(--border)', border:'none', color:sel?'#fff':'var(--dim)', borderRadius:7, padding:'7px 18px', fontSize:12, fontWeight:600, cursor:sel?'pointer':'default', opacity:sel?1:0.5 }}>
          Check Answer
        </button>
      ) : (
        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--muted)', lineHeight:1.7, borderLeft:`3px solid ${sel===(q.a||q.correct)?'var(--green)':'var(--pink)'}` }}>
          {sel===(q.a||q.correct)?'✅ Correct — ':`❌ Wrong (Ans: ${q.a||q.correct}) — `}{q.e||q.explanation}
        </div>
      )}
    </div>
  )
})

export default function Practice() {
  const [tab,      setTab]      = useState('chapters')
  const [subject,  setSubject]  = useState('Chemistry')
  const [chapter,  setChapter]  = useState('')
  const [diff,     setDiff]     = useState('auto')
  const [count,    setCount]    = useState(20)
  const [search,   setSearch]   = useState('')
  const [qs,       setQs]       = useState([])
  const [loading,  setLoading]  = useState(false)
  const [msg,      setMsg]      = useState('')
  const [err,      setErr]      = useState('')
  const [cStats,   setCStats]   = useState(getCacheStats())
  const [answered, setAnswered] = useState({ c:0, t:0 })

  const stats       = getPracticeStats()
  const arQs        = PRACTICE.filter(q => q.type === 'ar')
  const accuracy    = chapter ? getChapterAccuracy(chapter) : null
  const adaptDiff   = chapter ? getAdaptiveDifficulty(chapter) : null
  const searchRes   = search.length > 1 ? searchPractice(search, null) : []

  const handleAnswered = useCallback((correct) => {
    setAnswered(prev => ({ c: prev.c + (correct?1:0), t: prev.t + 1 }))
    if (chapter) recordPerformance(chapter, correct?1:0, 1)
  }, [chapter])

  const loadQs = async () => {
    if (!chapter) return setErr('Select a chapter first.')
    setErr(''); setLoading(true); setAnswered({ c:0, t:0 })
    try {
      const selectedDiff = diff === 'auto' ? adaptDiff : diff
      let result = getQuestions({ subject, chapters:[chapter], count,
        difficulty: selectedDiff || null })
      if (result.length < Math.min(5, count)) {
        setMsg('Fetching more questions for this chapter…')
        await generateAndCache(chapter, subject, 25)
        setCStats(getCacheStats())
        result = getQuestions({ subject, chapters:[chapter], count, difficulty: selectedDiff || null })
      }
      setQs(result); setMsg('')
    } catch(e) {
      setMsg(''); setErr(e.message)
    }
    setLoading(false)
  }

  const Btn = ({ active, col='var(--orange)', onClick, children }) => (
    <button onClick={onClick} style={{ padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:active?600:400, background:active?col+'18':'rgba(255,255,255,0.04)', border:`1px solid ${active?col+'50':'var(--border)'}`, color:active?col:'var(--muted)', transition:'all 0.12s', cursor:'pointer', whiteSpace:'nowrap' }}>
      {children}
    </button>
  )

  const diffLabel = d => {
    if (d === 'auto') return adaptDiff ? `Auto (→ ${adaptDiff})` : 'Auto (balanced)'
    return d.charAt(0).toUpperCase() + d.slice(1)
  }

  return (
    <div className="page-in" style={{ padding:'32px 36px', maxWidth:880, margin:'0 auto' }}>
      <style>{`button:hover{filter:brightness(1.1)} input::placeholder{color:var(--dim)} select{font-family:var(--font)}`}</style>

      {/* Header + slogan */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Practice Questions</div>
        <div style={{ fontSize:13, color:'var(--orange)', fontStyle:'italic' }}>
          Questions get harder as you improve — your accuracy shapes every session.
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        {[
          { v:stats.total + cStats.total, l:'Total Available',    c:'var(--orange)' },
          { v:cStats.total,               l:'AI Generated',       c:'var(--blue)'   },
          { v:cStats.chapters,            l:'Chapters Unlocked',  c:'var(--green)'  },
          { v:arQs.length,               l:'A-R Questions',      c:'#AA88FF'       },
        ].map(s => (
          <LiquidBlock key={s.l} fillColor={s.c+'22'} fillHeight={38} style={{ padding:'14px 18px' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.c, fontFamily:'var(--mono)' }}>{s.v}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{s.l}</div>
          </LiquidBlock>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, marginBottom:20, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:4, width:'fit-content', border:'1px solid var(--border)' }}>
        {[['chapters','By Chapter'],['search','Search'],['ar','Assertion-Reasoning']].map(([id,label]) => (
          <button key={id} onClick={() => { setTab(id); setQs([]); setErr('') }}
            style={{ padding:'7px 16px', borderRadius:7, fontSize:12, fontWeight:tab===id?600:400, background:tab===id?'var(--card)':'none', border:tab===id?'1px solid var(--border)':'1px solid transparent', color:tab===id?'var(--text)':'var(--muted)', cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {err && <div style={{ background:'rgba(255,77,141,0.08)', border:'1px solid rgba(255,77,141,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'var(--pink)' }}>⚠ {err}</div>}

      {/* ── CHAPTERS TAB ── */}
      {tab==='chapters' && (
        <>
          <div className="glass" style={{ padding:'20px 22px', marginBottom:20 }}>
            {/* Subject */}
            <div style={{ display:'flex', gap:6, marginBottom:14 }}>
              {['Chemistry','Physics','Biology'].map(s => (
                <Btn key={s} active={subject===s} col={SC[s]} onClick={() => { setSubject(s); setChapter('') }}>{ICONS[s]} {s}</Btn>
              ))}
            </div>

            {/* Chapter */}
            <select value={chapter} onChange={e => setChapter(e.target.value)}
              style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:13, color:chapter?'var(--text)':'var(--muted)', outline:'none', marginBottom:14, cursor:'pointer' }}>
              <option value="">Select a chapter…</option>
              {CHAPTERS[subject] && Object.entries(CHAPTERS[subject].sections).map(([sec, chs]) => (
                <optgroup key={sec} label={sec}>
                  {chs.map(ch => {
                    const acc = getChapterAccuracy(ch)
                    const label = acc !== null ? ` · ${acc}% acc` : ''
                    return <option key={ch} value={ch}>{ch}{label}</option>
                  })}
                </optgroup>
              ))}
            </select>

            {/* Accuracy + adaptive hint */}
            {chapter && accuracy !== null && (
              <div style={{ background:accuracy>=70?'rgba(0,229,170,0.08)':accuracy>=50?'rgba(255,184,48,0.08)':'rgba(255,77,141,0.08)', border:`1px solid ${accuracy>=70?'rgba(0,229,170,0.3)':accuracy>=50?'rgba(255,184,48,0.3)':'rgba(255,77,141,0.3)'}`, borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12 }}>
                <span style={{ color:accuracy>=70?'var(--green)':accuracy>=50?'var(--gold)':'var(--pink)', fontWeight:600 }}>
                  {accuracy}% accuracy in {chapter}
                </span>
                <span style={{ color:'var(--muted)' }}>
                  {accuracy>=70?' — Unlocked hard mode 🔥':accuracy>=50?' — Moving to medium questions':' — Building from basics'}
                </span>
              </div>
            )}

            {/* Difficulty */}
            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:12, color:'var(--muted)', flexShrink:0 }}>Difficulty:</span>
              {DIFFS.map(d => (
                <Btn key={d} active={diff===d} col={d==='hard'?'var(--pink)':d==='medium'?'var(--gold)':d==='easy'?'var(--green)':'var(--orange)'} onClick={() => setDiff(d)}>
                  {diffLabel(d)}
                </Btn>
              ))}
            </div>

            {/* Count */}
            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:16 }}>
              <span style={{ fontSize:12, color:'var(--muted)', flexShrink:0 }}>Questions:</span>
              {[10,20,30,50].map(n => <Btn key={n} active={count===n} onClick={() => setCount(n)}>{n}Q</Btn>)}
            </div>

            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button onClick={loadQs} disabled={loading||!chapter}
                style={{ background:chapter?'var(--orange)':'var(--border)', border:'none', color:chapter?'#fff':'var(--dim)', borderRadius:8, padding:'10px 24px', fontSize:13, fontWeight:700, cursor:chapter?'pointer':'default', opacity:loading?0.7:1 }}>
                {loading ? '⏳ Loading…' : 'Start Practice →'}
              </button>
              {cStats.total > 0 && (
                <button onClick={() => { clearCache(); setCStats({chapters:0,total:0}); setQs([]) }}
                  style={{ background:'none', border:'1px solid var(--border)', color:'var(--muted)', borderRadius:8, padding:'9px 14px', fontSize:12, cursor:'pointer' }}>
                  Reset Cache
                </button>
              )}
            </div>
            {msg && <div style={{ fontSize:11, color:'var(--blue)', marginTop:8 }}>⏳ {msg}</div>}
          </div>

          {/* Session score */}
          {qs.length > 0 && answered.t > 0 && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 18px', marginBottom:14, display:'flex', gap:20, alignItems:'center' }}>
              <span style={{ fontSize:12, color:'var(--muted)' }}>Session:</span>
              <span style={{ color:'var(--green)', fontWeight:700 }}>✅ {answered.c}</span>
              <span style={{ color:'var(--pink)', fontWeight:700 }}>❌ {answered.t-answered.c}</span>
              <span style={{ color:'var(--orange)', fontWeight:700, fontFamily:'var(--mono)' }}>{Math.round(answered.c/answered.t*100)}%</span>
              {answered.t >= 5 && answered.c/answered.t >= 0.8 && (
                <span style={{ color:'var(--gold)', fontSize:11 }}>🔥 Crushing it! Next session will go harder.</span>
              )}
            </div>
          )}

          {qs.length > 0 && (
            <>
              <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>
                {qs.length} QUESTIONS — {chapter}
                {diff==='auto' && adaptDiff && <span style={{ color:'var(--orange)' }}> · ADAPTIVE: {adaptDiff.toUpperCase()}</span>}
              </div>
              {qs.map((q,i) => <QuestionCard key={q.id||i} q={q} idx={i} onAnswered={handleAnswered}/>)}
            </>
          )}
        </>
      )}

      {/* ── SEARCH TAB ── */}
      {tab==='search' && (
        <>
          <div className="glass" style={{ padding:'16px 20px', marginBottom:16 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search topic, concept, keyword… e.g. hybridisation, lac operon, first law"
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:8, padding:'11px 14px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'var(--font)' }}
              onFocus={e => e.target.style.borderColor='var(--orange)'}
              onBlur={e  => e.target.style.borderColor='var(--border)'}
            />
            {search.length > 0 && <div style={{ fontSize:11, color:'var(--dim)', marginTop:8 }}>{searchRes.length} results</div>}
          </div>
          {searchRes.length > 0
            ? searchRes.map((q,i) => <QuestionCard key={q.id||i} q={q} idx={i}/>)
            : search.length > 1 && (
              <div className="glass" style={{ padding:'40px', textAlign:'center', color:'var(--muted)' }}>
                <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
                No results for "{search}". Try the By Chapter tab.
              </div>
            )
          }
        </>
      )}

      {/* ── A-R TAB ── */}
      {tab==='ar' && (
        <>
          <div className="glass" style={{ padding:'14px 18px', marginBottom:18, fontSize:12, color:'var(--muted)', lineHeight:1.9 }}>
            <span style={{ color:'#AA88FF', fontWeight:700, display:'block', marginBottom:6 }}>Assertion-Reasoning — How to solve</span>
            <b style={{ color:'var(--text)' }}>A</b> — Both correct; Reason explains Assertion<br/>
            <b style={{ color:'var(--text)' }}>B</b> — Both correct; Reason does NOT explain<br/>
            <b style={{ color:'var(--text)' }}>C</b> — Assertion correct, Reason wrong<br/>
            <b style={{ color:'var(--text)' }}>D</b> — Assertion wrong
          </div>
          <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>{arQs.length} A-R QUESTIONS</div>
          {arQs.map((q,i) => <QuestionCard key={q.id||i} q={q} idx={i}/>)}
        </>
      )}
    </div>
  )
}
