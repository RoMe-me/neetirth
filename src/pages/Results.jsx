import { useState } from 'react'
import { predictAIR } from '../lib/airPredictor.js'
import { SC, ICONS } from '../data/pyqBank.js'

const tag = col => ({ background:col+'18', border:`1px solid ${col}30`, color:col, borderRadius:4, padding:'2px 8px', fontSize:11, display:'inline-block', fontWeight:500 })

export default function Results({ user, results, history, onNewMock, onProgress }) {
  const { c, w, s, score, max, pct, wQs, cm } = results
  const qs = results.qs || []
  const scoreCol = pct>=60?'var(--green)':pct>=40?'var(--gold)':'var(--pink)'
  const cardScoreColor = pct>=60 ? '#18e7b6' : pct>=40 ? '#ffc145' : '#ff5da2'
  const pred = predictAIR(score)
  const prev = history.slice(0,-1)
  const prevBest = prev.length>0 ? Math.max(...prev.map(m=>m.pct)) : null
  const subBreak = {Chemistry:{c:0,t:0},Physics:{c:0,t:0},Biology:{c:0,t:0}}
  Object.entries(cm).forEach(([,d])=>{ if(subBreak[d.sub]){subBreak[d.sub].c+=d.c;subBreak[d.sub].t+=d.t} })
  const [shareState, setShareState] = useState('Share score')
  const subjectLine = Object.entries(subBreak).filter(([,data]) => data.t > 0).map(([name, data]) => `${name.slice(0,3)} ${Math.round(data.c / data.t * 100)}%`).join(' · ')
  const shareText = `Neetirth | ${user?.name || 'Student'}\nScore: ${score}/${max} | Predicted AIR: ${pred.airLow.toLocaleString()}–${pred.airHigh.toLocaleString()}\n${subjectLine}\n#NEET2027 #Neetirth`

  const shareScore = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title:'My Neetirth result', text:shareText })
        setShareState('Shared ✓')
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText)
        setShareState('Copied ✓')
      } else {
        const area = document.createElement('textarea')
        area.value = shareText; area.style.position = 'fixed'; area.style.opacity = '0'
        document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove()
        setShareState('Copied ✓')
      }
    } catch { setShareState('Copy score') }
    setTimeout(() => setShareState('Share score'), 2200)
  }

  const downloadCard = () => {
    const safe = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[char]))
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#111114"/><circle cx="1050" cy="-30" r="280" fill="#ff7a1a" opacity=".18"/><circle cx="100" cy="680" r="250" fill="#64aeff" opacity=".12"/><text x="72" y="86" fill="#ff7a1a" font-family="Arial" font-size="24" font-weight="700" letter-spacing="5">NEETIRTH</text><text x="72" y="170" fill="#f7f7fb" font-family="Arial" font-size="34" font-weight="700">${safe(user?.name || 'Student')}’s mock result</text><text x="72" y="315" fill="${cardScoreColor}" font-family="monospace" font-size="140" font-weight="800">${score}</text><text x="82" y="365" fill="#a4a4ac" font-family="Arial" font-size="22">out of ${max} · ${pct}%</text><text x="720" y="225" fill="#a4a4ac" font-family="Arial" font-size="20">PREDICTED AIR</text><text x="720" y="275" fill="#ffc145" font-family="monospace" font-size="42" font-weight="700">${pred.airLow.toLocaleString()}–${pred.airHigh.toLocaleString()}</text><text x="720" y="350" fill="#f7f7fb" font-family="Arial" font-size="24">${safe(pred.tier)}</text><text x="72" y="520" fill="#a4a4ac" font-family="Arial" font-size="20">${safe(subjectLine)}</text><text x="72" y="575" fill="#66666e" font-family="Arial" font-size="16">Practice deliberately · #NEET2027 #Neetirth</text></svg>`
    const url = URL.createObjectURL(new Blob([svg], { type:'image/svg+xml' }))
    const link = document.createElement('a'); link.href = url; link.download = `neetirth-result-${score}.svg`; link.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="page-in" style={{ padding:'32px 36px', maxWidth:820, margin:'0 auto' }}>
      <style>{`button:hover{filter:brightness(1.12)}`}</style>

      {/* Top actions */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700 }}>Mock Results</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          <button onClick={shareScore} style={{ background:'var(--card)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:12, fontWeight:600 }}>{shareState}</button>
          <button onClick={downloadCard} style={{ background:'var(--card)', border:'1px solid var(--border)', color:'var(--muted)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>Download card</button>
          <button onClick={onProgress} style={{ background:'var(--card)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:'8px 12px', fontSize:12, fontWeight:500 }}>View Progress</button>
          <button onClick={onNewMock} style={{ background:'var(--orange)', border:'none', color:'#fff', borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:700 }}>New Mock →</button>
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
      <div className="results-top-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        {/* AIR */}
        <div style={{ background:'var(--card)', border:`1px solid ${pred.color}25`, borderRadius:12, padding:'20px 24px' }}>
          <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>PLANNING ESTIMATE — NEET 2027</div>
          <div style={{ fontSize:26, fontWeight:800, color:pred.color, fontFamily:'var(--mono)', marginBottom:4 }}>
            {pred.airLow.toLocaleString()}–{pred.airHigh.toLocaleString()}
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>{pred.percentile}th percentile</div>
          <span style={tag(pred.color)}>{pred.tier}</span>
          <div style={{ fontSize:11, color:'var(--dim)', marginTop:10, lineHeight:1.6 }}>📌 {pred.college}</div>
          <div style={{ fontSize:10, color:'var(--dim)', marginTop:8, lineHeight:1.5 }}>{pred.basis}</div>
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


      {/* ── TIME ANALYTICS ── */}
      {results.timeMap && Object.keys(results.timeMap).length > 0 && (() => {
        const tm = results.timeMap
        const totalUsed = Object.values(tm).reduce((a,b)=>a+b,0)
        const totalAllowed = results.rec?.n ? results.rec.n * 72 : 12000
        const avgPerQ = totalUsed > 0 ? Math.round(totalUsed / Object.keys(tm).length) : 0

        // Per-subject averages
        const subTime = {}
        qs.forEach((q, i) => {
          const s = q.subject
          if (!subTime[s]) subTime[s] = { total:0, count:0 }
          subTime[s].total += tm[i] || 0
          subTime[s].count += 1
        })

        // Slowest 5 questions
        const slowest = Object.entries(tm)
          .sort((a,b) => b[1]-a[1])
          .slice(0,5)
          .map(([i,t]) => ({ idx:+i, t, q:qs[+i] }))
          .filter(x => x.q)

        const fmtT = s => s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`
        const pct = Math.min(100, Math.round(totalUsed/totalAllowed*100))

        return (
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'24px', marginBottom:20 }}>
            <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:20 }}>TIME ANALYTICS</div>

            {/* Top row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
              {[
                { v:fmtT(totalUsed), l:'Total Time Used',    c:'var(--orange)' },
                { v:fmtT(avgPerQ),   l:'Avg per Question',   c:avgPerQ>90?'var(--pink)':avgPerQ>60?'var(--gold)':'var(--green)' },
                { v:pct+'%',         l:'Time Used of Allotted', c:pct>90?'var(--pink)':pct>70?'var(--gold)':'var(--green)' },
              ].map(s=>(
                <div key={s.l} style={{ background:'var(--surface)', borderRadius:10, padding:'14px 16px' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:s.c, fontFamily:'var(--mono)' }}>{s.v}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Time per subject */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--dim)', marginBottom:10 }}>Avg time per question by subject</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {Object.entries(subTime).filter(([,d])=>d.count>0).map(([subj,d])=>{
                  const avg = Math.round(d.total/d.count)
                  const ideal = 72 // 72s per Q ideal for NEET
                  const col = avg > ideal*1.4 ? 'var(--pink)' : avg > ideal ? 'var(--gold)' : 'var(--green)'
                  const barW = Math.min(100, Math.round(avg/180*100))
                  return (
                    <div key={subj}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:12, color:'var(--text)' }}>{subj}</span>
                        <span style={{ fontSize:12, color:col, fontFamily:'var(--mono)', fontWeight:600 }}>{fmtT(avg)} / question</span>
                      </div>
                      <div style={{ height:4, background:'var(--border)', borderRadius:2 }}>
                        <div style={{ height:4, width:`${barW}%`, background:col, borderRadius:2, transition:'width 0.4s' }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize:10, color:'var(--dim)', marginTop:8 }}>Ideal: ~72 sec/question for NEET</div>
            </div>

            {/* Question time heatmap */}
            {Object.keys(tm).length > 0 && (
              <div>
                <div style={{ fontSize:11, color:'var(--dim)', marginBottom:8 }}>Time per question (green &lt;60s · orange 60–120s · red &gt;2min)</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                  {qs.map((q,i)=>{
                    const t = tm[i] || 0
                    const col = t===0?'var(--dim)':t<60?'var(--green)':t<120?'var(--gold)':'var(--pink)'
                    return (
                      <div key={i} title={`Q${i+1}: ${fmtT(t)}`}
                        style={{ width:18, height:18, borderRadius:3, background:col+'30', border:`1px solid ${col}60`, cursor:'default' }}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Slowest questions */}
            {slowest.length > 0 && (
              <div style={{ marginTop:20 }}>
                <div style={{ fontSize:11, color:'var(--dim)', marginBottom:10 }}>Slowest questions — review these</div>
                {slowest.map(({idx,t,q})=>(
                  <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flex:1, minWidth:0 }}>
                      <span style={{ color:'var(--dim)', fontFamily:'var(--mono)', flexShrink:0 }}>Q{idx+1}</span>
                      <span style={{ color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{q.question?.slice(0,60)}…</span>
                    </div>
                    <span style={{ color:'var(--pink)', fontFamily:'var(--mono)', fontWeight:600, flexShrink:0, marginLeft:12 }}>{fmtT(t)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

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
