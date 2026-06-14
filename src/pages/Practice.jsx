import { useState, memo } from 'react'
import { PRACTICE, getPracticeQs, getPracticeStats, searchPractice } from '../data/practiceBank.js'
import { SC, ICONS } from '../data/pyqBank.js'
import LiquidBlock, { LiquidTag, LiquidBadge } from '../components/LiquidBlock.jsx'

const diffCol = d => d==='hard'?'var(--pink)':d==='medium'?'var(--gold)':'var(--green)'
const SUBJECTS = ['All','Chemistry','Physics','Biology']
const DIFFS    = ['All','easy','medium','hard']
const TYPES    = ['All','mcq','ar']

const QuestionCard = memo(function QuestionCard({ q, idx }) {
  const [sel,    setSel]    = useState(null)
  const [shown,  setShown]  = useState(false)
  const isAR = q.type === 'ar'

  return (
    <div className="glass glass-card" style={{ padding:'20px 24px', marginBottom:10 }}>
      {/* Tags */}
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
      </div>

      {/* Question */}
      <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.8, marginBottom:14, whiteSpace:'pre-line' }}>
        <span style={{ color:'var(--dim)', marginRight:6, fontFamily:'var(--mono)', fontSize:11 }}>Q{idx+1}.</span>
        {q.q}
      </div>

      {/* Options */}
      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
        {['A','B','C','D'].map(opt => {
          const correct = q.a === opt
          const isSel   = sel === opt
          let bg = 'rgba(255,255,255,0.03)', border = 'var(--border)', col = 'var(--muted)'
          if (isSel && !shown)               { bg='rgba(255,107,0,0.10)';  border='rgba(255,107,0,0.40)';  col='var(--orange)' }
          if (shown && correct)              { bg='rgba(0,229,170,0.10)';  border='rgba(0,229,170,0.40)';  col='var(--green)'  }
          if (shown && isSel && !correct)    { bg='rgba(255,77,141,0.10)'; border='rgba(255,77,141,0.40)'; col='var(--pink)'   }
          return (
            <div key={opt} onClick={() => { if (!shown) setSel(opt) }}
              style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'9px 12px', borderRadius:8, background:bg, border:`1px solid ${border}`, cursor:shown?'default':'pointer', transition:'all 0.12s' }}>
              <span style={{ fontSize:11, fontWeight:700, color:col, fontFamily:'var(--mono)', flexShrink:0, marginTop:1 }}>{opt}</span>
              <span style={{ fontSize:12, color:col, lineHeight:1.6 }}>{q.o[opt]}</span>
            </div>
          )
        })}
      </div>

      {/* Action */}
      {!shown ? (
        <button onClick={() => setShown(true)} disabled={!sel}
          style={{ background:sel?'var(--orange)':'var(--border)', border:'none', color:sel?'#fff':'var(--dim)', borderRadius:7, padding:'7px 18px', fontSize:12, fontWeight:600, cursor:sel?'pointer':'default', opacity:sel?1:0.5 }}>
          Check Answer
        </button>
      ) : (
        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--muted)', lineHeight:1.7, borderLeft:`3px solid ${sel===q.a?'var(--green)':'var(--pink)'}` }}>
          {sel===q.a ? '✅ Correct — ' : `❌ Wrong (Correct: ${q.a}) — `}{q.e}
        </div>
      )}
    </div>
  )
})

