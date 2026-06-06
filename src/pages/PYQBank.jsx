import { useState } from 'react'
import { PYQ, SC, ICONS, CHAPTERS } from '../data/pyqBank.js'

const tag = col => ({ background:col+'18', border:`1px solid ${col}30`, color:col, borderRadius:4, padding:'2px 8px', fontSize:11, display:'inline-block', fontWeight:500 })

const SUBJECTS = ['All', 'Chemistry', 'Physics', 'Biology']
const DIFFS    = ['All', 'easy', 'medium', 'hard']

export default function PYQBank() {
  const [subject,  setSubject]  = useState('All')
  const [diff,     setDiff]     = useState('All')
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState(null)
  const [yearFrom, setYearFrom] = useState(2006)
  const [yearTo,   setYearTo]   = useState(2026)

  const filtered = PYQ.filter(q => {
    if (subject !== 'All' && q.sub !== subject) return false
    if (diff !== 'All' && (q.d||q.diff) !== diff) return false
    if (yearFrom && (q.y||q.year) < yearFrom) return false
    if (yearTo   && (q.y||q.year) > yearTo)   return false
    if (search) {
      const s = search.toLowerCase()
      if (!q.q?.toLowerCase().includes(s) && !q.ch?.toLowerCase().includes(s)) return false
    }
    return true
  })

  const diffCol = d => d==='hard'?'var(--pink)':d==='medium'?'var(--gold)':'var(--green)'

  return (
    <div style={{ padding:'32px 36px', maxWidth:900, margin:'0 auto' }}>
      <style>{`button:hover{filter:brightness(1.1)} input::placeholder{color:var(--dim)}`}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>PYQ Bank</div>
        <div style={{ fontSize:13, color:'var(--muted)' }}>
          {PYQ.length} real NEET questions · 2006–2026 · All chapters covered
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {['Chemistry','Physics','Biology'].map(s => {
          const n = PYQ.filter(q=>q.sub===s).length
          return (
            <div key={s} style={{ background:'var(--card)', border:`1px solid ${SC[s]}20`, borderRadius:10, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:22 }}>{ICONS[s]}</span>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:SC[s], fontFamily:'var(--mono)' }}>{n}Q</div>
                <div style={{ fontSize:11, color:'var(--muted)' }}>{s}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px', marginBottom:20 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          {/* Search */}
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search questions or chapters…"
            style={{ flex:1, minWidth:180, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'var(--font)' }}
            onFocus={e=>e.target.style.borderColor='var(--orange)'}
            onBlur={e=>e.target.style.borderColor='var(--border)'}
          />
          {/* Subject filter */}
          <div style={{ display:'flex', gap:4 }}>
            {SUBJECTS.map(s=>(
              <button key={s} onClick={()=>setSubject(s)} style={{
                padding:'6px 12px', borderRadius:6, fontSize:12, fontWeight:subject===s?600:400,
                background:subject===s?(SC[s]||'var(--orange)')+'18':'var(--surface)',
                border:`1px solid ${subject===s?(SC[s]||'var(--orange)')+'50':'var(--border)'}`,
                color:subject===s?(SC[s]||'var(--orange)'):'var(--muted)'
              }}>{s}</button>
            ))}
          </div>
          {/* Difficulty */}
          <div style={{ display:'flex', gap:4 }}>
            {DIFFS.map(d=>(
              <button key={d} onClick={()=>setDiff(d)} style={{
                padding:'6px 12px', borderRadius:6, fontSize:12, fontWeight:diff===d?600:400,
                background:diff===d?diffCol(d)+'18':'var(--surface)',
                border:`1px solid ${diff===d?diffCol(d)+'50':'var(--border)'}`,
                color:diff===d?diffCol(d):'var(--muted)',
                textTransform:'capitalize'
              }}>{d}</button>
            ))}
          </div>
          {/* Year range */}
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--muted)' }}>
            <input type="number" value={yearFrom} onChange={e=>setYearFrom(+e.target.value)} min={2006} max={2026}
              style={{ width:56, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding:'6px 8px', fontSize:12, color:'var(--text)', outline:'none', fontFamily:'var(--mono)' }}/>
            <span>–</span>
            <input type="number" value={yearTo} onChange={e=>setYearTo(+e.target.value)} min={2006} max={2026}
              style={{ width:56, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding:'6px 8px', fontSize:12, color:'var(--text)', outline:'none', fontFamily:'var(--mono)' }}/>
          </div>
        </div>
        <div style={{ fontSize:11, color:'var(--dim)', marginTop:10 }}>
          Showing <span style={{ color:'var(--orange)', fontWeight:600, fontFamily:'var(--mono)' }}>{filtered.length}</span> of {PYQ.length} questions
        </div>
      </div>

      {/* Question list */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.length === 0 ? (
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'48px', textAlign:'center', color:'var(--muted)' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
            <div>No questions match your filters. Try adjusting them.</div>
          </div>
        ) : filtered.map((q,i) => {
          const isOpen = expanded === (q.id||i)
          const yr = q.y||q.year
          const dc = q.d||q.diff
          return (
            <div key={q.id||i}
              style={{ background:'var(--card)', border:`1px solid ${isOpen?'var(--orange)30':'var(--border)'}`, borderRadius:12, overflow:'hidden', transition:'border-color 0.15s' }}
            >
              {/* Question row */}
              <div
                onClick={()=>setExpanded(isOpen?null:(q.id||i))}
                style={{ padding:'14px 20px', cursor:'pointer', display:'flex', alignItems:'flex-start', gap:12 }}
              >
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:6, marginBottom:7, flexWrap:'wrap', alignItems:'center' }}>
                    <span style={tag(SC[q.sub]||'#888')}>{q.sub}</span>
                    <span style={{ fontSize:10, background:diffCol(dc)+'15', color:diffCol(dc), borderRadius:3, padding:'1px 6px', border:`1px solid ${diffCol(dc)}30`, textTransform:'capitalize' }}>{dc}</span>
                    {yr && <span style={{ fontSize:10, color:'var(--dim)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:3, padding:'1px 6px', fontFamily:'var(--mono)' }}>NEET {yr}</span>}
                    <span style={{ fontSize:10, color:'var(--dim)' }}>{q.ch}</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.65 }}>{q.q}</div>
                </div>
                <span style={{ color:'var(--dim)', fontSize:14, flexShrink:0, marginTop:2, transition:'transform 0.2s', transform:isOpen?'rotate(180deg)':'rotate(0deg)' }}>▾</span>
              </div>

              {/* Expanded answer */}
              {isOpen && (
                <div style={{ borderTop:'1px solid var(--border)', padding:'16px 20px', background:'var(--surface)' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:14 }}>
                    {['A','B','C','D'].map(opt => {
                      const isCorrect = q.a === opt
                      return (
                        <div key={opt} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'8px 10px', borderRadius:7, background:isCorrect?'var(--green)10':'var(--card)', border:`1px solid ${isCorrect?'var(--green)40':'var(--border)'}` }}>
                          <span style={{ fontSize:11, fontWeight:700, color:isCorrect?'var(--green)':'var(--dim)', fontFamily:'var(--mono)', flexShrink:0, marginTop:1 }}>{opt}</span>
                          <span style={{ fontSize:12, color:isCorrect?'var(--green)':'var(--muted)', lineHeight:1.5 }}>{q.o[opt]}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ background:'var(--bg)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>
                    💡 {q.e}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
