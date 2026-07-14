import { useEffect } from 'react'
import type { PageId } from '../types'

// ─── Constants ───────────────────────────────────────────────────────────────

const OWNER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB5v_YyKwArTgHYA4vvSI1OQKQUE7WhA7eycnjgq2hLjfYaWUNZbmw4LOX_zZEsFbiWB7qCWcazN_Tf9Hp1mbwFrDkrQLNrEobWV8kqjDsTmYRfwl_XojO7ORmxJI81rPY29pYlVMtHmtp6lEUZarHGDDtiplMmKNtpaT1ZG82qrBahbAhyzfIof8UNkVbsnA1hcnxGbJXlqqeKOhMOcZaEtcwygiCDP8wJQY2Ilyiak3_V5GAWk5nrfqwTvF33pxfIus7gvGwA2ZwF'

const NAV_ITEMS: { id: PageId; icon: string; label: string }[] = [
  { id: 'home',      icon: 'home',        label: 'Home'      },
  { id: 'inventory', icon: 'inventory_2', label: 'Inventory' },
  { id: 'analytics', icon: 'bar_chart',   label: 'Analytics' },
  { id: 'profile',   icon: 'person',      label: 'Profile'   },
]

const PAGE_META: Record<PageId, { title: string; subtitle?: string }> = {
  home:      { title: 'Ganesh Kirana Store' },
  inventory: { title: 'Bahi-Khata AI',      subtitle: 'Inventory'       },
  analytics: { title: 'Bahi-Khata AI',      subtitle: 'Analytics'       },
  profile:   { title: 'Profile',            subtitle: 'Settings & Account' },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Good morning, Rajesh'
  if (h >= 12 && h < 17) return 'Good afternoon, Rajesh'
  return 'Good evening, Rajesh'
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface LayoutProps {
  currentPage: PageId
  setPage: (p: PageId) => void
  children: React.ReactNode
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ currentPage, setPage }: { currentPage: PageId; setPage: (p: PageId) => void }) {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-ledger-surface border-r border-ledger-hairline z-50">
      {/* Brand */}
      <div className="p-6 hairline-bottom flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed border border-outline-variant flex-shrink-0">
          <img className="w-full h-full object-cover" src={OWNER_AVATAR} alt="Store owner" />
        </div>
        <div className="min-w-0">
          <p className="font-headline-sm text-sm text-primary font-semibold leading-tight truncate">
            Ganesh Kirana
          </p>
          <p className="font-body-sm text-xs text-on-surface-variant truncate">Store Dashboard</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-grow p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = item.id === currentPage
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                active
                  ? 'bg-primary-container text-white font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-body-md text-sm">{item.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
            </button>
          )
        })}
      </nav>

      {/* CTA */}
      <div className="p-4 hairline-top">
        <button className="w-full bg-brand-maroon text-white rounded-xl py-3 flex items-center justify-center gap-2 font-body-md font-semibold text-sm hover:bg-primary transition-colors active:scale-95 shadow-sm">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Stock Entry
        </button>
      </div>
    </aside>
  )
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({ currentPage, setPage }: { currentPage: PageId; setPage: (p: PageId) => void }) {
  return (
    <nav className="lg:hidden fixed bottom-0 w-full bg-ledger-surface border-t border-ledger-hairline safe-pb flex justify-around items-center h-row-height-min z-50">
      {NAV_ITEMS.map((item) => {
        const active = item.id === currentPage
        return (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`flex flex-col items-center justify-center transition-all active:scale-95 py-1 px-3 rounded-xl ${
              active ? 'text-primary font-bold' : 'text-secondary hover:bg-surface-container-high'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-[12px] font-body-sm mt-0.5">{item.label}</span>
            {active && <div className="w-1 h-1 bg-primary rounded-full mt-0.5" />}
          </button>
        )
      })}
    </nav>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function Layout({ currentPage, setPage, children }: LayoutProps) {
  const meta     = PAGE_META[currentPage]
  const subtitle = currentPage === 'home' ? getGreeting() : meta.subtitle
  const showFab  = currentPage === 'home' || currentPage === 'inventory'

  // Mobile touch feedback
  useEffect(() => {
    const add    = (e: TouchEvent) => (e.target as HTMLElement).closest('a, button')?.classList.add('opacity-70')
    const remove = (e: TouchEvent) => (e.target as HTMLElement).closest('a, button')?.classList.remove('opacity-70')
    document.addEventListener('touchstart', add)
    document.addEventListener('touchend',   remove)
    return () => {
      document.removeEventListener('touchstart', add)
      document.removeEventListener('touchend',   remove)
    }
  }, [])

  return (
    <div className="font-body-md text-on-surface min-h-screen flex">
      {/* ── Desktop Sidebar ── */}
      <Sidebar currentPage={currentPage} setPage={setPage} />

      {/* ── Page shell ── */}
      <div className="flex flex-col flex-grow lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-ledger-surface hairline-bottom flex justify-between items-center h-row-height-min px-5 md:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            {/* Mobile: avatar on Home, menu icon on other pages */}
            {currentPage === 'home' ? (
              <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-fixed border border-outline-variant lg:hidden">
                <img className="w-full h-full object-cover" src={OWNER_AVATAR} alt="Store owner" />
              </div>
            ) : (
              <button className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-primary">menu</span>
              </button>
            )}
            <div>
              <h1 className="font-headline-sm text-base md:text-lg text-primary leading-tight">
                {meta.title}
              </h1>
              {subtitle && (
                <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search – visible md+ */}
            <button className="hidden md:flex items-center gap-2 bg-surface-container rounded-full px-4 py-2 text-on-surface-variant font-body-sm text-sm hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span className="hidden lg:inline">Search…</span>
            </button>

            {/* User initials badge (non-home pages) */}
            {currentPage !== 'home' && (
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-[10px] text-white font-bold select-none">
                SP
              </div>
            )}

            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors active:scale-95">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        {children}
      </div>

      {/* ── Mobile/Tablet Bottom Nav ── */}
      <BottomNav currentPage={currentPage} setPage={setPage} />

      {/* ── FAB (Home + Inventory on mobile) ── */}
      {showFab && (
        <button className="lg:hidden fixed right-5 bottom-20 md:bottom-24 w-14 h-14 bg-brand-maroon text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform z-40">
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      )}
    </div>
  )
}
