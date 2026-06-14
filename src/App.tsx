import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import { useStore } from './store/useStore'
import { useFirebaseSync } from './hooks/useFirebaseSync'
import { GachaPage } from './pages/GachaPage'
import { HomePage } from './pages/HomePage'
import { StudyPage } from './pages/StudyPage'
import { QuizPage } from './pages/QuizPage'
import { ResultPage } from './pages/ResultPage'
import { CollectionPage } from './pages/CollectionPage'
import { WordbookPage } from './pages/WordbookPage'
import { ReviewPage } from './pages/ReviewPage'
import { OnboardingSlides } from './components/OnboardingSlides'

export type AppPage = 'home' | 'study' | 'quiz' | 'result' | 'collection' | 'gacha' | 'wordbook' | 'review'

export default function App() {
  const { userId, setUserId, progress } = useStore()
  const [page, setPage] = useState<AppPage>('home')
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('shirolingo-onboarding-done')
  })
  const [showHelp, setShowHelp] = useState(false)
  useFirebaseSync()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setUserId(user?.uid ?? null)
      setLoading(false)
    })
    return unsub
  }, [setUserId])

  if (loading) return <SplashScreen />
  if (!userId) return <LoginPage />

  // Onboarding: on first launch (before the gacha) and whenever "?" help is tapped.
  if (showOnboarding || showHelp) {
    return (
      <OnboardingSlides onComplete={() => {
        setShowOnboarding(false)
        setShowHelp(false)
        localStorage.setItem('shirolingo-onboarding-done', 'true')
      }} />
    )
  }

  if (!progress || progress.ownedCharacterIds.length === 0) {
    return <GachaPage isFirstLaunch onComplete={() => setPage('home')} />
  }

  const nav = (p: AppPage) => setPage(p)

  switch (page) {
    case 'home': return <HomePage onNavigate={nav} onShowHelp={() => setShowHelp(true)} />
    case 'study': return <StudyPage onNavigate={nav} />
    case 'quiz': return <QuizPage onNavigate={nav} />
    case 'result': return <ResultPage onNavigate={nav} />
    case 'collection': return <CollectionPage onNavigate={nav} />
    case 'wordbook': return <WordbookPage onNavigate={nav} />
    case 'review': return <ReviewPage onNavigate={nav} />
    case 'gacha': return <GachaPage isFirstLaunch={false} onComplete={() => nav('home')} />
    default: return <HomePage onNavigate={nav} onShowHelp={() => setShowHelp(true)} />
  }
}

function SplashScreen() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', flexDirection:'column', gap:16 }}>
      <h1 style={{ color:'white', fontFamily:'monospace', fontSize:32 }}>Shirolingo</h1>
      <div style={{ color:'var(--text-secondary)', fontSize:14 }}>로딩 중...</div>
    </div>
  )
}

function LoginPage() {
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    try { await signInWithPopup(auth, googleProvider) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', height:'100vh', gap:32, padding:'0 32px' }}>
      <div style={{ textAlign:'center' }}>
        <h1 style={{ color:'white', fontFamily:'monospace', fontSize:36,
          fontWeight:900, letterSpacing:2, marginBottom:12 }}>Shirolingo</h1>
        <p style={{ background:'linear-gradient(90deg,#F5A623,#FFD54F)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          fontSize:15, lineHeight:1.6 }}>
          매일 매일 일본어 단어 공부를 해서<br/>모든 캐릭터들을 얻어보세요!
        </p>
      </div>
      <button className="btn-primary" onClick={handleLogin} disabled={loading}
        style={{ maxWidth:280 }}>
        {loading ? '로그인 중...' : 'Google로 로그인'}
      </button>
    </div>
  )
}
