import { useMemo, useState } from 'react'
import { CHAPTERS, HIGH_YIELD, SC, ICONS, getOfflineFull } from '../data/pyqBank.js'
import { getQuestions, buildChapterDepth, getChapterCount } from '../data/questionEngine.js'

const NEET_FORMAT = { Physics:45, Chemistry:45, Biology:90 }
const COUNT_OPTIONS = [10, 20, 30, 45]

const normalise = (q, index, fallbackSource = 'PYQ') => ({
  id: q.id || `${fallbackSource.toLowerCase()}_${index}`,
  question: q.question ?? q.q,
  options: q.options ?? q.o,
  correct: q.correct ?? q.a,
  explanation: q.explanation ?? q.e,
  chapter: q.chapter ?? q.ch,
  subject: q.subject ?? q.sub,
  difficulty: q.difficulty ?? q.d ?? q.diff ?? 'medium',
  pyq: q.pyq ?? (q.source === 'Practice' || q.source === 'Generated' ? false : fallbackSource === 'PYQ'),
  source: q.source || fallbackSource,
  year: q.year ?? q.y ?? null,
})

function BackButton({ onClick }) {
  return <button onClick={onClick} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:12, padding:'0 0 18px', cursor:'pointer' }}>← Back</button>
}

function ChoiceCard({ icon, title, description, color = 'var(--orange)', onClick }) {
  return (
    <button onClick={onClick} className="glass glass-card" style={{ textAlign:'left', padding:'18px', borderRadius:14, borderColor:`${color}28`, background:'var(--card)', color:'var(--text)' }}>
      <div style={{ width:34, height:34, display:'grid', placeItems:'center', borderRadius:10, background:`${color}16`, color, fontSize:18, marginBottom:12 }}>{icon}</div>
      <div style={{ color, fontSize:14, fontWeight:700, marginBottom:4 }}>{title}</div>
      <div style={{ color:'var(--muted)', fontSize:11, lineHeight:1.55 }}>{description}</div>
    </button>
  )
}

