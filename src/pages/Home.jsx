import { predictAIR, getCollegeTierTargets } from '../lib/airPredictor.js'
import { SC, ICONS, HIGH_YIELD } from '../data/pyqBank.js'

const tag = (col) => ({ background:col+'18', border:`1px solid ${col}30`, color:col, borderRadius:4, padding:'2px 8px', fontSize:11, display:'inline-block', fontWeight:500 })

function StatCard({ value, label, color }) {
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 24px' }}>
      <div style={{ fontSize:28, fontWeight:800, color, fontFamily:'var(--mono)' }}>{value}</div>
      <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{label}</div>
    </div>
  )
}

function TrendChart({ history }) {
  if (history.length < 2) return null
  const pts = history.slice(-8).map(m => Math.round(m.score/m.max*100))
  const W=280, H=60, mn=Math.min(...pts), mx=Math.max(...pts,mn+1)
  const x=i=>(i/(pts.length-1))*W
  const y=v=>H-((v-mn)/(mx-mn))*(H-12)-6
  const path=pts.map((v,i)=>`${i===0?'M':'L'}${x(i)},${y(v)}`).join(' ')
  const area=`${path} L${x(pts.length-1)},${H} L0,${H} Z`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--orange)" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="var(--orange)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#gr)"/>
      <path d={path} fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((v,i)=>(
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r="3.5" fill="var(--orange)"/>
          <text x={x(i)} y={y(v)-9} textAnchor="middle" fill="var(--dim)" fontSize="9" fontFamily="var(--mono)">{v}%</text>
        </g>
      ))}
    </svg>
  )
}

