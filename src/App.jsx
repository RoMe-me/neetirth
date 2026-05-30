import { useState, useEffect } from 'react'
import Landing from './pages/Landing.jsx'
import Home from './pages/Home.jsx'
import MockSetup from './pages/MockSetup.jsx'
import Exam from './pages/Exam.jsx'
import Results from './pages/Results.jsx'
import Progress from './pages/Progress.jsx'
import { getUser, getHistory, getWeakness, getResume } from './lib/storage.js'

export default function App() {
  const [page, setPage] = useState('loading')
  const [user, setUser] = useState(null)
  const [history, setHistory] = useState([])
  const [weakness, setWeakness] = useState({})
  const [resumeInfo, setResumeInfo] = useState(null)
  const [mockConfig, setMockConfig] = useState(null)
  const [examData, setExamData] = useState(null)
  const [results, setResults] = useState(null)

  useEffect(() => {
    const u = getUser()
    const h = getHistory()
    const w = getWeakness()
    const r = getResume()
    if (u) setUser(u)
    if (h) setHistory(h)
    if (w) setWeakness(w)
    if (r && r.qs?.length > 0) setResumeInfo(r)
    setPage(u ? 'home' : 'landing')
  }, [])

  const nav = (p) => setPage(p)

  if (page === 'loading') return (
    <div style={{ height:'100vh', background:'#0A0A0F', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ fontSize:32, letterSpacing:4, color:'#FF6B00', fontWeight:800 }}>नीतीर्थ</div>
      <div style={{ fontSize:13, color:'#404060', letterSpacing:2 }}>NEETIRTH — Loading...</div>
    </div>
  )

  if (page === 'landing') return (
    <Landing onEnter={(u) => { setUser(u); nav('home') }} />
  )

  if (page === 'home') return (
    <Home
      user={user} history={history} weakness={weakness} resumeInfo={resumeInfo}
      onStartMock={(cfg) => { setMockConfig(cfg); nav('mockSetup') }}
      onResume={() => nav('exam')}
      onProgress={() => nav('progress')}
      onLogout={() => { setUser(null); nav('landing') }}
    />
  )

  if (page === 'mockSetup') return (
    <MockSetup
      user={user} initialCfg={mockConfig}
      onStart={(data) => { setExamData(data); nav('exam') }}
      onBack={() => nav('home')}
    />
  )

  if (page === 'exam') return (
    <Exam
      user={user} examData={examData} resumeInfo={resumeInfo}
      onFinish={(r, newHistory, newWeakness) => {
        setResults(r)
        setHistory(newHistory)
        setWeakness(newWeakness)
        setResumeInfo(null)
        nav('results')
      }}
      onHome={() => nav('home')}
    />
  )

  if (page === 'results') return (
    <Results
      user={user} results={results} history={history}
      onNewMock={() => nav('home')}
      onProgress={() => nav('progress')}
    />
  )

  if (page === 'progress') return (
    <Progress
      user={user} history={history} weakness={weakness}
      onBack={() => nav('home')}
      onClear={() => { setHistory([]); setWeakness({}) }}
    />
  )

  return null
}
