import { useState, useEffect, Component, lazy, Suspense } from 'react'
import Layout from './components/Layout.jsx'
import Landing from './pages/Landing.jsx'
import Home from './pages/Home.jsx'
import MockSetup from './pages/MockSetup.jsx'
import Exam from './pages/Exam.jsx'
import Results from './pages/Results.jsx'
import Progress from './pages/Progress.jsx'
import PYQBank from './pages/PYQBank.jsx'
import Practice from './pages/Practice.jsx'
import AskAI from './pages/AskAI.jsx'
import StudyHub from './pages/StudyHub.jsx'
import { getUser, getHistory, getWeakness, getResume, clearResume } from './lib/storage.js'

// Admin dashboard is lazy-loaded so its Supabase dependency doesn't bloat the
// main bundle. It is also access-gated internally via Supabase RLS.
const Admin = lazy(() => import('./pages/Admin.jsx'))

// Catches ANY render crash anywhere in the app and shows a clear, recoverable
// error screen instead of a silent blank page. This is the permanent fix for
// the entire class of "blank page" bugs — whatever throws next, the user sees
// exactly what broke instead of nothing at all.
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError:false, error:null } }
  static getDerivedStateFromError(error) { return { hasError:true, error } }
  componentDidCatch(error, info) { console.error('Neetirth crashed:', error, info) }
  handleReset = () => {
    try { clearResume() } catch {}
    this.setState({ hasError:false, error:null })
    window.location.reload()
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height:'100vh', background:'var(--bg)', color:'#e0e0f0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24, textAlign:'center', fontFamily:'inherit' }}>
          <div style={{ fontSize:40 }}>⚠️</div>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--orange)' }}>Something broke</div>
          <div style={{ fontSize:12, color:'var(--muted)', maxWidth:340 }}>
            {this.state.error?.message || 'Unknown error'} — this has been logged. Tap below to reset and reload.
          </div>
          <button onClick={this.handleReset} style={{ background:'var(--orange)18', border:'1px solid var(--orange)55', color:'var(--orange)', borderRadius:8, padding:'10px 24px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Reset & Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppInner() {
  const [page,      setPage]      = useState('loading')
  const [user,      setUser]      = useState(null)
  const [history,   setHistory]   = useState([])
  const [weakness,  setWeakness]  = useState({})
  const [resumeInfo,setResumeInfo]= useState(null)
  const [mockConfig,setMockConfig]= useState(null)
  const [examData,  setExamData]  = useState(null)
  const [results,   setResults]   = useState(null)

  useEffect(() => {
    const u=getUser(), h=getHistory(), w=getWeakness(), r=getResume()
    if(u) setUser(u)
    if(h) setHistory(h)
    if(w) setWeakness(w)
    if(r && r.qs?.length>0) setResumeInfo(r)

    // Route to admin page if URL path is /admin
    const path = window.location.pathname
    if (path === '/admin' || path === '/admin/') {
      setPage('admin')
    } else {
      setPage(u ? 'home' : 'landing')
    }
  }, [])

  const nav = p => setPage(p)

  const handleNav = id => {
    if(id==='home')     nav('home')
    if(id==='mock')     { setMockConfig(null); nav('mockSetup') }
    if(id==='progress') nav('progress')
    if(id==='pyq')      nav('pyq')
    if(id==='practice') nav('practice')
    if(id==='ask')      nav('ask')
    if(id==='study')    nav('study')
  }

  // Loading
  if(page==='loading') return (
    <div style={{ height:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ fontSize:28, fontWeight:800, color:'var(--orange)', letterSpacing:2 }}>नीतीर्थ</div>
      <div style={{ fontSize:11, color:'var(--dim)', letterSpacing:4 }}>LOADING…</div>
    </div>
  )

  // Admin — standalone page (no sidebar), access-gated internally
  if(page==='admin') return (
    <Suspense fallback={
      <div style={{ height:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ color:'var(--muted)', fontSize:13 }}>Loading admin…</div>
      </div>
    }>
      <Admin />
    </Suspense>
  )

  // Landing — no sidebar
  if(page==='landing') return (
    <>
      <Landing onEnter={u => { setUser(u); nav('home') }}/>
    </>
  )

  // Exam — fullscreen, no sidebar
  if(page==='exam') return (
    <>
      <Exam
        user={user} examData={examData||null} resumeInfo={resumeInfo}
        onFinish={(r,newH,newW) => { setResults(r); setHistory(newH); setWeakness(newW); setResumeInfo(null); setExamData(null); nav('results') }}
        onSaveResume={r => setResumeInfo(r)}
        onHome={() => { setExamData(null); nav('home') }}
      />
    </>
  )

  // All other pages — sidebar layout
  return (
    <Layout page={page} onNav={handleNav} user={user}>
      {page==='home' && (
        <Home
          user={user} history={history} weakness={weakness} resumeInfo={resumeInfo}
          onStartMock={cfg => { setMockConfig(cfg); nav('mockSetup') }}
          onResume={() => nav('exam')}
          onProgress={() => nav('progress')}
          onPYQ={() => nav('pyq')}
          onStudy={() => nav('study')}
          onLogout={() => { setUser(null); nav('landing') }}
        />
      )}
      {page==='mockSetup' && (
        <MockSetup
          user={user} initialCfg={mockConfig} weakness={weakness}
          onStart={data => { setExamData(data); nav('exam') }}
          onBack={() => nav('home')}
        />
      )}
      {page==='results' && results && (
        <Results
          user={user} results={results} history={history}
          onNewMock={() => nav('home')}
          onProgress={() => nav('progress')}
        />
      )}
      {page==='progress' && (
        <Progress
          user={user} history={history} weakness={weakness}
          onBack={() => nav('home')}
          onClear={() => { setHistory([]); setWeakness({}) }}
        />
      )}
      {page==='pyq' && <PYQBank/>}
      {page==='practice' && <Practice onProgressUpdate={({ history:nextHistory, weakness:nextWeakness }) => { setHistory(nextHistory); setWeakness(nextWeakness) }} />}
      {page==='ask' && <AskAI/>}
      {page==='study' && <StudyHub onStartMock={cfg => { setMockConfig(cfg); nav('mockSetup') }} onPYQ={() => nav('pyq')} onAsk={() => nav('ask')} />}
    </Layout>
  )
}

export default function App() {
  return <ErrorBoundary><AppInner/></ErrorBoundary>
}
