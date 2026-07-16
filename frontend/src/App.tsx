import { useState, useEffect } from 'react'
import './index.css'
import Layout       from './components/Layout'
import AIAssistant  from './components/AIAssistant'
import Home         from './pages/Home'
import Analytics    from './pages/Analytics'
import Inventory    from './pages/Inventory'
import Profile      from './pages/Profile'
import Transactions from './pages/Transactions'
import type { PageId } from './types'

function App() {
  const getPageFromPath = (): PageId => {
    const path = window.location.pathname
    if (path === '/transactions') return 'transactions'
    if (path === '/inventory') return 'inventory'
    if (path === '/analytics') return 'analytics'
    if (path === '/profile') return 'profile'
    return 'home'
  }

  const [currentPage, setCurrentPage] = useState<PageId>(getPageFromPath)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const setPage = (page: PageId) => {
    setCurrentPage(page)
    const path = page === 'home' ? '/' : `/${page}`
    window.history.pushState(null, '', path)
  }

  return (
    <>
      <Layout currentPage={currentPage} setPage={setPage}>
        {currentPage === 'home'         && <Home />}
        {currentPage === 'inventory'    && <Inventory />}
        {currentPage === 'transactions' && <Transactions />}
        {currentPage === 'analytics'    && <Analytics />}
        {currentPage === 'profile'      && <Profile />}
      </Layout>
      <AIAssistant />
    </>
  )
}

export default App
