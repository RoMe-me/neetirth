import React, { useState } from 'react'
import { predictAIR } from '../lib/airPredictor.js'
import { SC, ICONS } from '../data/pyqBank.js'
import { saveHistory, saveWeakness } from '../lib/storage.js'

const tag = col => ({ background:col+'18', border:`1px solid ${col}30`, color:col, borderRadius:4, padding:'2px 8px', fontSize:11, display:'inline-block', fontWeight:500 })

function TrendChart({ history }) {
  if (history.length < 2) return null
  const pts = history.slice(-10).map(m => Math.round(m.score/m.max*100))
  const W=500, H=80, mn=Math.min(...pts), mx=Math.max(...pts,mn+1)
  const x=i=>(i/(pts.length-1))*W
  const y=v=>H-((v-mn)/(mx-mn))*(H-14)-7
  const path=pts.map((v,i)=>`${i===0?'M':'L'}${x(i)},${y(v)}`).join(' ')
  const area=`${path} L${x(pts.length-1)},${H} L0,${H} Z`
  const avg=Math.round(pts.reduce((a,b)=>a+b,0)/pts.length)
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2 }}>SCORE TREND — LAST {pts.length} MOCKS</div>
        <div style={{ fontSize:11, color:'var(--muted)' }}>Avg <span style={{ color:'var(--orange)', fontWeight:700, fontFamily:'var(--mono)' }}>{avg}%</span></div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H+20}`} style={{ overflow:'visible' }}>
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--orange)" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="var(--orange)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#tg)"/>
        <path d={path} fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((v,i)=>(
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r="4" fill="var(--orange)"/>
            <text x={x(i)} y={y(v)-9} textAnchor="middle" fill="var(--dim)" fontSize="9" fontFamily="var(--mono)">{v}%</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function Progress({ user, history, weakness, onBack, onClear }) {
  const [confirmClear, setConfirmClear] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const handleClear = () => {
    if (confirmClear) { saveHistory([]); saveWeakness({}); setConfirmClear(false); onClear() }
    else { setConfirmClear(true); setTimeout(()=>setConfirmClear(false), 4000) }
  }

  const totAns = Object.values(weakness).reduce((a,v)=>a+v.t,0)
  const totCor = Object.values(weakness).reduce((a,v)=>a+v.c,0)
  const overallAcc = totAns>0 ? Math.round(totCor/totAns*100) : 0
  const latest = history.length>0 ? history[history.length-1] : null
  const pred = latest ? predictAIR(latest.score) : null
  const best = history.length>0 ? Math.max(...history.map(m=>m.pct)) : null
  const rev = [...history].reverse()

  const tabs = ['overview','chapters','history']

  if (history.length===0) return (
    <div className="page-in" style={{ padding:'32px 36px', maxWidth:700, margin:'0 auto' }}>
      <div style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Progress</div>
      <div style={{ fontSize:13, color:'var(--muted)', marginBottom:32 }}>Track your journey to NEET 2027</div>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:'60px', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>📊</div>
        <div style={{ fontSize:16, color:'var(--text)', marginBottom:8 }}>No data yet</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>Complete your first mock to start tracking your progress, AIR prediction, and weakness analysis.</div>
        <button onClick={onBack} style={{ background:'var(--orange)', border:'none', color:'#fff', borderRadius:8, padding:'10px 24px', fontSize:13, fontWeight:600 }}>Start First Mock →</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding:'32px 36px', maxWidth:820, margin:'0 auto' }}>
      <style>{`button:hover{filter:brightness(1.1)}`}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700 }}>Progress</div>
          <div style={{ fontSize:13, color:'var(--muted)', marginTop:3 }}>{history.length} mocks · {totAns} questions attempted</div>
        </div>
        <button onClick={handleClear} style={{ background:confirmClear?'#FF8B0018':'var(--card)', border:`1px solid ${confirmClear?'#FF8B0040':'var(--border)'}`, color:confirmClear?'#FF8B00':'var(--muted)', borderRadius:8, padding:'8px 14px', fontSize:12 }}>
          {confirmClear ? '⚠ Tap again to confirm' : 'Clear All'}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { v:history.length,          l:'Mocks',       c:'var(--orange)' },
          { v:overallAcc>0?overallAcc+'%':'—', l:'Accuracy', c:overallAcc>=60?'var(--green)':overallAcc>=40?'var(--gold)':'var(--pink)' },
          { v:best!==null?best+'%':'—', l:'Best Score',  c:'var(--blue)' },
          { v:pred?pred.airLow.toLocaleString():'—', l:'Latest AIR Est.', c:pred?.color||'var(--muted)' },
        ].map(s=>(
          <div key={s.l} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.c, fontFamily:'var(--mono)' }}>{s.v}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, marginBottom:24, background:'var(--surface)', borderRadius:10, padding:4, width:'fit-content', border:'1px solid var(--border)' }}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:'7px 16px', borderRadius:7, fontSize:12, fontWeight:activeTab===t?600:400, background:activeTab===t?'var(--card)':'none', border:activeTab===t?'1px solid var(--border)':'1px solid transparent', color:activeTab===t?'var(--text)':'var(--muted)', textTransform:'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab==='overview' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Trend */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'24px' }}>
            <TrendChart history={history}/>
          </div>
          {/* Subject cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {['Chemistry','Physics','Biology'].map(subj=>{
              const d=Object.entries(weakness).filter(([,v])=>v.sub===subj)
              const t=d.reduce((a,[,v])=>a+v.t,0), c=d.reduce((a,[,v])=>a+v.c,0)
              const a=t>0?Math.round(c/t*100):null
              const col=a===null?'var(--muted)':a>=60?'var(--green)':a>=40?'var(--gold)':'var(--pink)'
              return (
                <div key={subj} style={{ background:'var(--card)', border:`1px solid ${SC[subj]}20`, borderRadius:12, padding:'20px', textAlign:'center' }}>
                  <div style={{ fontSize:24 }}>{ICONS[subj]}</div>
                  <div style={{ fontSize:12, color:SC[subj], marginTop:6, fontWeight:600 }}>{subj}</div>
                  <div style={{ fontSize:26, fontWeight:800, color:col, marginTop:4, fontFamily:'var(--mono)' }}>{a!==null?a+'%':'—'}</div>
                  <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>{t} attempted</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CHAPTERS TAB */}
      {activeTab==='chapters' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'24px' }}>
          <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:18 }}>ALL CHAPTERS — WEAKEST FIRST</div>
          {Object.keys(weakness).length===0
            ? <div style={{ color:'var(--muted)', fontSize:13 }}>No chapter data yet. Complete a mock first.</div>
            : <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px' }}>
                {Object.entries(weakness).sort((a,b)=>{const ra=a[1].t>0?a[1].c/a[1].t:0,rb=b[1].t>0?b[1].c/b[1].t:0;return ra-rb}).map(([ch,d])=>{
                  const a=Math.round(d.c/d.t*100), col=a>=70?'var(--green)':a>=50?'var(--gold)':'var(--pink)'
                  return (
                    <div key={ch} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <span style={{ fontSize:9, background:(SC[d.sub]||'#888')+'15', color:SC[d.sub]||'#888', padding:'1px 5px', borderRadius:3 }}>{d.sub.slice(0,4)}</span>
                          <span style={{ fontSize:11, color:'var(--text)' }}>{ch}</span>
                        </div>
                        <span style={{ fontSize:11, color:col, fontFamily:'var(--mono)', fontWeight:600 }}>{a}% <span style={{ color:'var(--dim)', fontWeight:400 }}>({d.c}/{d.t})</span></span>
                      </div>
                      <div style={{ height:2, background:'var(--border)', borderRadius:1 }}>
                        <div style={{ height:2, width:`${a}%`, background:col, borderRadius:1 }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
          }
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab==='history' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'24px' }}>
          <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, marginBottom:18 }}>ALL ACTIVITY — NEWEST FIRST</div>
          {rev.map(m=>{
            const col=m.pct>=60?'var(--green)':m.pct>=40?'var(--gold)':'var(--pink)'
            const p=predictAIR(m.score)
            return (
              <div key={m.id} style={{ padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:5 }}>
                      <span style={tag(m.type==='Full NEET'?'var(--orange)':SC[m.type]||'#808080')}>{m.type}</span>
                      <span style={{ fontSize:11, color:'var(--muted)' }}>
                        {new Date(m.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                        {' · '}{new Date(m.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:14, fontSize:11, color:'var(--dim)' }}>
                      <span style={{ color:'var(--green)' }}>✅ {m.c}</span>
                      <span style={{ color:'var(--pink)' }}>❌ {m.w}</span>
                      <span>⭕ {m.s}</span>
                      <span>· {m.n}Q</span>
                      {m.timeSpent != null && <span>⏱ {Math.floor(m.timeSpent/60)}:{String(m.timeSpent%60).padStart(2,'0')}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:20, fontWeight:800, color:col, fontFamily:'var(--mono)' }}>{m.pct}%</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{m.score}/{m.max}</div>
                    <div style={{ fontSize:10, color:p.color, marginTop:2 }}>AIR ~{p.air2027.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
