import { useEffect, useState, useRef } from 'react'
import type { PageId, AppNotification } from '../types'
import {
  getNotifications,
  markAllAsRead,
  getNotifIconColor
} from '../services/notificationService'
import { useAuth } from '../context/AuthContext'

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: PageId; icon: string; label: string }[] = [
  { id: 'home',         icon: 'home',         label: 'Home'         },
  { id: 'inventory',    icon: 'inventory_2',  label: 'Inventory'    },
  { id: 'transactions', icon: 'receipt_long', label: 'Transactions' },
  { id: 'analytics',    icon: 'bar_chart',    label: 'Analytics'    },
  { id: 'team',         icon: 'groups',       label: 'Team'         },
  { id: 'profile',      icon: 'person',       label: 'Profile'      },
]

const PAGE_META: Record<PageId, { title: string; subtitle?: string }> = {
  home:         { title: 'Ganesh Kirana Store' },
  inventory:    { title: 'Inventory' },
  transactions: { title: 'Transactions' },
  analytics:    { title: 'Analytics' },
  team:         { title: 'Team',              subtitle: 'Workers & access' },
  profile:      { title: 'Profile',            subtitle: 'Settings & Account' },
  'profile-setup': { title: 'Shop setup',       subtitle: 'Complete your profile' },
}

function getGreeting(name: string) {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return `Good morning, ${name}`
  if (h >= 12 && h < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

const getRelativeTime = (dateStr: string) => {
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  if (diffMs < 0) return 'Just now'

  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) {
    if (now.getDate() === d.getDate()) {
      return 'Today'
    }
    return 'Yesterday'
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}


// ─── Types ────────────────────────────────────────────────────────────────────

interface LayoutProps {
  currentPage: PageId
  setPage: (p: PageId) => void
  children: React.ReactNode
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ currentPage, setPage }: { currentPage: PageId; setPage: (p: PageId) => void }) {
  const { session } = useAuth()
  const navItems = NAV_ITEMS.filter((item) => item.id !== 'team' || session?.membership.role === 'OWNER')
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-ledger-surface border-r border-ledger-hairline z-50">
      {/* Brand – stacked: icon on top, wordmark below */}
      <div className="px-4 py-4 hairline-bottom flex flex-col items-center gap-2">
        {/* Icon-only crop: original logo is 1024×1024, icon lives in left ~27% horizontally, centered vertically.
            At backgroundSize 330%, a 72px div → image renders at ~237px.
            Icon spans 0–64px of that → left-aligned with a tiny left offset. */}
        <div
          style={{
            width: 48,
            height: 48,
            backgroundImage: 'url(/stockpilot-logo.png)',
            backgroundSize: '410% auto',
            backgroundPosition: '5% 50%',
            backgroundRepeat: 'no-repeat',
          }}
          aria-hidden="true"
        />
        {/* Wordmark – exact brand maroon from logo */}
        <span
          style={{
            color: '#7B1D2A',
            fontFamily: 'Georgia, serif',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}
        >
          StockPilot
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-grow p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
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
    </aside>
  )
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({ currentPage, setPage }: { currentPage: PageId; setPage: (p: PageId) => void }) {
  const { session } = useAuth()
  const navItems = NAV_ITEMS.filter((item) => item.id !== 'team' || session?.membership.role === 'OWNER')
  return (
    <nav className="lg:hidden fixed bottom-0 w-full bg-ledger-surface border-t border-ledger-hairline safe-pb flex justify-around items-center h-row-height-min z-50">
      {navItems.map((item) => {
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
  const { session } = useAuth()
  const meta = currentPage === 'home' ? { ...PAGE_META.home, title: session?.shop.name || PAGE_META.home.title } : PAGE_META[currentPage]
  const subtitle = currentPage === 'home' ? getGreeting(session?.user.name || '') : meta.subtitle
  const showFab  = currentPage === 'home' || currentPage === 'inventory'

  const [notifications, setNotifications] = useState<AppNotification[]>(() => getNotifications())
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const prevOpenRef = useRef(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(getNotifications())
    }
    window.addEventListener('notifications-updated', handleUpdate)
    return () => window.removeEventListener('notifications-updated', handleUpdate)
  }, [])

  useEffect(() => {
    if (prevOpenRef.current && !isNotifOpen && notifications.length > 0) {
      markAllAsRead()
    }
    prevOpenRef.current = isNotifOpen
  }, [isNotifOpen, notifications])

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      const wrapper = document.getElementById('notifications-wrapper')
      if (wrapper && !wrapper.contains(e.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])

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
            {currentPage === 'home' ? (
              <img
                src="/stockpilot-logo.png"
                alt="StockPilot"
                className="h-9 w-auto object-contain lg:hidden"
              />
            ) : (
              <button
                onClick={() => setPage('home')}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors flex-shrink-0"
                title="Back to Home"
              >
                <span className="material-symbols-outlined text-primary">arrow_back</span>
              </button>
            )}
            <div className={currentPage === 'home' ? "hidden lg:block" : ""}>
              <h1 className="font-headline-sm text-base md:text-lg text-primary leading-tight">
                {meta.title}
              </h1>
              {subtitle && (
                <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" id="notifications-wrapper">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors active:scale-95 relative"
              >
                <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-stock-red text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-ledger-surface border border-bahi-hairline rounded-lg shadow-xl py-2 z-50 max-h-[400px] overflow-y-auto">
                  <div className="px-4 py-2 border-b border-ledger-divider flex justify-between items-center">
                    <span className="font-bold text-xs uppercase text-secondary tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-stock-red hover:underline focus:outline-none uppercase tracking-wider"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-ledger-divider">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-secondary font-body-sm text-sm">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const relativeTime = getRelativeTime(new Date(notif.timestamp).toISOString())
                        const iconColor = getNotifIconColor(notif.type)
                        return (
                          <div
                            key={notif.id}
                            className={`px-4 py-3 hover:bg-surface-container-high transition-colors flex items-start gap-3 ${
                              notif.read ? 'opacity-60' : 'bg-primary-container/[0.03]'
                            }`}
                          >
                            <span className={`material-symbols-outlined text-[20px] mt-0.5 ${iconColor} flex-shrink-0`}>
                              {notif.icon}
                            </span>
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-baseline gap-2">
                                <h4 className="font-bold text-xs uppercase text-on-surface tracking-wide truncate">
                                  {notif.title}
                                </h4>
                                <span className="font-body-sm text-[10px] text-outline flex-shrink-0">
                                  {relativeTime}
                                </span>
                              </div>
                              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5 leading-normal">
                                {notif.description}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
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
