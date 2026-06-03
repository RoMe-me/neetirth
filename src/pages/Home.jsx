import { predictAIR, getCollegeTierTargets } from '../lib/airPredictor.js'
import { SC, ICONS, HIGH_YIELD, PYQ } from '../data/pyqBank.js'

const T = {
  bg:'#0A0A0F', card:{ background:'#0F0F1A', border:'1px solid #1E1E30', borderRadius:12, padding:20 },
  orange:'#FF6B00', blue:'#4D9FFF', pink:'#FF5588', green:'#00E5AA',
  text:'#E8E8F0', muted:'#606080', dim:'#404060',
}
const btn = (col='#FF6B00', full=false) => ({
  background:col+'18', border:`1px solid ${col}55`, color:col,
  borderRadius:8, padding:'10px 20px', cursor:'pointer',
  fontFamily:'inherit', fontSize:13, fontWeight:600,
  width:full?'100%':'auto', letterSpacing:0.5
})
const tag = (col) => ({
  background:col+'20', border:`1px solid ${col}44`, color:col,
  borderRadius:4, padding:'2px 8px', fontSize:11, display:'inline-block'
})

function ScoreTrend({ history }) {
  if (history.length < 2) return null
  const last = history.slice(-8)
  const pts = last.map(m => Math.round(m.score / m.max * 100))
  const W = 260, H = 60
  const mn = Math.min(...pts), mx = Math.max(...pts, mn + 1)
  const x = i => (i / (pts.length - 1)) * W
  const y = v => H - ((v - mn) / (mx - mn)) * (H - 14) - 7
  const path = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
  return (
    <div style={{ ...T.card, marginBottom:14 }}>
      <div style={{ fontSize:10, color:T.dim, letterSpacing:2, marginBottom:10 }}>📈 SCORE TREND</div>
      <svg width={W} height={H} style={{ overflow:'visible' }}>
        <path d={path} fill="none" stroke={T.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r="4" fill={T.orange} />
            <text x={x(i)} y={y(v) - 8} textAnchor="middle" fill={T.dim} fontSize="10">{v}%</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function AIRCard({ history }) {
  if (history.length === 0) return null
  const latest = history[history.length - 1]
  const score = latest.score
  const pred = predictAIR(score)
  return (
    <div style={{ ...T.card, borderColor:pred.color + '40', marginBottom:14 }}>
      <div style={{ fontSize:10, color:T.dim, letterSpacing:2, marginBottom:12 }}>🎯 YOUR LAST MOCK — AIR PREDICTION</div>
      <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
        <div>
          <div style={{ fontSize:28, fontWeight:800, color:pred.color }}>{score}</div>
          <div style={{ fontSize:11, color:T.muted }}>marks</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text }}>
            Predicted AIR: <span style={{ color:pred.color }}>{pred.airLow.toLocaleString()} – {pred.airHigh.toLocaleString()}</span>
          </div>
          <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>{pred.percentile}th percentile</div>
          <div style={{ marginTop:8 }}>
            <span style={tag(pred.color)}>{pred.tier}</span>
          </div>
          <div style={{ fontSize:11, color:T.muted, marginTop:6 }}>📌 {pred.college}</div>
        </div>
      </div>
      <div style={{ marginTop:12, padding:'8px 12px', background:'#FF6B0008', borderRadius:6, fontSize:11, color:T.dim }}>
        Based on NTA 2025 official data. Adjusted for ~26L expected in NEET 2027.
      </div>
    </div>
  )
}

export default function Home({ user, history, weakness, resumeInfo, onStartMock, onResume, onProgress, onLogout }) {
  const totAns = Object.values(weakness).reduce((a,v)=>a+v.t,0)
  const totCor = Object.values(weakness).reduce((a,v)=>a+v.c,0)
  const acc = totAns > 0 ? Math.round(totCor/totAns*100) : 0
  const weakChaps = Object.entries(weakness)
    .filter(([,d]) => d.t >= 3 && d.c/d.t < 0.5)
    .sort((a,b) => a[1].c/a[1].t - b[1].c/b[1].t).slice(0,4)

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`*{box-sizing:border-box} button:hover{filter:brightness(1.2)} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#2A2A40}`}</style>

      {/* TOP BAR */}
      <div style={{ background:'#0F0F1A', borderBottom:'1px solid #1E1E30', padding:'12px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:T.orange, letterSpacing:1 }}>नीतीर्थ</div>
            <div style={{ fontSize:9, color:T.dim, letterSpacing:3 }}>NEETIRTH</div>
          </div>
          <div style={{ width:1, height:32, background:'#1E1E30' }}/>
          <div>
            <div style={{ fontSize:14, fontWeight:600 }}>Welcome, <span style={{ color:T.orange }}>{user?.name}</span></div>
            <div style={{ fontSize:11, color:T.muted }}>{history.length} mocks · {totAns} questions attempted</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          {[
            { v:history.length, l:'Mocks', c:T.orange },
            { v:totAns, l:'Questions', c:T.blue },
            { v:acc+'%', l:'Accuracy', c: acc>=60?T.green:acc>=40?'#FFAA00':T.pink }
          ].map(s => (
            <div key={s.l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:700, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:10, color:T.dim }}>{s.l}</div>
            </div>
          ))}
          <button onClick={onLogout} style={{ ...btn('#505070'), padding:'6px 12px', fontSize:11 }}>Change User</button>
        </div>
      </div>

      <div style={{ padding:28, maxWidth:1100, margin:'0 auto' }}>

        {/* RESUME BANNER */}
        {resumeInfo && (
          <div style={{ ...T.card, borderColor:'#FFAA0050', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', background:'#FFAA0008' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:24 }}>⏸</span>
              <div>
                <div style={{ fontWeight:700, color:'#FFAA00' }}>Unfinished Mock</div>
                <div style={{ fontSize:12, color:T.muted }}>
                  {resumeInfo.qs?.length} questions · {Object.keys(resumeInfo.ans||{}).length} answered · saved {new Date(resumeInfo.savedAt||resumeInfo.at||'').toLocaleTimeString()}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={onResume} style={{ ...btn('#FFAA00'), padding:'8px 20px' }}>▶ Resume</button>
            </div>
          </div>
        )}

        {/* FULL NEET CTA */}
        <div
          onClick={() => onStartMock({ isFull:true })}
          style={{ ...T.card, borderColor:T.orange+'40', marginBottom:16, cursor:'pointer', background:T.orange+'06', display:'flex', alignItems:'center', justifyContent:'space-between' }}
          onMouseEnter={e => e.currentTarget.style.borderColor=T.orange}
          onMouseLeave={e => e.currentTarget.style.borderColor=T.orange+'40'}
        >
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <span style={{ fontSize:44 }}>🎯</span>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:T.orange }}>Full NEET Mock — 720 Marks</div>
              <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>Physics 45Q + Chemistry 45Q + Biology 90Q · Real PYQs · 3 Hours 20 Minutes</div>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <span style={tag(T.blue)}>⚡ Physics 45Q (180 marks)</span>
                <span style={tag(T.orange)}>⚗️ Chemistry 45Q (180 marks)</span>
                <span style={tag(T.pink)}>🧬 Biology 90Q (360 marks)</span>
              </div>
            </div>
          </div>
          <div style={{ color:T.orange, fontSize:28, fontWeight:800 }}>→</div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {[
            { icon:'📄', label:'Chapter Mock', sub:'Pick any chapter, set question count', col:T.blue, action:()=>onStartMock({isFull:false,type:'chapter'}) },
            { icon:'📊', label:'My Progress', sub:`${history.length} mocks tracked · weakness analysis`, col:'#AA88FF', action:onProgress },
            { icon:'📚', label:'Subject Practice', sub:`${PYQ.length} real PYQs · 2006–2026`, col:T.pink, action:()=>onStartMock({isFull:false,type:'subject'}) },
          ].map(({ icon, label, sub, col, action }) => (
            <div key={label} onClick={action} style={{ ...T.card, cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor=col}
              onMouseLeave={e => e.currentTarget.style.borderColor='#1E1E30'}>
              <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
              <div style={{ fontSize:14, fontWeight:700, color:col }}>{label}</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20 }}>
          <div>
            <AIRCard history={history} />
            <ScoreTrend history={history} />

            {/* Weak chapters */}
            {weakChaps.length > 0 && (
              <div style={{ ...T.card }}>
                <div style={{ fontSize:10, color:T.dim, letterSpacing:2, marginBottom:14 }}>⚠ YOUR WEAKEST CHAPTERS</div>
                {weakChaps.map(([ch, d]) => {
                  const a = Math.round(d.c/d.t*100)
                  return (
                    <div key={ch} style={{ paddingBottom:10, marginBottom:10, borderBottom:'1px solid #1A1A2A' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span style={tag(SC[d.sub]||'#888')}>{d.sub}</span>
                          <span style={{ fontSize:12, color:T.text }}>{ch}</span>
                        </div>
                        <span style={{ color:T.pink, fontWeight:700 }}>{a}%</span>
                      </div>
                      <div style={{ height:3, background:'#1A1A2A', borderRadius:2 }}>
                        <div style={{ height:3, width:`${a}%`, background:T.pink, borderRadius:2 }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {history.length === 0 && (
              <div style={{ ...T.card, textAlign:'center', padding:48, color:T.muted }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
                <div style={{ fontSize:16, marginBottom:8, color:T.text }}>Give your first mock to begin tracking</div>
                <div style={{ fontSize:13 }}>Your score trend, AIR prediction, and weakness analysis will appear here.</div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div>
            {/* AIR targets */}
            <div style={{ ...T.card, marginBottom:14 }}>
              <div style={{ fontSize:10, color:T.dim, letterSpacing:2, marginBottom:12 }}>🏥 SCORE TARGETS 2027</div>
              {getCollegeTierTargets().map(t => (
                <div key={t.target} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #1A1A2A' }}>
                  <div>
                    <div style={{ fontSize:11, color:T.text, fontWeight:600 }}>{t.target}</div>
                    <div style={{ fontSize:10, color:T.muted }}>AIR {t.minAIR}</div>
                  </div>
                  <span style={{ ...tag(t.color), fontSize:12, fontWeight:700 }}>{t.minMarks}+</span>
                </div>
              ))}
            </div>

            {/* High yield */}
            {Object.entries(HIGH_YIELD).map(([subj, chs]) => (
              <div key={subj} style={{ ...T.card, marginBottom:10, borderColor:(SC[subj]||'#888')+'30' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
                  <span>{ICONS[subj]}</span>
                  <span style={{ color:SC[subj], fontSize:11, fontWeight:700 }}>{subj} — High Yield</span>
                </div>
                {chs.slice(0,5).map(ch => (
                  <div key={ch} style={{ fontSize:10, color:T.muted, padding:'3px 0', borderBottom:'1px solid #14141E' }}>
                    ▸ {ch}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
