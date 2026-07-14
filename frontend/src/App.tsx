import { useState } from 'react'
import './index.css'
import Layout    from './components/Layout'
import Home      from './pages/Home'
import Analytics from './pages/Analytics'
import Inventory from './pages/Inventory'
import Profile   from './pages/Profile'
import type { PageId } from './types'

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home')

  return (
    <Layout currentPage={currentPage} setPage={setCurrentPage}>
      {currentPage === 'home'      && <Home />}
      {currentPage === 'inventory' && <Inventory />}
      {currentPage === 'analytics' && <Analytics />}
      {currentPage === 'profile'   && <Profile />}
    </Layout>
  )
}

export default App
