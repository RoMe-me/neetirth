import { useMemo, useState } from 'react'
import { HIGH_YIELD, ICONS, SC } from '../data/pyqBank.js'
import { getChapterAccuracy } from '../data/questionEngine.js'
import { getContentStats, DATA_QUALITY_NOTE } from '../lib/contentAudit.js'
import { OFFICIAL_RESOURCES, ROUTINES, STUDY_RULES } from '../data/studyData.js'

const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Biology']
const subjectColor = subject => subject === 'All' ? 'var(--orange)' : SC[subject]

function SectionLabel({ children, hint }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12, marginBottom:14 }}>
      <div style={{ fontSize:10, color:'var(--dim)', letterSpacing:2, textTransform:'uppercase' }}>{children}</div>
      {hint && <div style={{ fontSize:11, color:'var(--muted)' }}>{hint}</div>}
    </div>
  )
}

export default function StudyHub({ onStartMock, onPYQ, onAsk }) {
  const [subject, setSubject] = useState('All')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const stats = useMemo(() => getContentStats(), [])

  const chapters = useMemo(() => {
    const query = search.trim().toLowerCase()
    return stats.chapterCoverage.filter(item => {
      if (subject !== 'All' && item.subject !== subject) return false
      if (query && !item.chapter.toLowerCase().includes(query)) return false
      return true
    })
  }, [search, stats, subject])

  const featured = useMemo(() => {
    const items = Object.entries(HIGH_YIELD).flatMap(([sub, names]) => names.map(chapter => ({ chapter, subject:sub })))
    return items.filter(item => subject === 'All' || item.subject === subject).slice(0, 7)
  }, [subject])

  const startChapter = (item, count = 20) => onStartMock?.({
    isFull: false,
    type: 'chapter',
    subject: item.subject,
    chapters: [item.chapter],
    qCount: count,
  })

  return (
    <div className="page-in" style={{ padding:'32px 36px 64px', maxWidth:1120, margin:'0 auto' }}>
      <style>{`
        .study-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:16px}
        .study-three{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .study-resource:hover{border-color:var(--border2)!important;transform:translateY(-2px)}
        .study-resource{transition:transform .22s var(--eout),border-color .22s}
        @media(max-width:860px){.study-grid{grid-template-columns:1fr}.study-three{grid-template-columns:1fr}}
      `}</style>

      <header style={{ display:'flex', justifyContent:'space-between', gap:18, alignItems:'flex-end', marginBottom:28, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:11, color:'var(--orange)', letterSpacing:2, marginBottom:8 }}>THE STUDY HUB</div>
          <h1 style={{ fontSize:30, lineHeight:1.08, letterSpacing:-.5, margin:0 }}>Study with a route,<br/><span style={{ color:'var(--orange)' }}>not a pile of tabs.</span></h1>
          <p style={{ color:'var(--muted)', fontSize:13, lineHeight:1.7, maxWidth:560, margin:'12px 0 0' }}>
            Syllabus-first guidance, a searchable chapter map, free official sources, and the exact next action for your weak areas.
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={onPYQ} style={{ background:'var(--card)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:10, padding:'10px 14px', fontSize:12, fontWeight:600 }}>Browse PYQs</button>
          <button onClick={onAsk} style={{ background:'var(--orange)', border:'none', color:'#fff', borderRadius:10, padding:'10px 15px', fontSize:12, fontWeight:700 }}>Ask a doubt →</button>
        </div>
      </header>

      <div className="study-three" style={{ marginBottom:16 }}>
        {[
          { value:stats.chapters, label:'syllabus chapters mapped', color:'var(--orange)', note:'Use the official syllabus as the boundary.' },
          { value:stats.pyq, label:'PYQ-tagged items', color:'var(--blue)', note:'Kept separate from practice questions.' },
          { value:stats.practice, label:'NCERT practice items', color:'var(--green)', note:'Curated + expandable with online generation.' },
        ].map(card => (
          <div key={card.label} className="glass glass-card" style={{ padding:'18px 20px' }}>
            <div style={{ fontSize:27, color:card.color, fontFamily:'var(--mono)', fontWeight:800 }}>{card.value.toLocaleString()}</div>
            <div style={{ color:'var(--text)', fontSize:12, marginTop:5 }}>{card.label}</div>
            <div style={{ color:'var(--dim)', fontSize:10, lineHeight:1.5, marginTop:5 }}>{card.note}</div>
          </div>
        ))}
      </div>

      <div className="study-grid" style={{ marginBottom:16 }}>
        <section className="glass" style={{ padding:'22px 24px' }}>
          <SectionLabel hint="Start where marks are leaking">A focused 3-step route</SectionLabel>
          <div style={{ display:'grid', gap:10 }}>
            {STUDY_RULES.map(rule => (
              <div key={rule.number} style={{ display:'grid', gridTemplateColumns:'36px 1fr', gap:12, alignItems:'start', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:30, height:30, borderRadius:9, display:'grid', placeItems:'center', background:`${rule.color}16`, border:`1px solid ${rule.color}38`, color:rule.color, fontFamily:'var(--mono)', fontSize:11, fontWeight:700 }}>{rule.number}</div>
                <div>
                  <div style={{ fontSize:13, color:'var(--text)', fontWeight:700, marginBottom:4 }}>{rule.title}</div>
                  <div style={{ color:'var(--muted)', fontSize:12, lineHeight:1.65 }}>{rule.text}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass" style={{ padding:'22px 24px' }}>
          <SectionLabel hint="simple, sustainable">A routine that compounds</SectionLabel>
          <div style={{ display:'grid', gap:12 }}>
            {ROUTINES.map(routine => (
              <div key={routine.label} style={{ paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'baseline' }}>
                  <span style={{ color:'var(--muted)', fontSize:11 }}>{routine.label}</span>
                  <strong style={{ color:'var(--orange)', fontFamily:'var(--mono)', fontSize:15 }}>{routine.value}</strong>
                </div>
                <div style={{ color:'var(--dim)', fontSize:11, lineHeight:1.55, marginTop:4 }}>{routine.note}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'11px 12px', color:'var(--muted)', fontSize:11, lineHeight:1.6 }}>
            <span style={{ color:'var(--gold)', fontWeight:700 }}>Protect your energy:</span> one good review of mistakes is worth more than rushing through another random set.
          </div>
        </section>
      </div>

      <section className="glass" style={{ padding:'22px 24px', marginBottom:16 }}>
        <SectionLabel hint={`${chapters.length} chapter${chapters.length === 1 ? '' : 's'} shown`}>Syllabus map & chapter launchpad</SectionLabel>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
          {SUBJECTS.map(item => (
            <button key={item} onClick={() => setSubject(item)} style={{ padding:'7px 12px', borderRadius:8, border:`1px solid ${subject === item ? subjectColor(item)+'60' : 'var(--border)'}`, background:subject === item ? subjectColor(item)+'16' : 'var(--surface)', color:subject === item ? subjectColor(item) : 'var(--muted)', fontSize:12, fontWeight:subject === item ? 700 : 400 }}>{item === 'All' ? 'All subjects' : `${ICONS[item]} ${item}`}</button>
          ))}
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a chapter…" aria-label="Find a chapter" style={{ marginLeft:'auto', minWidth:190, flex:'1 1 190px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 11px', color:'var(--text)', outline:'none', fontSize:12 }} />
        </div>

        {featured.length > 0 && !search && (
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:16 }}>
            {featured.map(item => <button key={`${item.subject}-${item.chapter}`} onClick={() => startChapter(item, 20)} title="Start a 20-question high-yield drill" style={{ background:`${SC[item.subject]}10`, border:`1px solid ${SC[item.subject]}35`, color:SC[item.subject], borderRadius:6, padding:'5px 8px', fontSize:10 }}>{item.chapter}</button>)}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:8 }}>
          {(showAll ? chapters : chapters.slice(0, 12)).map(item => {
            const available = item.pyq + item.practice
            const accuracy = getChapterAccuracy(item.chapter)
            const accent = SC[item.subject] || 'var(--orange)'
            return (
              <div key={`${item.subject}-${item.chapter}`} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 13px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:30, height:30, borderRadius:9, display:'grid', placeItems:'center', background:`${accent}12`, color:accent, fontSize:14, flexShrink:0 }}>{ICONS[item.subject]}</div>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ color:'var(--text)', fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={item.chapter}>{item.chapter}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4, color:'var(--dim)', fontSize:10 }}>
                    <span>{item.pyq} PYQ</span><span>·</span><span>{item.practice} practice</span>
                    {accuracy !== null && <><span>·</span><span style={{ color:accuracy >= 70 ? 'var(--green)' : accuracy >= 50 ? 'var(--gold)' : 'var(--pink)' }}>{accuracy}% accuracy</span></>}
                  </div>
                </div>
                <button onClick={() => startChapter(item)} style={{ background:`${accent}14`, border:`1px solid ${accent}3d`, color:accent, borderRadius:7, padding:'7px 9px', fontSize:10, fontWeight:700, flexShrink:0 }}>Drill</button>
              </div>
            )
          })}
        </div>
        {chapters.length > 12 && <button onClick={() => setShowAll(value => !value)} style={{ display:'block', margin:'15px auto 0', background:'none', border:'none', color:'var(--muted)', fontSize:11, padding:6 }}>{showAll ? 'Show less ↑' : `Show all ${chapters.length} chapters ↓`}</button>}
        {chapters.length === 0 && <div style={{ color:'var(--muted)', fontSize:12, padding:'24px 0', textAlign:'center' }}>No chapter matches that search.</div>}
      </section>

      <section style={{ marginBottom:16 }}>
        <SectionLabel hint="free, official-first">Resource shelf</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:10 }}>
          {OFFICIAL_RESOURCES.map(resource => (
            <a key={resource.title} href={resource.url} target="_blank" rel="noreferrer" className="glass glass-card study-resource" style={{ padding:'16px 17px', textDecoration:'none', display:'block' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'center', marginBottom:10 }}>
                <span style={{ color:resource.color, fontSize:10, fontWeight:800, letterSpacing:1 }}>{resource.type.toUpperCase()}</span>
                <span style={{ color:'var(--dim)', fontSize:14 }}>↗</span>
              </div>
              <div style={{ color:'var(--text)', fontSize:13, fontWeight:700, lineHeight:1.35 }}>{resource.title}</div>
              <div style={{ color:resource.color, fontSize:10, marginTop:5 }}>{resource.source}</div>
              <div style={{ color:'var(--muted)', fontSize:11, lineHeight:1.55, marginTop:8 }}>{resource.description}</div>
            </a>
          ))}
        </div>
      </section>

      <section style={{ background:'rgba(255,193,69,.05)', border:'1px solid rgba(255,193,69,.18)', borderRadius:14, padding:'15px 17px', display:'flex', gap:12, alignItems:'flex-start' }}>
        <span style={{ fontSize:18 }}>◎</span>
        <div>
          <div style={{ color:'var(--gold)', fontSize:12, fontWeight:700, marginBottom:4 }}>{DATA_QUALITY_NOTE.title}</div>
          <div style={{ color:'var(--muted)', fontSize:11, lineHeight:1.65 }}>{DATA_QUALITY_NOTE.body} {DATA_QUALITY_NOTE.checked}</div>
          <div style={{ color:'var(--dim)', fontSize:10, marginTop:7 }}>Integrity scan: {stats.pyqAudit.valid}/{stats.pyqAudit.total} PYQ-tagged and {stats.practiceAudit.valid}/{stats.practiceAudit.total} practice records pass the required schema.</div>
        </div>
      </section>
    </div>
  )
}
