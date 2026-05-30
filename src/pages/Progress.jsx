import { predictAIR } from '../lib/airPredictor.js'
import { SC, ICONS } from '../data/pyqBank.js'
import { saveHistory, saveWeakness } from '../lib/storage.js'

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

function ScoreTrend({ history }) {
  if (history.length < 2) return null
  const last = history.slice(-10)
  const pts = last.map(m => Math.round(m.score / m.max * 100))
  const W = 540, H = 80
  const mn = Math.min(...pts), mx = Math.max(...pts, mn + 1)
  const x = i => (i / (pts.length - 1)) * W
  const y = v => H - ((v - mn) / (mx - mn)) * (H - 16) - 8
  const path = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
  const avg = Math.round(pts.reduce((a,b)=>a+b,0)/pts.length)
  return (
    <div style={{ ...T.card, marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:10, color:T.dim, letterSpacing:2 }}>📈 SCORE TREND (last {last.length} mocks)</div>
        <div style={{ fontSize:12, color:T.muted }}>Average: <span style={{ color:T.orange, fontWeight:700 }}>{avg}%</span></div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
        <path d={path} fill="none" stroke={T.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r="5" fill={T.orange}/>
            <text x={x(i)} y={y(v)-10} textAnchor="middle" fill={T.dim} fontSize="11">{v}%</text>
            <text x={x(i)} y={H+16} textAnchor="middle" fill={T.dim} fontSize="9">
              {new Date(last[i].date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function Progress({ user, history, weakness, onBack, onClear }) {
  const rev = [...history].reverse()

  // Subject-level stats
  const subStats = {}
  Object.entries(weakness).forEach(([ch, d]) => {
    if (!subStats[d.sub]) subStats[d.sub] = { c:0, t:0, mocks:0 }
    subStats[d.sub].c += d.c
    subStats[d.sub].t += d.t
  })
  history.forEach(m => {
    const s = m.subject || m.type
    if (subStats[s]) subStats[s].mocks = (subStats[s].mocks||0) + 1
  })

  const totAns = Object.values(weakness).reduce((a,v)=>a+v.t,0)
  const totCor = Object.values(weakness).reduce((a,v)=>a+v.c,0)
  const overallAcc = totAns > 0 ? Math.round(totCor/totAns*100) : 0

  // Latest AIR prediction
  const latestMock = history.length > 0 ? history[history.length-1] : null
  const latestPred = latestMock ? predictAIR(latestMock.score) : null

  const handleClear = () => {
    if (window._confirmClear) {
      saveHistory([])
      saveWeakness({})
      onClear()
      window._confirmClear = false
    } else {
      window._confirmClear = true
      setTimeout(() => { window._confirmClear = false }, 3000)
      alert('⚠ Press "Clear All" again within 3 seconds to confirm. This cannot be undone.')
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`*{box-sizing:border-box} button:hover{filter:brightness(1.2)} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#2A2A40}`}</style>

      {/* TOP */}
      <div style={{ background:'#0F0F1A', borderBottom:'1px solid #1E1E30', padding:'12px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={onBack} style={{ ...btn('#606080'), padding:'7px 14px', fontSize:12 }}>← Home</button>
          <div style={{ fontSize:18, fontWeight:800, color:T.orange, letterSpacing:1 }}>नीतीर्थ</div>
          <span style={{ color:T.muted, fontSize:13 }}>/ {user?.name}'s Progress</span>
        </div>
        {history.length > 0 && (
          <button onClick={handleClear} style={{ ...btn(T.pink), padding:'7px 14px', fontSize:12 }}>Clear All Data</button>
        )}
      </div>

      <div style={{ padding:28, maxWidth:900, margin:'0 auto' }}>

        {history.length === 0 ? (
          <div style={{ ...T.card, textAlign:'center', padding:64, color:T.muted }}>
            <div style={{ fontSize:52, marginBottom:14 }}>📊</div>
            <div style={{ fontSize:18, color:T.text, marginBottom:8 }}>No mock history yet</div>
            <div style={{ fontSize:13, marginBottom:24 }}>Give your first mock to start tracking your journey.</div>
            <button onClick={onBack} style={{ ...btn(T.orange), padding:'10px 28px' }}>🎯 Start First Mock</button>
          </div>
        ) : (
          <>
            {/* OVERVIEW STATS */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
              {[
                { v:history.length, l:'Total Mocks', c:T.orange },
                { v:totAns, l:'Questions Done', c:T.blue },
                { v:overallAcc+'%', l:'Overall Accuracy', c:overallAcc>=60?T.green:overallAcc>=40?'#FFAA00':T.pink },
                { v:latestPred?`${latestPred.airLow.toLocaleString()}–${latestPred.airHigh.toLocaleString()}`:'—', l:'Latest AIR Range', c:latestPred?.color||T.muted }
              ].map(s => (
                <div key={s.l} style={{ ...T.card, textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:s.c, lineHeight:1.2 }}>{s.v}</div>
                  <div style={{ fontSize:10, color:T.dim, marginTop:4 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* TREND */}
            <ScoreTrend history={history}/>

            {/* SUBJECT STATS */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
              {['Chemistry','Physics','Biology'].map(subj => {
                const d = subStats[subj] || { c:0, t:0 }
                const acc = d.t > 0 ? Math.round(d.c/d.t*100) : null
                const col = acc===null?T.muted:acc>=60?T.green:acc>=40?'#FFAA00':T.pink
                const subMocks = history.filter(m => m.subject===subj||m.type===subj||m.type==='Full NEET')
                const best = subMocks.length>0 ? Math.max(...subMocks.map(m=>m.pct)) : null
                return (
                  <div key={subj} style={{ ...T.card, textAlign:'center', borderColor:(SC[subj]||'#888')+'30' }}>
                    <div style={{ fontSize:26 }}>{ICONS[subj]}</div>
                    <div style={{ color:SC[subj], fontSize:13, marginTop:6, fontWeight:700 }}>{subj}</div>
                    {acc !== null
                      ? <div style={{ color:col, fontSize:24, fontWeight:800, marginTop:4 }}>{acc}%</div>
                      : <div style={{ color:T.dim, fontSize:12, marginTop:8 }}>No data</div>}
                    <div style={{ color:T.dim, fontSize:10, marginTop:4 }}>{d.t} questions attempted</div>
                    {best !== null && <div style={{ color:T.muted, fontSize:10 }}>Best: {best}%</div>}
                  </div>
                )
              })}
            </div>

            {/* WEAKNESS BY CHAPTER */}
            {Object.keys(weakness).length > 0 && (
              <div style={{ ...T.card, marginBottom:20 }}>
                <div style={{ fontSize:10, color:T.dim, letterSpacing:2, marginBottom:16 }}>ALL CHAPTERS — weakest first (cumulative across all mocks)</div>
                {Object.entries(weakness)
                  .sort((a,b) => (a[1].c/a[1].t) - (b[1].c/b[1].t))
                  .map(([ch, d]) => {
                    const a = Math.round(d.c/d.t*100)
                    const col = a>=70?T.green:a>=50?'#FFAA00':T.pink
                    return (
                      <div key={ch} style={{ padding:'10px 0', borderBottom:'1px solid #141420' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <span style={tag(SC[d.sub]||'#888')}>{d.sub}</span>
                            <span style={{ fontSize:12, color:T.text }}>{ch}</span>
                          </div>
                          <span style={{ color:col, fontWeight:700 }}>{a}% <span style={{ color:T.dim, fontWeight:'normal' }}>({d.c}/{d.t})</span></span>
                        </div>
                        <div style={{ height:4, background:'#141420', borderRadius:2 }}>
                          <div style={{ height:4, width:`${a}%`, background:col, borderRadius:2, transition:'width 0.3s' }}/>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* MOCK HISTORY LIST */}
            <div style={T.card}>
              <div style={{ fontSize:10, color:T.dim, letterSpacing:2, marginBottom:16 }}>ALL MOCKS — newest first</div>
              {rev.map(m => {
                const col = m.pct>=60?T.green:m.pct>=40?'#FFAA00':T.pink
                const pred = predictAIR(m.score)
                return (
                  <div key={m.id} style={{ padding:'12px 0', borderBottom:'1px solid #141420' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={tag(m.type==='Full NEET'?T.orange:SC[m.type]||'#808080')}>{m.type}</span>
                        <span style={{ fontSize:11, color:T.muted }}>
                          {new Date(m.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                          {' '}{new Date(m.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                        </span>
                        <span style={{ fontSize:10, color:T.dim }}>{m.n}Q</span>
                      </div>
                      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ color:col, fontSize:18, fontWeight:700 }}>{m.pct}%</div>
                          <div style={{ color:T.muted, fontSize:11 }}>{m.score}/{m.max}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ color:pred.color, fontSize:12, fontWeight:600 }}>AIR ~{pred.air2027.toLocaleString()}</div>
                          <div style={{ color:T.dim, fontSize:10 }}>{pred.tier}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:16, fontSize:11, color:T.dim }}>
                      <span style={{ color:T.green }}>✅ {m.c}</span>
                      <span style={{ color:T.pink }}>❌ {m.w}</span>
                      <span>⭕ {m.s}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
