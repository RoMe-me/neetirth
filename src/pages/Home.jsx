import { useState } from 'react'
import { predictAIR, getCollegeTierTargets } from '../lib/airPredictor.js'
import { SC, ICONS, PYQ } from '../data/pyqBank.js'

const tag = col => ({ background:col+'18', border:`1px solid ${col}30`, color:col, borderRadius:4, padding:'2px 8px', fontSize:11, display:'inline-block', fontWeight:500 })

// Daily Q — seeded by date so everyone sees same Q each day
function getDailyQ() {
  const day = Math.floor(Date.now() / 86400000)
  return PYQ[day % PYQ.length]
}

function DailyQuestion() {
  const q = getDailyQ()
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)

  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2 }}>QUESTION OF THE DAY</div>
        <div style={{ display:'flex', gap:6 }}>
          <span style={tag(SC[q.sub]||'#888')}>{q.sub}</span>
          <span style={{ fontSize:10, color:'var(--dim)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:3, padding:'1px 6px', fontFamily:'var(--mono)' }}>
            NEET {q.y||q.year}
          </span>
        </div>
      </div>
      <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.7, marginBottom:14 }}>{q.q}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
        {['A','B','C','D'].map(opt => {
          const isCorrect = q.a === opt
          const isSel = selected === opt
          let bg = 'var(--surface)', border = 'var(--border)', color = 'var(--muted)'
          if (isSel && !revealed) { bg='#FF6B0012'; border='#FF6B0040'; color='var(--orange)' }
          if (revealed && isCorrect) { bg='var(--green)10'; border='var(--green)40'; color='var(--green)' }
          if (revealed && isSel && !isCorrect) { bg='var(--pink)10'; border='var(--pink)40'; color='var(--pink)' }
          return (
            <div key={opt} onClick={()=>{ if(!revealed){ setSelected(opt) } }}
              style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'9px 12px', borderRadius:8, background:bg, border:`1px solid ${border}`, cursor:revealed?'default':'pointer', transition:'all 0.12s' }}>
              <span style={{ fontSize:11, fontWeight:700, color, fontFamily:'var(--mono)', flexShrink:0, marginTop:1 }}>{opt}</span>
              <span style={{ fontSize:12, color, lineHeight:1.5 }}>{q.o[opt]}</span>
            </div>
          )
        })}
      </div>
      {!revealed ? (
        <button onClick={()=>setRevealed(true)} disabled={!selected}
          style={{ background:selected?'var(--orange)':'var(--border)', border:'none', color:selected?'#fff':'var(--dim)', borderRadius:7, padding:'8px 18px', fontSize:12, fontWeight:600, opacity:selected?1:0.5 }}>
          Check Answer
        </button>
      ) : (
        <div style={{ background:'var(--bg)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>
          {selected===q.a?'✅ Correct! — ':'❌ Wrong — '}{q.e}
        </div>
      )}
    </div>
  )
}

function TrendChart({ history }) {
  if (history.length < 2) return null
  const pts = history.slice(-8).map(m => Math.round(m.score/m.max*100))
  const W=280, H=56, mn=Math.min(...pts), mx=Math.max(...pts,mn+1)
  const x=i=>(i/(pts.length-1))*W
  const y=v=>H-((v-mn)/(mx-mn))*(H-12)-6
  const path=pts.map((v,i)=>`${i===0?'M':'L'}${x(i)},${y(v)}`).join(' ')
  const area=`${path} L${x(pts.length-1)},${H} L0,${H} Z`
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 24px' }}>
      <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>SCORE TREND</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
        <defs>
          <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--orange)" stopOpacity="0.2"/>
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
    </div>
  )
}