export default function Practice() {
  const [subject,  setSubject]  = useState('All')
  const [diff,     setDiff]     = useState('All')
  const [type,     setType]     = useState('All')
  const [count,    setCount]    = useState(20)
  const [search,   setSearch]   = useState('')
  const [tab,      setTab]      = useState('practice')
  const [qs,       setQs]       = useState([])
  const [loaded,   setLoaded]   = useState(false)

  const stats = getPracticeStats()
  const arQs  = PRACTICE.filter(q => q.type === 'ar')
  const searchResults = search.length > 1 ? searchPractice(search, subject==='All'?null:subject) : []

  const load = () => {
    try {
      const result = getPracticeQs({
        subject:    subject==='All'    ? null : subject,
        difficulty: diff==='All'       ? null : diff,
        type:       type==='All'       ? null : type,
        count,
      })
      setQs(result)
      setLoaded(true)
    } catch(e) { alert(e.message) }
  }

  const FilterBtn = ({ active, col, onClick, children }) => (
    <button onClick={onClick} style={{ padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:active?600:400, background:active?col+'18':'rgba(255,255,255,0.04)', border:`1px solid ${active?col+'50':'var(--border)'}`, color:active?col:'var(--muted)', transition:'all 0.12s' }}>
      {children}
    </button>
  )

  return (
    <div className="page-in" style={{ padding:'32px 36px', maxWidth:860, margin:'0 auto' }}>
      <style>{`button:hover{filter:brightness(1.1)} input::placeholder{color:var(--dim)}`}</style>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Practice Questions</div>
        <div style={{ fontSize:13, color:'var(--muted)' }}>
          {stats.total} questions · MCQ + Assertion-Reasoning · Never mixed with PYQ bank
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        {[
          { v:stats.total,                              l:'Total Questions', c:'var(--orange)' },
          { v:stats.byType?.mcq  || 0,                 l:'MCQ',            c:'var(--blue)'   },
          { v:stats.byType?.ar   || 0,                 l:'A-R Type',       c:'#AA88FF'       },
          { v:Object.keys(stats.byChapter||{}).length, l:'Chapters',       c:'var(--green)'  },
        ].map(s => (
          <LiquidBlock key={s.l} fillColor={s.c+'22'} fillHeight={38} style={{ padding:'14px 18px' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.c, fontFamily:'var(--mono)' }}>{s.v}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{s.l}</div>
          </LiquidBlock>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, marginBottom:20, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:4, width:'fit-content', border:'1px solid var(--border)' }}>
        {[['practice','Practice'],['search','Search'],['ar','Assertion-Reasoning']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'7px 16px', borderRadius:7, fontSize:12, fontWeight:tab===id?600:400, background:tab===id?'var(--card)':'none', border:tab===id?'1px solid var(--border)':'1px solid transparent', color:tab===id?'var(--text)':'var(--muted)', transition:'all 0.12s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── PRACTICE TAB ── */}
      {tab==='practice' && (
        <>
          <div className="glass" style={{ padding:'18px 20px', marginBottom:20 }}>
            {/* Filters */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
              <div style={{ display:'flex', gap:4 }}>
                {SUBJECTS.map(s => <FilterBtn key={s} active={subject===s} col={SC[s]||'var(--orange)'} onClick={()=>setSubject(s)}>{s}</FilterBtn>)}
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {DIFFS.map(d => <FilterBtn key={d} active={diff===d} col={diffCol(d)} onClick={()=>setDiff(d)} style={{ textTransform:'capitalize' }}>{d==='All'?'All Levels':d}</FilterBtn>)}
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {TYPES.map(t => <FilterBtn key={t} active={type===t} col="#AA88FF" onClick={()=>setType(t)}>{t==='All'?'All Types':t.toUpperCase()}</FilterBtn>)}
              </div>
            </div>
            {/* Count */}
            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:12, color:'var(--muted)' }}>Count:</span>
              {[10,20,30,50].map(n => <FilterBtn key={n} active={count===n} col="var(--orange)" onClick={()=>setCount(n)}>{n}Q</FilterBtn>)}
            </div>
            <button onClick={load}
              style={{ background:'var(--orange)', border:'none', color:'#fff', borderRadius:8, padding:'10px 24px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              Load Questions →
            </button>
          </div>

          {loaded && qs.length > 0 && (
            <div>
              <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>
                {qs.length} QUESTIONS LOADED — {subject==='All'?'All Subjects':subject} · {diff==='All'?'All Levels':diff} · {type==='All'?'All Types':type.toUpperCase()}
              </div>
              {qs.map((q,i) => <QuestionCard key={q.id} q={q} idx={i}/>)}
            </div>
          )}

          {loaded && qs.length === 0 && (
            <div className="glass" style={{ padding:'48px', textAlign:'center', color:'var(--muted)' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
              <div>No questions match your filters. Try adjusting subject, difficulty or type.</div>
            </div>
          )}
        </>
      )}

      {/* ── SEARCH TAB ── */}
      {tab==='search' && (
        <>
          <div className="glass" style={{ padding:'16px 20px', marginBottom:16 }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by topic, keyword, chapter… e.g. hybridisation, refraction, lac operon"
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:8, padding:'11px 14px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'var(--font)' }}
              onFocus={e => e.target.style.borderColor='var(--orange)'}
              onBlur={e  => e.target.style.borderColor='var(--border)'}
            />
            {search.length > 0 && (
              <div style={{ fontSize:11, color:'var(--dim)', marginTop:8 }}>
                {searchResults.length} result{searchResults.length!==1?'s':''} in practice bank
              </div>
            )}
          </div>
          {searchResults.length > 0
            ? searchResults.map((q,i) => <QuestionCard key={q.id} q={q} idx={i}/>)
            : search.length > 1 && (
              <div className="glass" style={{ padding:'40px', textAlign:'center', color:'var(--muted)' }}>
                <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
                No results for "{search}". Try a different keyword.
              </div>
            )
          }
        </>
      )}

      {/* ── A-R TAB ── */}
      {tab==='ar' && (
        <>
          <div className="glass" style={{ padding:'14px 18px', marginBottom:18, fontSize:12, color:'var(--muted)', lineHeight:1.9 }}>
            <span style={{ color:'#AA88FF', fontWeight:700, display:'block', marginBottom:6 }}>How to solve A-R questions</span>
            <span style={{ color:'var(--text)', fontWeight:600 }}>Option A</span> — Both Assertion and Reason correct; Reason correctly explains Assertion<br/>
            <span style={{ color:'var(--text)', fontWeight:600 }}>Option B</span> — Both correct; Reason does NOT explain Assertion<br/>
            <span style={{ color:'var(--text)', fontWeight:600 }}>Option C</span> — Assertion correct, Reason wrong<br/>
            <span style={{ color:'var(--text)', fontWeight:600 }}>Option D</span> — Assertion wrong (Reason may be right or wrong)
          </div>
          <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>{arQs.length} ASSERTION-REASONING QUESTIONS</div>
          {arQs.map((q,i) => <QuestionCard key={q.id} q={q} idx={i}/>)}
        </>
      )}
    </div>
  )
}