export default function MockSetup({ user, initialCfg, weakness = {}, onStart, onBack }) {
  const [step, setStep] = useState(() => initialCfg?.isFull ? 'full' : (initialCfg?.type || 'type'))
  const [subject, setSubject] = useState(initialCfg?.subject || null)
  const [selCh, setSelCh] = useState(initialCfg?.chapters || [])
  const [qCount, setQCount] = useState(initialCfg?.qCount || 20)
  const [topic, setTopic] = useState(initialCfg?.query || '')
  const [weakSel, setWeakSel] = useState(() => Object.entries(weakness || {}).filter(([, data]) => Number(data?.t) >= 2).sort((a,b) => (a[1].c/a[1].t) - (b[1].c/b[1].t)).slice(0, 6).map(([chapter]) => chapter))
  const [loading, setLoading] = useState(false)
  const [loadMsg, setLoadMsg] = useState('')
  const [err, setErr] = useState('')

  const weakChapters = useMemo(() => Object.entries(weakness || {})
    .filter(([, data]) => Number(data?.t) >= 2)
    .map(([chapter, data]) => ({ chapter, data, accuracy: Math.round((Number(data.c) || 0) / Math.max(1, Number(data.t) || 1) * 100) }))
    .sort((a,b) => a.accuracy - b.accuracy), [weakness])

  const startMock = async (cfg) => {
    setLoading(true); setErr(''); setLoadMsg('')
    try {
      await new Promise(resolve => setTimeout(resolve, 120))
      let raw = cfg.isFull
        ? getOfflineFull()
        : getQuestions({ subject:cfg.subject || null, chapters:cfg.chapters || [], query:cfg.query || '', count:cfg.qCount })

      // Sparse chapters get filled silently when online. If generation is not
      // configured, the student still receives every verified local question —
      // never a random question from another chapter.
      if (!cfg.isFull && raw.length < cfg.qCount && cfg.subject && cfg.chapters?.length) {
        for (const chapter of cfg.chapters) {
          await buildChapterDepth({
            subject: cfg.subject,
            chapter,
            requestedCount: cfg.qCount,
            onProgress: ({ current }) => setLoadMsg(`Preparing ${chapter}… ${current} questions available`),
          })
        }
        raw = getQuestions({ subject:cfg.subject || null, chapters:cfg.chapters || [], query:cfg.query || '', count:cfg.qCount })
      }

      if (!raw.length) throw new Error('No questions match this selection yet. Try another chapter or use the Study Hub to choose a broader drill.')
      onStart({
        qs: raw.map((question, index) => normalise(question, index, cfg.isFull ? 'PYQ' : question.source || 'Practice')),
        timeLimit: cfg.isFull ? 12000 : Math.max(600, raw.length * 72),
        cfg,
        startedAt: new Date().toISOString(),
      })
    } catch (error) {
      setErr(error?.message || 'Could not prepare this mock.')
    } finally {
      setLoading(false); setLoadMsg('')
    }
  }

  const selectSubject = next => {
    setSubject(next)
    setSelCh([])
  }

  const subjectCountOptions = subject === 'Biology' ? [10,20,45,90] : COUNT_OPTIONS
  const selectedAvailable = selCh.reduce((total, chapter) => total + getChapterCount(subject, chapter), 0)

  return (
    <div className="page-in" style={{ padding:'32px 36px 64px', maxWidth:760, margin:'0 auto' }}>
      <style>{`
        .mock-choice-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        @media(max-width:620px){.mock-choice-grid{grid-template-columns:1fr}}
      `}</style>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:26, fontSize:12, color:'var(--muted)' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--muted)', padding:0, fontSize:12 }}>Dashboard</button>
        <span>›</span><span style={{ color:'var(--text)' }}>{step === 'full' ? 'Full NEET mock' : step === 'weakness' ? 'Smart weakness mix' : step === 'topic' ? 'Topic drill' : step === 'subject' ? 'Subject mock' : step === 'chapter' ? 'Chapter mock' : 'Choose a mode'}</span>
      </div>

      {err && <div role="alert" style={{ background:'rgba(255,77,141,.08)', border:'1px solid rgba(255,77,141,.30)', borderRadius:10, padding:'12px 14px', marginBottom:18, color:'var(--pink)', fontSize:12, lineHeight:1.55 }}>⚠ {err}</div>}

      {step === 'type' && (
        <div>
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:24, fontWeight:800, marginBottom:6 }}>Choose your session</div>
            <div style={{ color:'var(--muted)', fontSize:13 }}>One clear choice now. The exam room stays focused.</div>
          </div>
          <div className="mock-choice-grid">
            <ChoiceCard icon="◉" title="Full NEET mock" description="180 questions · 720 marks · 45 Physics + 45 Chemistry + 90 Biology." color="var(--orange)" onClick={() => setStep('full')} />
            <ChoiceCard icon="◒" title="Subject-wise" description="One subject, all its chapters, with a flexible question count." color="var(--blue)" onClick={() => setStep('subject')} />
            <ChoiceCard icon="▤" title="Chapter-wise" description="Choose one or more chapters. No silent fallback to random chapters." color="var(--green)" onClick={() => setStep('chapter')} />
            <ChoiceCard icon="⌕" title="Topic drill" description="Search a concept or chapter name and turn the matching bank into a timed set." color="var(--violet)" onClick={() => setStep('topic')} />
            <ChoiceCard icon="⌁" title="Smart weakness mix" description="Build a mixed drill from the chapters where your accuracy is lowest." color="var(--pink)" onClick={() => setStep('weakness')} />
          </div>
        </div>
      )}

      {step === 'full' && (
        <div>
          <BackButton onClick={() => setStep('type')} />
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:24, fontWeight:800, marginBottom:6 }}>Full NEET mock</div>
            <div style={{ color:'var(--muted)', fontSize:13 }}>The current simulator follows the 180-question / 720-mark structure.</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
            {Object.entries(NEET_FORMAT).map(([name, count]) => <div key={name} style={{ background:'var(--card)', border:`1px solid ${SC[name]}35`, borderRadius:12, padding:'15px 10px', textAlign:'center' }}><div style={{ fontSize:22, marginBottom:5 }}>{ICONS[name]}</div><div style={{ color:SC[name], fontSize:11, fontWeight:700 }}>{name}</div><div style={{ color:'var(--text)', fontSize:22, fontFamily:'var(--mono)', fontWeight:800, marginTop:3 }}>{count}Q</div><div style={{ color:'var(--dim)', fontSize:10 }}>{count * 4} marks</div></div>)}
          </div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:11, padding:'13px 15px', color:'var(--muted)', fontSize:12, lineHeight:1.7, marginBottom:18 }}>
            <b style={{ color:'var(--text)' }}>Marking:</b> +4 correct · −1 incorrect · 0 unanswered &nbsp; <b style={{ color:'var(--text)' }}>Time:</b> 3 hours 20 minutes. The full offline paper uses the PYQ-tagged bank and never mixes in generated questions.
          </div>
          <button onClick={() => startMock({ isFull:true, type:'full' })} disabled={loading} style={{ width:'100%', padding:'13px', background:'var(--orange)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:800, opacity:loading?.65:1 }}>{loading ? 'Preparing paper…' : 'Start full mock →'}</button>
        </div>
      )}

      {(step === 'subject' || step === 'chapter') && !subject && (
        <div>
          <BackButton onClick={() => setStep('type')} />
          <div style={{ fontSize:24, fontWeight:800, marginBottom:6 }}>Select a subject</div>
          <div style={{ color:'var(--muted)', fontSize:13, marginBottom:22 }}>Your choice controls the chapter list and colour language.</div>
          <div style={{ display:'grid', gap:10 }}>
            {Object.keys(CHAPTERS).map(name => <button key={name} onClick={() => selectSubject(name)} className="glass glass-card" style={{ display:'flex', alignItems:'center', gap:14, textAlign:'left', padding:'15px 17px', borderRadius:12, color:'var(--text)', borderColor:`${SC[name]}30` }}><span style={{ fontSize:26 }}>{ICONS[name]}</span><span><b style={{ display:'block', color:SC[name], fontSize:14 }}>{name}</b><small style={{ color:'var(--muted)', fontSize:11 }}>{Object.values(CHAPTERS[name].sections).flat().length} chapters · {step === 'chapter' ? 'choose chapters' : 'all chapters'}</small></span><span style={{ marginLeft:'auto', color:'var(--dim)' }}>→</span></button>)}
          </div>
        </div>
      )}

      {step === 'subject' && subject && (
        <div>
          <BackButton onClick={() => setSubject(null)} />
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}><span style={{ fontSize:24 }}>{ICONS[subject]}</span><span style={{ color:SC[subject], fontSize:24, fontWeight:800 }}>{subject}</span></div>
          <div style={{ color:'var(--muted)', fontSize:13, marginBottom:22 }}>How deep should this session be?</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:22 }}>{subjectCountOptions.map(count => <button key={count} onClick={() => setQCount(count)} style={{ padding:'9px 16px', borderRadius:8, background:qCount === count ? `${SC[subject]}18` : 'var(--card)', border:`1px solid ${qCount === count ? `${SC[subject]}65` : 'var(--border)'}`, color:qCount === count ? SC[subject] : 'var(--muted)', fontSize:12, fontWeight:700 }}>{count}Q</button>)}</div>
          <button onClick={() => startMock({ isFull:false, type:'subject', subject, chapters:[], qCount })} disabled={loading} style={{ width:'100%', padding:'13px', background:SC[subject], border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:800, opacity:loading?.65:1 }}>{loading ? 'Preparing questions…' : `Start ${subject} mock →`}</button>
          {loadMsg && <div style={{ color:'var(--blue)', fontSize:11, marginTop:10 }}>⏳ {loadMsg}</div>}
        </div>
      )}

      {step === 'chapter' && subject && (
        <div>
          <BackButton onClick={() => setSubject(null)} />
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}><span style={{ fontSize:22 }}>{ICONS[subject]}</span><span style={{ color:SC[subject], fontSize:22, fontWeight:800 }}>{subject}</span></div>
          <div style={{ color:'var(--muted)', fontSize:12, marginBottom:20 }}>{selCh.length ? `${selCh.length} chapter${selCh.length > 1 ? 's' : ''} selected` : 'Select one or more chapters. Counts never pull from another chapter.'}</div>
          {Object.entries(CHAPTERS[subject].sections).map(([section, chapters]) => <div key={section} style={{ marginBottom:17 }}><div style={{ color:'var(--dim)', fontSize:10, letterSpacing:1.2, textTransform:'uppercase', marginBottom:8 }}>{section}</div><div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{chapters.map(chapter => { const selected = selCh.includes(chapter); const count = getChapterCount(subject, chapter); return <button key={chapter} onClick={() => setSelCh(current => selected ? current.filter(item => item !== chapter) : [...current, chapter])} title={`${count} local questions available; more can be prepared online`} style={{ padding:'6px 9px', borderRadius:7, background:selected ? `${SC[subject]}18` : 'var(--card)', border:`1px solid ${selected ? `${SC[subject]}65` : 'var(--border)'}`, color:selected ? SC[subject] : count ? 'var(--muted)' : 'var(--dim)', opacity:count ? 1 : .6, fontSize:10, fontWeight:selected ? 700 : 400 }}>{chapter} <span style={{ opacity:.65 }}>({count})</span></button> })}</div></div>)}
          {selCh.length > 0 && <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'17px', marginTop:6 }}><div style={{ color:'var(--muted)', fontSize:12, marginBottom:5 }}>Questions in this drill</div><div style={{ color:selectedAvailable >= qCount ? 'var(--green)' : 'var(--gold)', fontSize:10, lineHeight:1.5, marginBottom:11 }}>{selectedAvailable} saved local questions mapped · online generation can expand this pool when configured.</div><div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:15 }}>{COUNT_OPTIONS.map(count => <button key={count} onClick={() => setQCount(count)} style={{ padding:'8px 14px', borderRadius:8, background:qCount === count ? `${SC[subject]}18` : 'var(--surface)', border:`1px solid ${qCount === count ? `${SC[subject]}65` : 'var(--border)'}`, color:qCount === count ? SC[subject] : 'var(--muted)', fontSize:12, fontWeight:700 }}>{count}Q</button>)}</div><button onClick={() => startMock({ isFull:false, type:'chapter', subject, chapters:selCh, qCount })} disabled={loading} style={{ width:'100%', padding:'12px', background:SC[subject], border:'none', borderRadius:9, color:'#fff', fontSize:13, fontWeight:800, opacity:loading?.65:1 }}>{loading ? 'Preparing questions…' : `Start ${selCh.length} chapter drill →`}</button>{loadMsg && <div style={{ color:'var(--blue)', fontSize:11, marginTop:9 }}>⏳ {loadMsg}</div>}</div>}
        </div>
      )}

      {step === 'topic' && (
        <div>
          <BackButton onClick={() => setStep('type')} />
          <div style={{ fontSize:24, fontWeight:800, marginBottom:6 }}>Topic drill</div>
          <div style={{ color:'var(--muted)', fontSize:13, lineHeight:1.6, marginBottom:20 }}>Search the local PYQ + practice bank by concept, chapter, or explanation. This is a focused drill, not a promise that every web result is a verified PYQ.</div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:13 }}>{['All subjects','Physics','Chemistry','Biology'].map(name => { const value = name === 'All subjects' ? null : name; return <button key={name} onClick={() => setSubject(value)} style={{ padding:'7px 11px', borderRadius:8, background:(subject || null) === value ? `${value ? SC[value] : 'var(--orange)'}18` : 'var(--card)', border:`1px solid ${(subject || null) === value ? `${value ? SC[value] : 'var(--orange)'}58` : 'var(--border)'}`, color:(subject || null) === value ? (value ? SC[value] : 'var(--orange)') : 'var(--muted)', fontSize:11 }}>{value ? `${ICONS[value]} ${value}` : name}</button> })}</div>
          <input value={topic} onChange={event => setTopic(event.target.value)} placeholder="e.g. electrolysis, genetics, current electricity" autoFocus style={{ width:'100%', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', padding:'12px 13px', fontSize:13, outline:'none', marginBottom:13 }} />
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:18 }}>{(subject ? HIGH_YIELD[subject] : Object.values(HIGH_YIELD).flat()).slice(0,7).map(item => <button key={item} onClick={() => setTopic(item)} style={{ background:'var(--card)', border:'1px solid var(--border)', color:'var(--muted)', borderRadius:6, padding:'5px 8px', fontSize:10 }}>{item}</button>)}</div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:17 }}>{[10,20,30].map(count => <button key={count} onClick={() => setQCount(count)} style={{ padding:'8px 14px', borderRadius:8, background:qCount === count ? 'var(--violet)18' : 'var(--card)', border:`1px solid ${qCount === count ? 'var(--violet)65' : 'var(--border)'}`, color:qCount === count ? 'var(--violet)' : 'var(--muted)', fontSize:11 }}>{count}Q</button>)}</div>
          <button onClick={() => startMock({ isFull:false, type:'topic', subject, chapters:[], query:topic, qCount })} disabled={loading || !topic.trim()} style={{ width:'100%', padding:'12px', background:topic.trim() ? 'var(--violet)' : 'var(--border)', border:'none', borderRadius:9, color:topic.trim() ? '#fff' : 'var(--dim)', fontSize:13, fontWeight:800, opacity:loading?.65:1 }}>{loading ? 'Preparing questions…' : 'Start topic drill →'}</button>
        </div>
      )}

      {step === 'weakness' && (
        <div>
          <BackButton onClick={() => setStep('type')} />
          <div style={{ fontSize:24, fontWeight:800, marginBottom:6 }}>Smart weakness mix</div>
          <div style={{ color:'var(--muted)', fontSize:13, lineHeight:1.6, marginBottom:19 }}>Choose the chapters to target. The default selection starts with your lowest accuracy and combines only those chapters.</div>
          {weakChapters.length === 0 ? <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'28px 20px', textAlign:'center' }}><div style={{ fontSize:30, marginBottom:9 }}>◎</div><div style={{ color:'var(--text)', fontSize:14, fontWeight:700, marginBottom:5 }}>Your map is still empty</div><div style={{ color:'var(--muted)', fontSize:12, lineHeight:1.6 }}>Give one chapter or subject mock first. Neetirth will use the result to build this session next time.</div></div> : <><div style={{ display:'grid', gap:7, marginBottom:17 }}>{weakChapters.map(item => { const selected = weakSel.includes(item.chapter); const color = item.accuracy >= 70 ? 'var(--green)' : item.accuracy >= 50 ? 'var(--gold)' : 'var(--pink)'; return <button key={item.chapter} onClick={() => setWeakSel(current => selected ? current.filter(chapter => chapter !== item.chapter) : [...current, item.chapter])} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', textAlign:'left', background:selected ? `${color}10` : 'var(--card)', border:`1px solid ${selected ? `${color}55` : 'var(--border)'}`, borderRadius:9, padding:'10px 12px', color:'var(--text)' }}><span style={{ width:18, height:18, display:'grid', placeItems:'center', borderRadius:5, border:`1px solid ${selected ? color : 'var(--border2)'}`, background:selected ? color : 'transparent', color:selected ? '#151515' : 'transparent', fontSize:11 }}>✓</span><span style={{ flex:1, fontSize:12 }}>{item.chapter}<small style={{ display:'block', color:'var(--dim)', fontSize:10, marginTop:2 }}>{item.data.sub} · {item.data.c}/{item.data.t} correct</small></span><b style={{ color, fontFamily:'var(--mono)', fontSize:12 }}>{item.accuracy}%</b></button> })}</div><div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:15 }}>{[20,40,60].map(count => <button key={count} onClick={() => setQCount(count)} style={{ padding:'8px 14px', borderRadius:8, background:qCount === count ? 'var(--pink)18' : 'var(--card)', border:`1px solid ${qCount === count ? 'var(--pink)65' : 'var(--border)'}`, color:qCount === count ? 'var(--pink)' : 'var(--muted)', fontSize:11 }}>{count}Q</button>)}</div><button onClick={() => startMock({ isFull:false, type:'weakness', subject:null, chapters:weakSel, qCount })} disabled={loading || !weakSel.length} style={{ width:'100%', padding:'12px', background:weakSel.length ? 'var(--pink)' : 'var(--border)', border:'none', borderRadius:9, color:weakSel.length ? '#fff' : 'var(--dim)', fontSize:13, fontWeight:800, opacity:loading?.65:1 }}>{loading ? 'Preparing questions…' : `Start ${weakSel.length} chapter weakness mix →`}</button></>}
        </div>
      )}
    </div>
  )
}
