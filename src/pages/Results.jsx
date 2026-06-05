import { predictAIR } from '../lib/airPredictor.js'
import { SC, ICONS } from '../data/pyqBank.js'

const tag = col => ({ background:col+'18', border:`1px solid ${col}30`, color:col, borderRadius:4, padding:'2px 8px', fontSize:11, display:'inline-block', fontWeight:500 })

export default function Results({ user, results, history, onNewMock, onProgress }) {
  const { c, w, s, score, max, pct, wQs, cm } = results
  const scoreCol = pct>=60?'var(--green)':pct>=40?'var(--gold)':'var(--pink)'
  const pred = predictAIR(score)
  const prev = history.slice(0,-1)
  const prevBest = prev.length>0 ? Math.max(...prev.map(m=>m.pct)) : null
  const subBreak = {Chemistry:{c:0,t:0},Physics:{c:0,t:0},Biology:{c:0,t:0}}
  Object.entries(cm).forEach(([,d])=>{ if(subBreak[d.sub]){subBreak[d.sub].c+=d.c;subBreak[d.sub].t+=d.t} })

  return (
    <div style={{ padding:'32px 36px', maxWidth:820, margin:'0 auto' }}>
      <style>{`button:hover{filter:brightness(1.12)}`}</style>

      {/* Top actions */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700 }}>Mock Results</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onProgress} style={{ background:'var(--card)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:500 }}>View Progress</button>
          <button onClick={onNewMock} style={{ background:'var(--orange)', border:'none', color:'#fff', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:600 }}>New Mock →</button>
        </div>
      </div>

      {/* Score hero */}
      <div style={{ background:'var(--card)', border:`1px solid ${scoreCol}25`, borderRadius:16, padding:'32px', marginBottom:20, textAlign:'center' }}>
        <div style={{ fontSize:80, fontWeight:800, color:scoreCol, lineHeight:1, fontFamily:'var(--mono)' }}>{score}</div>
        <div style={{ fontSize:14, color:'var(--muted)', marginTop:6 }}>out of {max} &nbsp;·&nbsp; {pct}% &nbsp;·&nbsp; {c+w+s} questions</div>
        {prevBest!==null && (
          <div style={{ marginTop:10, fontSize:13, color:pct>prevBest?'var(--green)':pct<prevBest?'var(--pink)':'var(--gold)' }}>
            {pct>prevBest?`📈 New personal best! +${pct-prevBest}%`:pct<prevBest?`📉 ${pct-prevBest}% below your best (${prevBest}%)`:'= Matched your personal best'}
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'center', gap:48, marginTop:24 }}>
          {[['✅',c,'+4 each','var(--green)'],['❌',w,'−1 each','var(--pink)'],['⭕',s,'0 marks','var(--muted)']].map(([ic,n,lbl,col])=>(
            <div key={lbl} style={{ textAlign:'center' }}>
              <div style={{ fontSize:34, fontWeight:800, color:col, fontFamily:'var(--mono)' }}>{n}</div>
              <div style={{ fontSize:11, color:'var(--dim)', marginTop:2 }}>{ic} {lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AIR + Subject in grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        {/* AIR */}
        <div style={{ background:'var(--card)', border:`1px solid ${pred.color}25`, borderRadius:12, padding:'20px 24px' }}>
          <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>AIR PREDICTION — NEET 2027</div>
          <div style={{ fontSize:26, fontWeight:800, color:pred.color, fontFamily:'var(--mono)', marginBottom:4 }}>
            {pred.airLow.toLocaleString()}–{pred.airHigh.toLocaleString()}
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>{pred.percentile}th percentile</div>
          <span style={tag(pred.color)}>{pred.tier}</span>
          <div style={{ fontSize:11, color:'var(--dim)', marginTop:10, lineHeight:1.6 }}>📌 {pred.college}</div>
        </div>

        {/* Subject breakdown */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 24px' }}>
          <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>SUBJECT BREAKDOWN</div>
          {Object.entries(subBreak).filter(([,d])=>d.t>0).map(([subj,d])=>{
            const a=Math.round(d.c/d.t*100), col=a>=60?'var(--green)':a>=40?'var(--gold)':'var(--pink)'
            return (
              <div key={subj} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:13 }}>{ICONS[subj]}</span>
                    <span style={{ fontSize:12, color:'var(--text)' }}>{subj}</span>
                  </div>
                  <span style={{ fontSize:12, color:col, fontWeight:700, fontFamily:'var(--mono)' }}>{a}%</span>
                </div>
                <div style={{ height:2, background:'var(--border)', borderRadius:1 }}>
                  <div style={{ height:2, width:`${a}%`, background:col, borderRadius:1 }}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chapter accuracy */}
      {Object.keys(cm).length>0 && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'24px', marginBottom:20 }}>
          <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:18 }}>CHAPTER ACCURACY</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px' }}>
            {Object.entries(cm).sort((a,b)=>{const ra=a[1].t>0?a[1].c/a[1].t:0,rb=b[1].t>0?b[1].c/b[1].t:0;return ra-rb}).map(([ch,d])=>{
              const a=d.t>0?Math.round(d.c/d.t*100):0, col=a>=60?'var(--green)':a>=40?'var(--gold)':'var(--pink)'
              return (
                <div key={ch} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ fontSize:9, background:(SC[d.sub]||'#888')+'18', color:SC[d.sub]||'#888', padding:'1px 5px', borderRadius:3 }}>{d.sub.slice(0,4)}</span>
                      <span style={{ fontSize:11, color:'var(--text)' }}>{ch}</span>
                    </div>
                    <span style={{ fontSize:11, color:col, fontFamily:'var(--mono)', fontWeight:600 }}>{d.c}/{d.t}</span>
                  </div>
                  <div style={{ height:2, background:'var(--border)', borderRadius:1 }}>
                    <div style={{ height:2, width:`${a}%`, background:col, borderRadius:1 }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Wrong answers */}
      {wQs.length>0 && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'24px' }}>
          <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:18 }}>WRONG ANSWERS — REVIEW</div>
          {wQs.map((q,i)=>(
            <div key={i} style={{ padding:'16px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap', alignItems:'center' }}>
                <span style={tag(SC[q.subject]||'#888')}>{q.subject}</span>
                <span style={{ fontSize:11, color:'var(--dim)' }}>{q.chapter}</span>
                {q.year && <span style={tag('var(--dim)')}>NEET {q.year}</span>}
              </div>
              <div style={{ fontSize:13, color:'var(--text)', marginBottom:10, lineHeight:1.7 }}>
                <span style={{ color:'var(--dim)', marginRight:6 }}>Q{q.idx+1}.</span>{q.question}
              </div>
              <div style={{ display:'flex', gap:20, fontSize:12, marginBottom:10, flexWrap:'wrap' }}>
                <span style={{ color:'var(--pink)' }}>✗ Your answer: ({q.ua}) {q.options[q.ua]}</span>
                <span style={{ color:'var(--green)' }}>✓ Correct: ({q.correct}) {q.options[q.correct]}</span>
              </div>
              <div style={{ background:'var(--surface)', borderRadius:8, padding:'10px 14px', fontSize:11, color:'var(--muted)', lineHeight:1.7 }}>
                💡 {q.explanation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
