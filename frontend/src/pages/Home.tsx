import { useState, useEffect } from 'react'
import axios from 'axios'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MappedAttentionItem {
  id: string
  name: string
  units: string
  progressPct: number
  variant: 'danger' | 'warning'
}

interface MappedActivityItem {
  id: string
  type: string
  label: string
  time: string
  icon: string
}

// ─── Time Helper ─────────────────────────────────────────────────────────────

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NeedsAttentionRow({ item, isLast }: { item: MappedAttentionItem; isLast: boolean }) {
  const isDanger = item.variant === 'danger'
  return (
    <div className={`p-4 flex flex-col gap-2 ${isDanger ? 'margin-rule-red' : 'margin-rule-gold'} ${isLast ? '' : 'hairline-bottom'}`}>
      <div className="flex justify-between items-start gap-2">
        <span className="font-body-md font-semibold text-on-surface text-sm md:text-base">{item.name}</span>
        <span className={`font-number-data text-sm whitespace-nowrap ${isDanger ? 'text-error' : 'text-brand-turmeric'}`}>
          {item.units}
        </span>
      </div>
      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isDanger ? 'bg-error' : 'bg-brand-turmeric'}`}
          style={{ width: `${item.progressPct}%` }}
        />
      </div>
    </div>
  )
}

function ActivityRow({ item, isLast }: { item: MappedActivityItem; isLast: boolean }) {
  return (
    <div className={`margin-rule-maroon p-4 flex items-center gap-4 ${isLast ? '' : 'hairline-bottom'} hover:bg-surface-container-low transition-colors cursor-pointer`}>
      {item.type === 'voice' ? (
        <div className="w-12 h-12 flex-shrink-0 bg-secondary-fixed rounded-lg flex items-center justify-center text-on-secondary-fixed-variant">
          <span className="material-symbols-outlined">{item.icon}</span>
        </div>
      ) : (
        <div className="w-12 h-12 flex-shrink-0 bg-tertiary-fixed rounded-lg flex items-center justify-center text-on-tertiary-fixed-variant">
          <span className="material-symbols-outlined">{item.icon}</span>
        </div>
      )}

      <div className="flex-grow min-w-0">
        <p className="font-body-md text-on-surface truncate">{item.label}</p>
        <p className="font-body-sm text-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
          <span className="material-symbols-outlined text-[14px]">history</span>
          {item.time}
        </p>
      </div>

      <span className="material-symbols-outlined text-secondary flex-shrink-0">chevron_right</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    todayTransactions: 0,
  })
  const [attentionItems, setAttentionItems] = useState<MappedAttentionItem[]>([])
  const [activityItems, setActivityItems] = useState<MappedActivityItem[]>([])

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/dashboard`)
      .then((res) => {
        const { totalProducts, lowStockCount, todayTransactions, lowStockProducts, recentTransactions } = res.data.data

        setStats({
          totalProducts,
          lowStockCount,
          todayTransactions,
        })

        // Map low stock products to attention rows
        const mappedAttention = lowStockProducts.map((p: any) => ({
          id: p._id,
          name: p.name,
          units: `${p.stock} ${p.unit}`,
          progressPct: Math.min((p.stock / (p.threshold * 2)) * 100, 100),
          variant: p.stock === 0 ? ('danger' as const) : ('warning' as const),
        }))
        setAttentionItems(mappedAttention)

        // Map recent transactions to activity rows
        const mappedActivity = recentTransactions.map((t: any) => {
          const prodName = t.product ? t.product.name : 'Unknown Product'
          const prodUnit = t.product ? t.product.unit : 'units'
          let typeLabel = ''
          let icon = 'history'
          let rowType = 'voice'

          if (t.type === 'SALE') {
            typeLabel = 'Sold'
            icon = 'trending_down'
            rowType = 'voice'
          } else if (t.type === 'PURCHASE') {
            typeLabel = 'Purchased'
            icon = 'trending_up'
            rowType = 'chat'
          } else if (t.type === 'ADJUSTMENT') {
            typeLabel = 'Adjusted'
            icon = 'sync_alt'
            rowType = 'chat'
          }

          return {
            id: t._id,
            type: rowType,
            label: `${typeLabel} ${t.quantity} ${prodUnit} of ${prodName}`,
            time: formatRelativeTime(t.createdAt),
            icon,
          }
        })
        setActivityItems(mappedActivity)

        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-5xl mx-auto w-full flex items-center justify-center min-h-[50vh]">
        <div className="ledger-card p-8 text-center rounded-lg w-full max-w-md">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block animate-spin">sync</span>
          <p className="font-body-md text-on-surface-variant">Loading dashboard...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-5xl mx-auto w-full flex items-center justify-center min-h-[50vh]">
        <div className="ledger-card p-8 text-center rounded-lg w-full max-w-md">
          <span className="material-symbols-outlined text-4xl text-stock-red mb-2 block">error_outline</span>
          <p className="font-body-md text-stock-red">Unable to load dashboard data.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 space-y-6 md:space-y-8 max-w-5xl mx-auto w-full">
      {/* Page title – desktop only */}
      <div className="hidden lg:block">
        <h2 className="font-headline-lg text-2xl text-on-surface">Dashboard Overview</h2>
        <p className="font-body-sm text-sm text-on-surface-variant mt-1">{today}</p>
      </div>

      {/* ── Stat Row ── */}
      <section className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-ledger-surface rounded-card hairline-border margin-rule-maroon p-3 md:p-5 flex flex-col justify-between h-24 md:h-28 lg:h-32">
          <span className="font-body-sm text-[11px] md:text-xs leading-tight text-on-surface-variant uppercase tracking-wider">
            Total Items
          </span>
          <span className="font-number-display text-right text-primary text-xl md:text-2xl lg:text-3xl">
            {stats.totalProducts}
          </span>
        </div>

        <div className="bg-brand-turmeric rounded-card border border-[#9c7118] margin-rule-gold p-3 md:p-5 flex flex-col justify-between h-24 md:h-28 lg:h-32">
          <span className="font-body-sm text-[11px] md:text-xs leading-tight text-white uppercase tracking-wider font-semibold">
            Low Stock
          </span>
          <span className="font-number-display text-right text-white text-xl md:text-2xl lg:text-3xl">
            {stats.lowStockCount}
          </span>
        </div>

        <div className="bg-ledger-surface rounded-card hairline-border margin-rule-maroon p-3 md:p-5 flex flex-col justify-between h-24 md:h-28 lg:h-32">
          <span className="font-body-sm text-[11px] md:text-xs leading-tight text-on-surface-variant uppercase tracking-wider">
            Today's Updates
          </span>
          <span className="font-number-display text-right text-primary text-xl md:text-2xl lg:text-3xl">
            {stats.todayTransactions}
          </span>
        </div>
      </section>

      {/* ── Two-column grid (desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
        {/* Needs Attention */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-md text-lg md:text-xl text-on-surface">Needs Attention</h2>
            <button className="text-primary font-body-sm text-sm font-semibold underline decoration-2 underline-offset-4 hover:text-primary-container transition-colors">
              View All
            </button>
          </div>
          <div className="bg-ledger-surface rounded-card hairline-border overflow-hidden">
            {attentionItems.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-outline mb-2 block">check_circle</span>
                <p className="font-body-md text-on-surface-variant">All items are sufficiently stocked.</p>
              </div>
            ) : (
              attentionItems.map((item, idx) => (
                <NeedsAttentionRow key={item.id} item={item} isLast={idx === attentionItems.length - 1} />
              ))
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-md text-lg md:text-xl text-on-surface">Recent Activity</h2>
            <button className="text-primary font-body-sm text-sm font-semibold underline decoration-2 underline-offset-4 hover:text-primary-container transition-colors">
              View All
            </button>
          </div>
          <div className="bg-ledger-surface rounded-card hairline-border overflow-hidden">
            {activityItems.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-outline mb-2 block">history</span>
                <p className="font-body-md text-on-surface-variant">No recent transactions recorded.</p>
              </div>
            ) : (
              activityItems.map((item, idx) => (
                <ActivityRow key={item.id} item={item} isLast={idx === activityItems.length - 1} />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