export default function Home({ user, history, weakness, resumeInfo, onStartMock, onResume, onProgress }) {
  const totAns = Object.values(weakness).reduce((a,v)=>a+v.t,0)
  const totCor = Object.values(weakness).reduce((a,v)=>a+v.c,0)
  const acc = totAns>0 ? Math.round(totCor/totAns*100) : 0
  const latest = history.length>0 ? history[history.length-1] : null
  const pred = latest ? predictAIR(latest.score) : null
  const weakTop = Object.entries(weakness).filter(([,d])=>d.t>=3&&d.c/d.t<0.5).sort((a,b)=>a[1].c/a[1].t-b[1].c/b[1].t).slice(0,3)

  return (
    <div style={{ padding:'32px 36px', maxWidth:900, margin:'0 auto' }}>
      <style>{`button:hover{filter:brightness(1.15)}`}</style>

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:22, fontWeight:700 }}>Good morning, <span style={{ color:'var(--orange)' }}>{user?.name}</span></div>
        <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>NEET 2027 — {history.length === 0 ? 'Start your first mock today.' : `${history.length} mock${history.length>1?'s':''} completed. Keep going.`}</div>
      </div>

      {/* Resume banner */}
      {resumeInfo && (
        <div style={{ background:'#FFAA0008', border:'1px solid #FFAA0030', borderRadius:12, padding:'14px 20px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:20 }}>⏸</span>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#FFAA00' }}>Unfinished mock</div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{resumeInfo.qs?.length} questions · {Object.keys(resumeInfo.ans||{}).length} answered</div>
            </div>
          </div>
          <button onClick={onResume} style={{ background:'#FFAA0018', border:'1px solid #FFAA0040', color:'#FFAA00', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:600 }}>Resume →</button>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:28 }}>
        <StatCard value={history.length} label="Mocks Given" color="var(--orange)"/>
        <StatCard value={totAns} label="Questions Attempted" color="var(--blue)"/>
        <StatCard value={acc>0?acc+'%':'—'} label="Overall Accuracy" color={acc>=60?'var(--green)':acc>=40?'var(--gold)':'var(--pink)'}/>
      </div>

      {/* Full mock CTA */}
      <div onClick={()=>onStartMock({isFull:true})}
        style={{ background:'linear-gradient(135deg, #FF6B0010 0%, #FF6B0004 100%)', border:'1px solid #FF6B0030', borderRadius:14, padding:'24px 28px', cursor:'pointer', marginBottom:28, display:'flex', alignItems:'center', justifyContent:'space-between', transition:'border-color 0.2s' }}
        onMouseEnter={e=>e.currentTarget.style.borderColor='#FF6B0070'}
        onMouseLeave={e=>e.currentTarget.style.borderColor='#FF6B0030'}
      >
        <div>
          <div style={{ fontSize:17, fontWeight:700, color:'var(--orange)', marginBottom:6 }}>Full NEET Mock — 720 Marks</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>180 Questions · Physics 45 · Chemistry 45 · Biology 90 · 3hr 20min</div>
          <div style={{ display:'flex', gap:8 }}>
            {[['⚡ Physics','var(--blue)'],['⚗️ Chemistry','var(--orange)'],['🧬 Biology','var(--pink)']].map(([l,c])=>(
              <span key={l} style={tag(c)}>{l}</span>
            ))}
          </div>
        </div>
        <div style={{ fontSize:32, color:'var(--orange)', fontWeight:300 }}>→</div>
      </div>

      {/* Two column */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Left col */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* AIR card */}
          {pred && (
            <div style={{ background:'var(--card)', border:`1px solid ${pred.color}25`, borderRadius:12, padding:'20px 24px' }}>
              <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>LAST MOCK — AIR ESTIMATE</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:16, marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:36, fontWeight:800, color:pred.color, fontFamily:'var(--mono)', lineHeight:1 }}>{latest.score}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>out of {latest.max}</div>
                </div>
                <div style={{ paddingBottom:4 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>AIR {pred.airLow.toLocaleString()}–{pred.airHigh.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{pred.percentile}th percentile</div>
                  <span style={{ ...tag(pred.color), marginTop:6 }}>{pred.tier}</span>
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--dim)', lineHeight:1.6 }}>📌 {pred.college}</div>
            </div>
          )}

          {/* Score trend */}
          {history.length >= 2 && (
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 24px' }}>
              <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>SCORE TREND</div>
              <TrendChart history={history}/>
            </div>
          )}

          {history.length === 0 && (
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'36px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🎯</div>
              <div style={{ fontSize:14, color:'var(--text)', marginBottom:6 }}>No mocks yet</div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>Give your first mock to see your AIR prediction and score trend.</div>
            </div>
          )}
        </div>

        {/* Right col */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Quick actions */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 24px' }}>
            <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>QUICK PRACTICE</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'Chapter Mock', sub:'Pick a chapter', col:'var(--blue)', action:()=>onStartMock({isFull:false,type:'chapter'}) },
                { label:'Subject Mock', sub:'One full subject', col:'var(--orange)', action:()=>onStartMock({isFull:false,type:'subject'}) },
                { label:'My Progress', sub:'View analytics', col:'#AA88FF', action:onProgress },
              ].map(({label,sub,col,action})=>(
                <button key={label} onClick={action} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', color:'var(--text)', textAlign:'left', transition:'border-color 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=col}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                >
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:col }}>{label}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{sub}</div>
                  </div>
                  <span style={{ color:'var(--dim)' }}>→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Weak chapters */}
          {weakTop.length > 0 && (
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 24px' }}>
              <div style={{ fontSize:10, color:'var(--pink)', letterSpacing:2, marginBottom:14 }}>NEEDS ATTENTION</div>
              {weakTop.map(([ch,d])=>{
                const a=Math.round(d.c/d.t*100)
                return (
                  <div key={ch} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <div style={{ fontSize:12, color:'var(--text)' }}>{ch}</div>
                      <div style={{ fontSize:12, color:'var(--pink)', fontFamily:'var(--mono)', fontWeight:500 }}>{a}%</div>
                    </div>
                    <div style={{ height:2, background:'var(--border)', borderRadius:1 }}>
                      <div style={{ height:2, width:`${a}%`, background:'var(--pink)', borderRadius:1 }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* College targets */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 24px' }}>
            <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>SCORE TARGETS</div>
            {getCollegeTierTargets().slice(0,4).map(t=>(
              <div key={t.target} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:12, color:'var(--text)', fontWeight:500 }}>{t.target}</div>
                  <div style={{ fontSize:10, color:'var(--muted)' }}>AIR {t.minAIR}</div>
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:t.color, fontFamily:'var(--mono)' }}>{t.minMarks}+</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
