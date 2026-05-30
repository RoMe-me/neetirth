import { predictAIR } from '../lib/airPredictor.js'
import { SC, ICONS } from '../data/pyqBank.js'

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
const tag = col => ({ background:col+'20', border:`1px solid ${col}44`, color:col, borderRadius:4, padding:'2px 8px', fontSize:11, display:'inline-block' })

export default function Results({ user, results, history, onNewMock, onProgress }) {
  const { c, w, s, score, max, pct, wQs, cm } = results
  const scoreCol = pct >= 60 ? T.green : pct >= 40 ? '#FFAA00' : T.pink
  const pred = predictAIR(score)

  // Subject breakdown
  const subBreak = { Chemistry:{c:0,t:0}, Physics:{c:0,t:0}, Biology:{c:0,t:0} }
  Object.entries(cm).forEach(([,d]) => {
    if (subBreak[d.sub]) { subBreak[d.sub].c += d.c; subBreak[d.sub].t += d.t }
  })

  // Compare to personal best
  const prev = history.slice(0,-1)
  const prevBest = prev.length > 0 ? Math.max(...prev.map(m => m.pct)) : null

  // Chapters that need work
  const weakChs = Object.entries(cm)
    .filter(([,d]) => d.t > 0 && d.c/d.t < 0.5)
    .sort((a,b) => a[1].c/a[1].t - b[1].c/b[1].t)

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`*{box-sizing:border-box} button:hover{filter:brightness(1.2)} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#2A2A40}`}</style>

      {/* TOP */}
      <div style={{ background:'#0F0F1A', borderBottom:'1px solid #1E1E30', padding:'12px 28px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ fontSize:18, fontWeight:800, color:T.orange, letterSpacing:1 }}>नीतीर्थ</div>
        <div style={{ width:1, height:24, background:'#1E1E30' }}/>
        <span style={{ color:T.muted, fontSize:13 }}>Results</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
          <button onClick={onProgress} style={{ ...btn('#AA88FF'), padding:'7px 16px' }}>📊 Progress</button>
          <button onClick={onNewMock} style={{ ...btn(T.orange), padding:'7px 16px' }}>🎯 New Mock</button>
        </div>
      </div>

      <div style={{ padding:28, maxWidth:860, margin:'0 auto' }}>

        {/* ── SCORE CARD ── */}
        <div style={{ ...T.card, textAlign:'center', marginBottom:20, borderColor:scoreCol+'40', background:scoreCol+'06' }}>
          <div style={{ fontSize:80, fontWeight:800, color:scoreCol, lineHeight:1 }}>{score}</div>
          <div style={{ color:T.muted, fontSize:14, marginTop:4 }}>out of {max} · {pct}% · {results.c+results.w+results.s} questions</div>
          {prevBest !== null && (
            <div style={{ marginTop:8, fontSize:13, color: pct>prevBest?T.green:pct<prevBest?T.pink:'#FFAA00' }}>
              {pct>prevBest ? `📈 New personal best! (+${pct-prevBest}%)` : pct<prevBest ? `📉 ${pct-prevBest}% vs your best (${prevBest}%)` : '= Matched your personal best'}
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'center', gap:40, marginTop:20 }}>
            {[['✅',c,'+4 each',T.green],['❌',w,'−1 each',T.pink],['⭕',s,'0 marks',T.muted]].map(([ic,n,lbl,col]) => (
              <div key={lbl} style={{ textAlign:'center' }}>
                <div style={{ fontSize:32, fontWeight:700, color:col }}>{n}</div>
                <div style={{ fontSize:11, color:T.dim }}>{ic} {lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AIR PREDICTION ── */}
        <div style={{ ...T.card, marginBottom:20, borderColor:pred.color+'40' }}>
          <div style={{ fontSize:10, color:T.dim, letterSpacing:2, marginBottom:14 }}>🎯 AIR PREDICTION — NEET 2027</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:T.muted, marginBottom:4 }}>Predicted AIR</div>
              <div style={{ fontSize:22, fontWeight:800, color:pred.color }}>{pred.airLow.toLocaleString()}–{pred.airHigh.toLocaleString()}</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:T.muted, marginBottom:4 }}>Percentile</div>
              <div style={{ fontSize:22, fontWeight:800, color:pred.color }}>{pred.percentile}th</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:T.muted, marginBottom:4 }}>College Tier</div>
              <div style={{ fontSize:14, fontWeight:700, color:pred.color, marginTop:4 }}>{pred.tier}</div>
            </div>
          </div>
          <div style={{ marginTop:12, padding:'10px 14px', background:'#0A0A14', borderRadius:8, fontSize:12, color:T.muted, lineHeight:1.7 }}>
            📌 {pred.college}<br/>
            <span style={{ fontSize:10, color:T.dim }}>Based on NTA 2025 official marks vs AIR data. Adjusted for ~26L candidates expected in NEET 2027.</span>
          </div>
        </div>

        {/* ── SUBJECT BREAKDOWN ── */}
        {Object.values(subBreak).some(d => d.t > 0) && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
            {Object.entries(subBreak).filter(([,d]) => d.t > 0).map(([subj,d]) => {
              const a = Math.round(d.c/d.t*100)
              const col = a>=60?T.green:a>=40?'#FFAA00':T.pink
              return (
                <div key={subj} style={{ ...T.card, textAlign:'center', borderColor:(SC[subj]||'#888')+'40' }}>
                  <div style={{ fontSize:24 }}>{ICONS[subj]}</div>
                  <div style={{ color:SC[subj], fontSize:12, marginTop:4 }}>{subj}</div>
                  <div style={{ color:col, fontSize:26, fontWeight:700 }}>{a}%</div>
                  <div style={{ color:T.dim, fontSize:10 }}>{d.c}/{d.t} correct</div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── CHAPTER BREAKDOWN ── */}
        {Object.keys(cm).length > 0 && (
          <div style={{ ...T.card, marginBottom:20 }}>
            <div style={{ fontSize:10, color:T.dim, letterSpacing:2, marginBottom:14 }}>CHAPTER ACCURACY — weakest first</div>
            {Object.entries(cm).sort((a,b) => (a[1].c/a[1].t)-(b[1].c/b[1].t)).map(([ch,d]) => {
              const a = d.t > 0 ? Math.round(d.c/d.t*100) : 0
              const col = a>=60?T.green:a>=40?'#FFAA00':T.pink
              return (
                <div key={ch} style={{ padding:'8px 0', borderBottom:'1px solid #141420' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ background:(SC[d.sub]||'#888')+'20', border:`1px solid ${SC[d.sub]||'#888'}44`, color:SC[d.sub]||'#888', borderRadius:4, padding:'1px 6px', fontSize:10 }}>{d.sub.slice(0,4)}</span>
                      <span style={{ fontSize:12, color:T.text }}>{ch}</span>
                    </div>
                    <span style={{ fontSize:12, color:col, fontWeight:700 }}>{d.c}/{d.t} ({a}%)</span>
                  </div>
                  <div style={{ height:3, background:'#1A1A2A', borderRadius:2 }}>
                    <div style={{ height:3, width:`${a}%`, background:col, borderRadius:2 }}/>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── NEEDS WORK ── */}
        {weakChs.length > 0 && (
          <div style={{ ...T.card, marginBottom:20, borderColor:T.pink+'30' }}>
            <div style={{ fontSize:10, color:T.pink, letterSpacing:2, marginBottom:12 }}>⚠ CHAPTERS NEEDING ATTENTION</div>
            {weakChs.map(([ch,d]) => (
              <div key={ch} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #141420', fontSize:12 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={tag(SC[d.sub]||'#888')}>{d.sub}</span>
                  <span style={{ color:T.text }}>{ch}</span>
                </div>
                <span style={{ color:T.pink }}>{Math.round(d.c/d.t*100)}%</span>
              </div>
            ))}
          </div>
        )}

        {/* ── WRONG ANSWERS ── */}
        {wQs.length > 0 && (
          <div style={T.card}>
            <div style={{ fontSize:10, color:T.dim, letterSpacing:2, marginBottom:14 }}>WRONG ANSWERS — REVIEW EACH ONE</div>
            {wQs.map((q,i) => (
              <div key={i} style={{ padding:'16px 0', borderBottom:'1px solid #141420' }}>
                <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                  <span style={tag(SC[q.subject]||'#888')}>{q.subject}</span>
                  <span style={{ fontSize:11, color:T.dim }}>{q.chapter}</span>
                  {q.year && <span style={tag('#505070')}>NEET {q.year}</span>}
                </div>
                <div style={{ fontSize:14, color:'#D0D0E8', marginBottom:10, lineHeight:1.7 }}>
                  <span style={{ color:T.dim, marginRight:8 }}>Q{q.idx+1}.</span>{q.question}
                </div>
                <div style={{ display:'flex', gap:20, fontSize:13, flexWrap:'wrap', marginBottom:10 }}>
                  <span style={{ color:T.pink }}>✗ Your answer: ({q.ua}) {q.options[q.ua]}</span>
                  <span style={{ color:T.green }}>✓ Correct: ({q.correct}) {q.options[q.correct]}</span>
                </div>
                <div style={{ padding:'10px 14px', background:'#0A0A14', borderRadius:8, fontSize:12, color:'#909090', lineHeight:1.7 }}>
                  💡 {q.explanation}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
