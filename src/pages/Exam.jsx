import LiquidBlock from '../components/LiquidBlock.jsx'
import { useState, useEffect, useRef, useMemo } from 'react'
import { saveResume, clearResume, updateWeakness, getHistory, saveHistory, getResume } from '../lib/storage.js'
import { SC } from '../data/pyqBank.js'

const T = {
  bg:'var(--bg)', card:{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:16 },
  orange:'var(--orange)', blue:'var(--blue)', pink:'var(--pink)', green:'var(--green)',
  text:'var(--text)', muted:'var(--muted)', dim:'var(--dim)',
}
const btn = (col='#FF6B00', full=false) => ({
  background:col+'18', border:`1px solid ${col}55`, color:col,
  borderRadius:8, padding:'8px 16px', cursor:'pointer',
  fontFamily:'inherit', fontSize:13, fontWeight:600, width:full?'100%':'auto'
})

export default function Exam({ user, examData, resumeInfo, onFinish, onSaveResume, onHome }) {
  // Fresh examData ALWAYS wins when a new mock was just started — never let a
  // stale/abandoned resume silently hijack a brand-new mock the user just picked.
  // Resume is only used as a fallback (e.g. reopening the app later via Home's
  // "Resume?" card with no fresh examData in memory).
  const initState = () => {
    if (examData && Array.isArray(examData.qs) && examData.qs.length > 0) {
      // Validate every question has a usable options object before trusting it —
      // one malformed cached/generated question should never blank the whole exam.
      const validQs = examData.qs.filter(q =>
        q && q.options && typeof q.options === 'object' &&
        ['A','B','C','D'].every(k => q.options[k] != null)
      )
      if (validQs.length > 0) {
        return {
          qs: validQs, ans: {}, marked: new Set(),
          cur: 0, timeLeft: examData.timeLimit, cfg: examData.cfg
        }
      }
      // Fresh data existed but every question was malformed — fall through to
      // resume/empty rather than rendering a guaranteed-blank screen.
    }
    const r = getResume()
    if (r && r.qs?.length > 0) {
      const validQs = r.qs.filter(q =>
        q && q.options && typeof q.options === 'object' &&
        ['A','B','C','D'].every(k => q.options[k] != null)
      )
      if (validQs.length > 0) {
        return {
          qs: validQs, ans: r.ans || {}, marked: new Set(r.marked || []),
          cur: Math.min(r.cur || 0, validQs.length - 1), timeLeft: r.timeLeft || 3600, cfg: r.cfg
        }
      }
      // Stale resume itself is corrupted — discard it instead of loading it forever.
      clearResume()
    }
    return { qs: [], ans: {}, marked: new Set(), cur: 0, timeLeft: 3600, cfg: {} }
  }

  const init = initState()
  const [qs] = useState(init.qs)
  const [ans, setAns] = useState(init.ans)
  const [marked, setMarked] = useState(init.marked)
  const [cur, setCur] = useState(init.cur)
  const [timeLeft, setTime] = useState(init.timeLeft)
  const [cfg] = useState(init.cfg)
  const [paused, setPaused] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const timerRef    = useRef(null)
  const autoSaveRef = useRef(null)
  const submitRef   = useRef(false)
  const snapshotRef = useRef(null)
  const timeMap     = useRef({})        // { questionIndex: totalSeconds }
  const qStartTime  = useRef(Date.now()) // when current Q was last opened

  const fmt = s => {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  // Record elapsed time on current question before navigating away
  const recordTime = (idx) => {
    if (!paused) {
      const elapsed = Math.floor((Date.now() - qStartTime.current) / 1000)
      timeMap.current[idx] = (timeMap.current[idx] || 0) + elapsed
    }
    qStartTime.current = Date.now()
  }

  // Navigate to a question, recording time on the current one first
  const navigateTo = (newIdx) => {
    recordTime(cur)
    setCur(newIdx)
  }

  // Timer: create one interval per pause/resume, not one new interval per
  // second. The previous dependency on timeLeft caused unnecessary work and
  // made timer behaviour harder to reason about.
  useEffect(() => {
    clearInterval(timerRef.current)
    if (!paused && timeLeft > 0) {
      timerRef.current = setInterval(() => setTime(value => Math.max(0, value - 1)), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [paused])

  useEffect(() => { if (timeLeft <= 0 && !submitRef.current) doSubmit() }, [timeLeft])

  // Keep the latest state in a ref, then persist at a calm 15-second cadence.
  // This protects mobile devices from a localStorage write every timer tick.
  useEffect(() => {
    snapshotRef.current = { qs, ans, marked:[...marked], cur, timeLeft, cfg, savedAt:new Date().toISOString() }
  }, [qs, ans, marked, cur, timeLeft, cfg])

  useEffect(() => {
    const persist = () => { if (snapshotRef.current && !submitRef.current) saveResume(snapshotRef.current) }
    autoSaveRef.current = setInterval(persist, 15000)
    window.addEventListener('beforeunload', persist)
    return () => { clearInterval(autoSaveRef.current); window.removeEventListener('beforeunload', persist) }
  }, [qs])

  const doSubmit = () => {
    if (submitRef.current) return
    submitRef.current = true
    clearInterval(timerRef.current)
    clearInterval(autoSaveRef.current)
    recordTime(cur) // record time on last viewed question
    let c = 0, w = 0, s = 0
    const wQs = [], cm = {}
    qs.forEach((q, i) => {
      const a = ans[i]
      if (!cm[q.chapter]) cm[q.chapter] = { c:0, w:0, t:0, sub:q.subject }
      cm[q.chapter].t++
      if (!a) s++
      else if (a === q.correct) { c++; cm[q.chapter].c++ }
      else { w++; cm[q.chapter].w++; wQs.push({ ...q, ua:a, idx:i }) }
    })
    const newWeakness = updateWeakness(cm)
    const score = c*4 - w
    const max = qs.length * 4
    const pct = max > 0 ? Math.round(score/max*100) : 0
    const rec = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: cfg?.isFull ? 'Full NEET' : cfg?.subject || 'Mixed',
      subject: cfg?.subject || 'Mixed',
      n: qs.length, score, max, pct, c, w, s, cm
    }
    const newHistory = [...getHistory(), rec]
    saveHistory(newHistory)
    clearResume()
    onFinish({ c, w, s, score, max, pct, wQs, cm, rec, timeMap: {...timeMap.current}, qs: [...qs] }, newHistory, newWeakness)
  }

  const saveAndGoHome = () => {
    if (submitRef.current) return
    clearInterval(timerRef.current)
    recordTime(cur)
    const resume = { qs, ans, marked:[...marked], cur, timeLeft, cfg, savedAt:new Date().toISOString() }
    saveResume(resume)
    onSaveResume?.(resume)
    onHome()
  }

  const q = qs[cur]
  if (!q) {
    return (
      <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'var(--bg)', color:'var(--text)', padding:24, textAlign:'center' }}>
        <div>
          <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
          <div style={{ fontWeight:700, marginBottom:6 }}>This mock could not be opened</div>
          <div style={{ color:'var(--muted)', fontSize:12, marginBottom:16 }}>No valid questions were found. Your saved progress was not changed.</div>
          <button onClick={onHome} style={{ background:'var(--orange)', color:'#fff', border:0, borderRadius:9, padding:'10px 18px', fontWeight:700 }}>Back to dashboard</button>
        </div>
      </div>
    )
  }
  const answered = Object.keys(ans).length
  const liveScore = Object.keys(ans).filter(i => ans[i] === qs[+i]?.correct).length * 4
    - Object.keys(ans).filter(i => ans[i] && ans[i] !== qs[+i]?.correct).length
  const qColor = i => marked.has(i) ? '#FFAA00' : ans[i] ? T.green : '#1E1E30'

  // Section ranges for full mock
  const sections = cfg?.isFull ? [
    { label:'Physics',   col:T.blue,   start:0,  end:Math.min(44, qs.length-1) },
    { label:'Chemistry', col:T.orange, start:45, end:Math.min(89, qs.length-1) },
    { label:'Biology',   col:T.pink,   start:90, end:qs.length-1 },
  ].filter(s => s.start < qs.length) : []

  return (
    <div className="page-in exam-shell" style={{ height:'100vh', display:'grid', gridTemplateRows:'52px 1fr 50px', background:'var(--bg)', color:T.text, fontFamily:"'Segoe UI',system-ui,sans-serif", overflow:'hidden' }}>
      <style>{`*{box-sizing:border-box} button:hover{filter:brightness(1.2)} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#2A2A40}`}</style>

      {/* ── TOP BAR ── */}
      <div style={{ background:'#0F0F1A', borderBottom:'1px solid #1E1E30', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <LiquidBlock
            fillColor={paused?'rgba(255,170,0,0.18)':timeLeft<300?'rgba(255,60,60,0.20)':'rgba(0,229,170,0.18)'}
            fillHeight={useMemo(()=>Math.max(5,Math.round(timeLeft/(cfg?.isFull?12000:qs.length*72)*70)),[Math.floor(timeLeft/5),cfg?.isFull,qs.length])}
            ripple={false}
            style={{ padding:'6px 14px', minWidth:100, borderRadius:10 }}
          >
            <div style={{
              color: paused ? '#FFAA00' : timeLeft<300 ? 'var(--pink)' : 'var(--green)',
              fontSize:20, fontWeight:800, fontFamily:'var(--mono)'
            }}>
              {paused ? '⏸ PAUSED' : fmt(timeLeft)}
            </div>
          </LiquidBlock>
          <button onClick={() => { if(paused) qStartTime.current = Date.now(); setPaused(p => !p) }} style={{ ...btn(paused?'#FFAA00':'#505070'), padding:'5px 12px', fontSize:12 }}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
        <div style={{ fontSize:12, color:T.muted, textAlign:'center' }}>
          <span style={{ color:T.text }}>{cur+1}</span>/{qs.length} ·{' '}
          <span style={{ color:T.green }}>{answered}</span> answered ·{' '}
          <span style={{ color:'#FFAA00' }}>{marked.size}</span> marked ·{' '}
          <span style={{ color:T.green, fontWeight:700 }}>Score: {liveScore}</span>
        </div>
        <button onClick={() => setShowSubmit(true)} style={{ ...btn(T.pink), padding:'6px 20px' }}>
          Submit
        </button>
      </div>

      {/* ── MAIN ── */}
      <div className="exam-main" style={{ display:'grid', gridTemplateColumns:'1fr 220px', overflow:'hidden' }}>

        {/* Question panel */}
        <div className="exam-question" style={{ padding:20, overflowY:'auto' }}>
          {paused ? (
            <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, color:T.muted }}>
              <div style={{ fontSize:56 }}>⏸</div>
              <div style={{ fontSize:18, color:'#FFAA00', fontWeight:700 }}>Mock Paused</div>
              <div style={{ fontSize:13, textAlign:'center', lineHeight:2 }}>
                Timer stopped. All answers saved safely.<br/>
                <span style={{ color:T.dim, fontSize:11 }}>Auto-saves every 15 seconds.</span>
              </div>
              <button onClick={() => { qStartTime.current = Date.now(); setPaused(false) }} style={{ ...btn(T.green), padding:'12px 32px', fontSize:14 }}>▶ Resume Mock</button>
              <button onClick={saveAndGoHome} style={{ ...btn('#505070'), padding:'8px 24px', fontSize:12 }}>
                💾 Save & Go Home
              </button>
            </div>
          ) : (
            <>
              {/* Tags */}
              <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
                <span style={{ background:(SC[q.subject]||'#888')+'20', border:`1px solid ${SC[q.subject]||'#888'}44`, color:SC[q.subject]||'#888', borderRadius:4, padding:'2px 8px', fontSize:11 }}>{q.subject}</span>
                <span style={{ background:(q.difficulty==='hard'?T.pink:q.difficulty==='medium'?'#FFAA00':T.green)+'20', border:`1px solid ${q.difficulty==='hard'?T.pink:q.difficulty==='medium'?'#FFAA00':T.green}44`, color:q.difficulty==='hard'?T.pink:q.difficulty==='medium'?'#FFAA00':T.green, borderRadius:4, padding:'2px 8px', fontSize:11 }}>{q.difficulty}</span>
                {q.pyq
                  ? <span style={{ background:'#AA88FF20', border:'1px solid #AA88FF44', color:'#AA88FF', borderRadius:4, padding:'2px 8px', fontSize:11 }}>PYQ {q.year||''}</span>
                  : <span style={{ background:'#64AEFF14', border:'1px solid #64AEFF38', color:'var(--blue)', borderRadius:4, padding:'2px 8px', fontSize:11 }}>{q.source || 'Practice'}</span>}
                <span style={{ color:T.dim, fontSize:11, alignSelf:'center' }}>{q.chapter}</span>
              </div>

              {/* Question */}
              <div style={{ ...T.card, fontSize:15, lineHeight:1.8, marginBottom:18, borderColor:'#252535' }}>
                <span style={{ color:T.dim, marginRight:8, fontWeight:700 }}>Q{cur+1}.</span>{q.question}
              </div>

              {/* Options */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {['A','B','C','D'].map(opt => {
                  const sel = ans[cur] === opt
                  const col = SC[q.subject] || T.green
                  return (
                    <div key={opt}
                      onClick={() => setAns(prev => ({ ...prev, [cur]: opt }))}
                      style={{ ...T.card, cursor:'pointer', display:'flex', alignItems:'center', gap:12, borderColor:sel?col:'#1E1E30', background:sel?col+'15':'#0F0F1A', transition:'all 0.12s' }}
                      onMouseEnter={e => { if(!sel) e.currentTarget.style.borderColor='#2A2A40' }}
                      onMouseLeave={e => { if(!sel) e.currentTarget.style.borderColor='#1E1E30' }}
                    >
                      <div style={{ width:30, height:30, borderRadius:'50%', border:`2px solid ${sel?col:'#2A2A40'}`, color:sel?col:T.muted, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>{opt}</div>
                      <span style={{ fontSize:14, color:sel?T.text:'#B0B0C8', lineHeight:1.6 }}>{q.options[opt]}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Sidebar palette */}
        <div className="exam-palette" style={{ borderLeft:'1px solid #1E1E30', background:'#0D0D18', padding:12, overflowY:'auto' }}>
          {cfg?.isFull ? (
            sections.map(sec => (
              <div key={sec.label} style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, color:sec.col, letterSpacing:1, marginBottom:5 }}>{sec.label.toUpperCase()}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                  {qs.slice(sec.start, sec.end+1).map((_, j) => {
                    const i = sec.start + j
                    const c = qColor(i)
                    return (
                      <div key={i} onClick={() => navigateTo(i)} style={{ width:22, height:22, borderRadius:4, border:`1px solid ${c}`, background:c+'20', color:i===cur?T.text:T.muted, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, cursor:'pointer', fontWeight:i===cur?'700':'normal' }}>
                        {i+1}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <>
              <div style={{ fontSize:10, color:T.dim, letterSpacing:1, marginBottom:8 }}>QUESTIONS</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {qs.map((_, i) => {
                  const c = qColor(i)
                  return (
                    <div key={i} onClick={() => navigateTo(i)} style={{ width:28, height:28, borderRadius:5, border:`1px solid ${c}`, background:c+'20', color:i===cur?T.text:T.muted, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, cursor:'pointer', fontWeight:i===cur?'700':'normal' }}>
                      {i+1}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Legend */}
          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:5 }}>
            {[[T.green,'Answered'],['#FFAA00','Marked'],['#1E1E30','Skipped']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:10, height:10, background:c+'25', border:`1px solid ${c}`, borderRadius:2 }}/>
                <span style={{ color:T.dim, fontSize:10 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{ background:'#0F0F1A', borderTop:'1px solid #1E1E30', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={() => navigateTo(Math.max(0,cur-1))} disabled={cur===0} style={{ ...btn('#505070'), opacity:cur===0?0.25:1, padding:'6px 18px' }}>← Prev</button>
        <div style={{ display:'flex', gap:8 }}>
          <button
            onClick={() => setMarked(prev => { const n=new Set(prev); n.has(cur)?n.delete(cur):n.add(cur); return n })}
            style={{ ...btn(marked.has(cur)?'#FFAA00':'#505070'), padding:'6px 14px' }}
          >
            {marked.has(cur) ? '★ Marked' : '☆ Mark'}
          </button>
          {ans[cur] && (
            <button onClick={() => setAns(prev => { const n={...prev}; delete n[cur]; return n })} style={{ ...btn(T.pink), padding:'6px 12px' }}>Clear</button>
          )}
        </div>
        <button onClick={() => navigateTo(Math.min(qs.length-1,cur+1))} disabled={cur===qs.length-1} style={{ ...btn(T.green), opacity:cur===qs.length-1?0.25:1, padding:'6px 18px' }}>Next →</button>
      </div>

      {/* ── SUBMIT MODAL ── */}
      {showSubmit && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ ...T.card, maxWidth:400, width:'90%', textAlign:'center', borderColor:T.pink+'55', padding:36 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Submit Mock?</div>
            <div style={{ fontSize:13, color:T.muted, marginBottom:6 }}>
              {answered} answered · {qs.length-answered} skipped · {marked.size} marked
            </div>
            <div style={{ fontSize:12, color:T.dim, marginBottom:24 }}>
              Unanswered questions get 0 marks. This cannot be undone.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowSubmit(false)} style={{ ...btn('#505070',true), padding:12 }}>Cancel</button>
              <button onClick={() => { setShowSubmit(false); doSubmit() }} style={{ ...btn(T.pink,true), padding:12, fontWeight:700 }}>✓ Submit Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