export default function Home({ user, history, weakness, resumeInfo, onStartMock, onResume, onProgress, onPYQ }) {
  const totAns = Object.values(weakness).reduce((a,v)=>a+v.t,0)
  const totCor = Object.values(weakness).reduce((a,v)=>a+v.c,0)
  const acc    = totAns>0 ? Math.round(totCor/totAns*100) : 0
  const latest = history.length>0 ? history[history.length-1] : null
  const pred   = latest ? predictAIR(latest.score) : null
  const weakTop= Object.entries(weakness).filter(([,d])=>d.t>=3&&d.c/d.t<0.5).sort((a,b)=>a[1].c/a[1].t-b[1].c/b[1].t).slice(0,3)

  return (
    <div style={{ padding:'32px 36px', maxWidth:960, margin:'0 auto' }}>
      <style>{`button:hover{filter:brightness(1.12)}`}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:22, fontWeight:700 }}>
          Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'},{' '}
          <span style={{ color:'var(--orange)' }}>{user?.name}</span>
        </div>
        <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>
          NEET 2027 &nbsp;·&nbsp; {history.length===0?'Start your first mock today.':`${history.length} mock${history.length>1?'s':''} completed. Keep going.`}
        </div>
      </div>

      {/* Resume banner */}
      {resumeInfo && (
        <div style={{ background:'#FFAA0008', border:'1px solid #FFAA0025', borderRadius:12, padding:'14px 20px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:18 }}>⏸</span>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#FFAA00' }}>Unfinished mock</div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{resumeInfo.qs?.length} questions · {Object.keys(resumeInfo.ans||{}).length} answered</div>
            </div>
          </div>
          <button onClick={onResume} style={{ background:'#FFAA0018', border:'1px solid #FFAA0040', color:'#FFAA00', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:600 }}>Resume →</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[
          { v:history.length, l:'Mocks Given',     c:'var(--orange)' },
          { v:totAns,         l:'Questions Done',  c:'var(--blue)'   },
          { v:acc>0?acc+'%':'—', l:'Accuracy',     c:acc>=60?'var(--green)':acc>=40?'var(--gold)':'var(--pink)' },
        ].map(s=>(
          <div key={s.l} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'18px 22px' }}>
            <div style={{ fontSize:28, fontWeight:800, color:s.c, fontFamily:'var(--mono)' }}>{s.v}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Full mock CTA */}
      <div onClick={()=>onStartMock({isFull:true})}
        style={{ background:'linear-gradient(135deg,#FF6B0010 0%,#FF6B0004 100%)', border:'1px solid #FF6B0028', borderRadius:14, padding:'22px 28px', cursor:'pointer', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', transition:'border-color 0.15s' }}
        onMouseEnter={e=>e.currentTarget.style.borderColor='#FF6B0060'}
        onMouseLeave={e=>e.currentTarget.style.borderColor='#FF6B0028'}
      >
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--orange)', marginBottom:4 }}>Full NEET Mock — 720 Marks</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>180 Questions · Physics 45 · Chemistry 45 · Biology 90 · 3hr 20min</div>
          <div style={{ display:'flex', gap:8 }}>
            {[['⚡ Physics','var(--blue)'],['⚗️ Chemistry','var(--orange)'],['🧬 Biology','var(--pink)']].map(([l,c])=>(
              <span key={l} style={tag(c)}>{l}</span>
            ))}
          </div>
        </div>
        <div style={{ fontSize:30, color:'var(--orange)', fontWeight:300 }}>→</div>
      </div>

      {/* 3-col grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>

        {/* Col 1 — Daily Q + Trend */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <DailyQuestion/>
          <TrendChart history={history}/>
          {history.length===0 && (
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'28px 20px', textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🎯</div>
              <div style={{ fontSize:13, color:'var(--text)', marginBottom:4 }}>No mocks yet</div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>Give your first mock to see score trend and AIR prediction.</div>
            </div>
          )}
        </div>

        {/* Col 2 — AIR + Weak chapters */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {pred && (
            <div style={{ background:'var(--card)', border:`1px solid ${pred.color}20`, borderRadius:12, padding:'20px 22px' }}>
              <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:12 }}>LAST MOCK — AIR ESTIMATE</div>
              <div style={{ fontSize:32, fontWeight:800, color:pred.color, fontFamily:'var(--mono)', lineHeight:1 }}>{latest.score}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:2, marginBottom:10 }}>out of {latest.max}</div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:4 }}>AIR {pred.airLow.toLocaleString()}–{pred.airHigh.toLocaleString()}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8 }}>{pred.percentile}th percentile</div>
              <span style={tag(pred.color)}>{pred.tier}</span>
              <div style={{ fontSize:11, color:'var(--dim)', marginTop:10, lineHeight:1.6 }}>📌 {pred.college}</div>
            </div>
          )}
          {weakTop.length>0 && (
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 22px' }}>
              <div style={{ fontSize:10, color:'var(--pink)', letterSpacing:2, marginBottom:14 }}>NEEDS ATTENTION</div>
              {weakTop.map(([ch,d])=>{
                const a=Math.round(d.c/d.t*100)
                return (
                  <div key={ch} style={{ marginBottom:11 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:11, color:'var(--text)' }}>{ch}</span>
                      <span style={{ fontSize:11, color:'var(--pink)', fontFamily:'var(--mono)', fontWeight:600 }}>{a}%</span>
                    </div>
                    <div style={{ height:2, background:'var(--border)', borderRadius:1 }}>
                      <div style={{ height:2, width:`${a}%`, background:'var(--pink)', borderRadius:1 }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Col 3 — Quick actions + Targets */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 22px' }}>
            <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>QUICK PRACTICE</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { l:'Chapter Mock',  s:'Pick a chapter',      c:'var(--blue)',   a:()=>onStartMock({isFull:false,type:'chapter'})  },
                { l:'Subject Mock',  s:'One full subject',    c:'var(--orange)', a:()=>onStartMock({isFull:false,type:'subject'})  },
                { l:'My Progress',   s:'Analytics + history', c:'#AA88FF',       a:onProgress                                     },
                { l:'PYQ Bank',      s:'Browse all questions',c:'var(--green)',  a:onPYQ                                          },
              ].map(({l,s,c,a})=>(
                <button key={l} onClick={a} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', color:'var(--text)', textAlign:'left', transition:'border-color 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=c}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                >
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:c }}>{l}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{s}</div>
                  </div>
                  <span style={{ color:'var(--dim)' }}>→</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 22px' }}>
            <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:14 }}>SCORE TARGETS</div>
            {getCollegeTierTargets().map(t=>(
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
