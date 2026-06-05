import { useState, useEffect } from 'react'
import Layout from './components/Layout.jsx'
import Landing from './pages/Landing.jsx'
import Home from './pages/Home.jsx'
import MockSetup from './pages/MockSetup.jsx'
import Exam from './pages/Exam.jsx'
import Results from './pages/Results.jsx'
import Progress from './pages/Progress.jsx'
import { getUser, getHistory, getWeakness, getResume } from './lib/storage.js'

export default function App() {
  const [page, setPage]           = useState('loading')
  const [user, setUser]           = useState(null)
  const [history, setHistory]     = useState([])
  const [weakness, setWeakness]   = useState({})
  const [resumeInfo, setResumeInfo] = useState(null)
  const [mockConfig, setMockConfig] = useState(null)
  const [examData, setExamData]   = useState(null)
  const [results, setResults]     = useState(null)

  useEffect(() => {
    const u=getUser(), h=getHistory(), w=getWeakness(), r=getResume()
    if (u) setUser(u)
    if (h) setHistory(h)
    if (w) setWeakness(w)
    if (r && r.qs?.length > 0) setResumeInfo(r)
    setPage(u ? 'home' : 'landing')
  }, [])

  const nav = (p) => setPage(p)

  const handleNav = (id) => {
    if (id === 'home')     nav('home')
    if (id === 'mock')     { setMockConfig(null); nav('mockSetup') }
    if (id === 'progress') nav('progress')
    if (id === 'pyq')      nav('home') // Phase 2
  }

  if (page === 'loading') return (
    <div style={{ height:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ fontSize:28, fontWeight:800, color:'var(--orange)', letterSpacing:2 }}>नीतीर्थ</div>
      <div style={{ fontSize:11, color:'var(--dim)', letterSpacing:4 }}>LOADING…</div>
    </div>
  )

  if (page === 'landing') return (
    <Landing onEnter={u => { setUser(u); nav('home') }}/>
  )

  // Exam is fullscreen — no sidebar
  if (page === 'exam') return (
    <Exam
      user={user} examData={examData||null} resumeInfo={resumeInfo}
      onFinish={(r, newH, newW) => { setResults(r); setHistory(newH); setWeakness(newW); setResumeInfo(null); nav('results') }}
      onHome={() => nav('home')}
    />
  )

  // All other pages use Layout with sidebar
  return (
    <Layout page={page} onNav={handleNav} user={user}>
      {page === 'home' && (
        <Home
          user={user} history={history} weakness={weakness} resumeInfo={resumeInfo}
          onStartMock={cfg => { setMockConfig(cfg); nav('mockSetup') }}
          onResume={() => nav('exam')}
          onProgress={() => nav('progress')}
          onLogout={() => { setUser(null); nav('landing') }}
        />
      )}
      {page === 'mockSetup' && (
        <MockSetup
          user={user} initialCfg={mockConfig}
          onStart={data => { setExamData(data); nav('exam') }}
          onBack={() => nav('home')}
        />
      )}
      {page === 'results' && results && (
        <Results
          user={user} results={results} history={history}
          onNewMock={() => nav('home')}
          onProgress={() => nav('progress')}
        />
      )}
      {page === 'progress' && (
        <Progress
          user={user} history={history} weakness={weakness}
          onBack={() => nav('home')}
          onClear={() => { setHistory([]); setWeakness({}) }}
        />
      )}
    </Layout>
  )
}
