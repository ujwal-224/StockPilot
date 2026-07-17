import { useState, useEffect } from 'react'
import './index.css'
import Layout       from './components/Layout'
import AIAssistant  from './components/AIAssistant'
import Home         from './pages/Home'
import Analytics    from './pages/Analytics'
import Inventory    from './pages/Inventory'
import Profile      from './pages/Profile'
import Transactions from './pages/Transactions'
import Team         from './pages/Team'
import SignIn       from './pages/SignIn'
import SignUp       from './pages/SignUp'
import ProfileSetup from './pages/ProfileSetup'
import type { PageId } from './types'
import { useAuth } from './context/AuthContext'

function App() {
  const { session, loading } = useAuth()
  const getPageFromPath = (): PageId => {
    const path = window.location.pathname
    if (path === '/transactions') return 'transactions'
    if (path === '/inventory') return 'inventory'
    if (path === '/analytics') return 'analytics'
    if (path === '/profile') return 'profile'
    if (path === '/team') return 'team'
    return 'home'
  }

  const [currentPage, setCurrentPage] = useState<PageId>(getPageFromPath)
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath())
      setPathname(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const setPage = (page: PageId) => {
    setCurrentPage(page)
    const path = page === 'home' ? '/' : `/${page}`
    window.history.pushState(null, '', path)
    setPathname(path)
  }

  const navigateAuth = (path: '/signin' | '/signup') => {
    window.history.pushState(null, '', path)
    setPathname(path)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary font-semibold">Loading StockPilot…</div>

  if (!session) {
    return pathname === '/signup'
      ? <SignUp onShowSignIn={() => navigateAuth('/signin')} />
      : <SignIn onShowSignUp={() => navigateAuth('/signup')} />
  }

  // Onboarding route protection
  if (!session.shop.profileCompleted) {
    return <ProfileSetup />
  }

  return (
    <>
      <Layout currentPage={currentPage} setPage={setPage}>
        {currentPage === 'home'         && <Home />}
        {currentPage === 'inventory'    && <Inventory />}
        {currentPage === 'transactions' && <Transactions />}
        {currentPage === 'analytics'    && <Analytics />}
        {currentPage === 'team'         && (session.membership.role === 'OWNER' ? <Team /> : <Home />)}
        {currentPage === 'profile'      && <Profile />}
      </Layout>
      <AIAssistant />
    </>
  )
}

export default App
