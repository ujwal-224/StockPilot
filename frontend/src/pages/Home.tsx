import { useState, useEffect } from 'react'
import { getDashboardData } from '../services/dashboardService'
import { SummaryCard, LoadingCard } from '../components/SharedComponents'
import { getNotifications } from '../services/notificationService'
import { getAIInsights } from '../services/aiInsightsService'
import type { BackendProduct, AppNotification } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MappedAttentionItem {
  id: string
  name: string
  units: string
  thresholdUnits: string
  missingUnits: string
  progressPct: number
  variant: 'danger' | 'warning'
  priority: 'HIGH' | 'MEDIUM'
}

interface ParsedInsight {
  id: string
  title: string
  description: string
  icon: string
  bgClass: string
  iconClass: string
  priority?: string
}

interface RecommendedAction {
  id: string
  title: string
  description: string
  icon: string
  iconColor: string
  onClick: () => void
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

// ─── Navigation Helper ────────────────────────────────────────────────────────

const navigateTo = (path: string, searchQuery?: string) => {
  if (searchQuery) {
    localStorage.setItem('inventory-search', searchQuery)
  }
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

// ─── Local Components ─────────────────────────────────────────────────────────

// 1. Original Summary Card is imported from SharedComponents


// 2. Needs Attention Card
function NeedsAttentionCard({ item, onRestock }: { item: MappedAttentionItem; onRestock: () => void }) {
  const isHigh = item.priority === 'HIGH'
  const isDanger = item.variant === 'danger'

  return (
    <div className="bg-ledger-paper border border-ledger-hairline rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4">
      {/* Title / Priority Badge */}
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-bold text-sm sm:text-base text-on-surface leading-snug">{item.name}</h3>
        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full tracking-wider border ${
          isHigh
            ? 'bg-stock-red/10 text-stock-red border-stock-red/20'
            : 'bg-stock-turmeric/10 text-stock-turmeric border-stock-turmeric/20'
        }`}>
          {item.priority}
        </span>
      </div>

      {/* Stock metrics grid */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-ledger-hairline/60 text-center">
        <div>
          <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">Current</span>
          <p className="text-xs sm:text-sm font-bold text-on-surface mt-0.5">{item.units}</p>
        </div>
        <div>
          <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">Threshold</span>
          <p className="text-xs sm:text-sm font-medium text-outline mt-0.5">{item.thresholdUnits}</p>
        </div>
        <div>
          <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">Need</span>
          <p className="text-xs sm:text-sm font-bold text-stock-red mt-0.5">{item.missingUnits}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-medium text-outline">
          <span>Stock Level</span>
          <span>{Math.round(item.progressPct)}%</span>
        </div>
        <div className="w-full bg-ledger-surface h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isDanger ? 'bg-stock-red' : 'bg-stock-turmeric'}`}
            style={{ width: `${item.progressPct}%` }}
          />
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={onRestock}
        className="w-full h-10 flex items-center justify-center bg-primary text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary-container transition-all active:scale-95 shadow-sm"
      >
        <span className="material-symbols-outlined mr-1.5 text-base sm:text-lg">shopping_cart</span>
        Restock
      </button>
    </div>
  )
}

// 3. Activity Timeline
function ActivityTimeline({ activities }: { activities: AppNotification[] }) {
  if (activities.length === 0) {
    return (
      <div className="p-8 text-center bg-ledger-surface rounded-card border border-ledger-hairline">
        <span className="material-symbols-outlined text-4xl text-outline mb-2 block">history</span>
        <p className="font-body-md text-on-surface-variant">No recent activity recorded.</p>
      </div>
    )
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-ledger-hairline animate-fade-in">
      {activities.map((item) => {
        const timeStr = formatRelativeTime(new Date(item.timestamp).toISOString())

        let iconName = 'info'
        let iconColor = 'text-primary bg-primary/10 border-primary/20'

        if (item.type === 'sale') {
          iconName = 'sell'
          iconColor = 'text-stock-red bg-stock-red/10 border-stock-red/20'
        } else if (item.type === 'purchase') {
          iconName = 'local_shipping'
          iconColor = 'text-stock-green bg-stock-green/10 border-stock-green/20'
        } else if (item.type === 'low_stock' || item.type === 'out_of_stock') {
          iconName = 'warning'
          iconColor = 'text-stock-turmeric bg-stock-turmeric/10 border-stock-turmeric/20'
        } else if (item.type === 'adjustment') {
          iconName = 'sync_alt'
          iconColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20'
        } else if ((item.type as string) === 'ai') {
          iconName = 'auto_awesome'
          iconColor = 'text-primary bg-primary/10 border-primary/20'
        }

        return (
          <div key={item.id} className="relative flex gap-4 items-start group">
            {/* Timeline dot */}
            <div className={`absolute -left-[23px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center ${iconColor} z-10 transition-transform duration-300 group-hover:scale-110`}>
              <span className="material-symbols-outlined text-[12px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                {iconName}
              </span>
            </div>

            {/* Content card */}
            <div className="bg-ledger-paper border border-ledger-hairline rounded-xl p-3.5 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-300 flex-grow min-w-0">
              <div className="flex justify-between items-baseline gap-2">
                <h4 className="font-semibold text-sm text-on-surface truncate">{item.title}</h4>
                <span className="text-[10px] text-outline font-medium flex-shrink-0">{timeStr}</span>
              </div>
              <p className="text-xs text-outline mt-1 leading-normal">
                {item.description}
              </p>
            </div>
          </div>
        )
      })}
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
  const [activities, setActivities] = useState<AppNotification[]>([])
  const [insights, setInsights] = useState<string[]>([])
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [insightsError, setInsightsError] = useState(false)

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const loadInsights = () => {
    setInsightsLoading(true)
    setInsightsError(false)

    getAIInsights()
      .then(setInsights)
      .catch(() => {
        setInsights([])
        setInsightsError(true)
      })
      .finally(() => setInsightsLoading(false))
  }

  useEffect(() => {
    getDashboardData()
      .then((res) => {
        const { totalProducts, lowStockCount, todayTransactions, lowStockProducts } = res.data

        setStats({
          totalProducts,
          lowStockCount,
          todayTransactions,
        })

        const mappedAttention = lowStockProducts.map((p: BackendProduct) => {
          const missingQty = Math.max(0, p.threshold - p.stock)
          const priority = p.stock === 0 ? ('HIGH' as const) : ('MEDIUM' as const)
          return {
            id: p._id,
            name: p.name,
            units: `${p.stock} ${p.unit}`,
            thresholdUnits: `${p.threshold} ${p.unit}`,
            missingUnits: `${missingQty} ${p.unit}`,
            progressPct: Math.min((p.stock / (p.threshold || 1)) * 100, 100),
            variant: p.stock === 0 ? ('danger' as const) : ('warning' as const),
            priority,
            missingQty,
          }
        })
        setAttentionItems(mappedAttention)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadInsights()
  }, [])

  useEffect(() => {
    const loadNotifs = () => {
      const all = getNotifications()
      setActivities(all.slice(0, 5))
    }
    loadNotifs()
    window.addEventListener('notifications-updated', loadNotifs)
    return () => window.removeEventListener('notifications-updated', loadNotifs)
  }, [])

  // Parse insights into structured cards
  const parsedInsights = insights.map((insight, idx): ParsedInsight => {
    const text = insight.toLowerCase()
    let title = 'Recommendation'
    let icon = 'lightbulb'
    let bgClass = 'bg-primary/5 border-primary/10 text-primary'
    let iconClass = 'text-primary'
    let priority: string | undefined = undefined

    if (text.includes('critical') || text.includes('out of stock') || text.includes('critically')) {
      title = 'Critical Stock'
      icon = 'warning'
      bgClass = 'bg-stock-red/5 border-stock-red/10 text-stock-red'
      iconClass = 'text-stock-red'
      priority = 'High'
    } else if (text.includes('reorder') || text.includes('restock') || text.includes('needs restocking') || text.includes('reordered')) {
      title = 'Restocking'
      icon = 'shopping_cart'
      bgClass = 'bg-stock-turmeric/5 border-stock-turmeric/10 text-stock-turmeric'
      iconClass = 'text-stock-turmeric'
    } else if (text.includes('health') || text.includes('good') || text.includes('moderate') || text.includes('status')) {
      title = 'Inventory Health'
      icon = 'monitoring'
      bgClass = 'bg-blue-500/5 border-blue-500/10 text-blue-600 font-bold'
      iconClass = 'text-blue-600'
    } else if (text.includes('attention')) {
      title = 'Recommendation'
      icon = 'info'
      bgClass = 'bg-purple-500/5 border-purple-500/10 text-purple-600'
      iconClass = 'text-purple-600'
    }

    return {
      id: `insight-${idx}`,
      title,
      description: insight,
      icon,
      bgClass,
      iconClass,
      priority
    }
  })

  // Dynamic Recommended Actions
  const recommendedActions = (): RecommendedAction[] => {
    const actions: RecommendedAction[] = []

    if (attentionItems.length > 0) {
      const item = attentionItems[0]
      actions.push({
        id: 'restock-item',
        title: `Restock ${item.name}`,
        description: `Order ${item.missingUnits} to reach safety threshold.`,
        icon: 'shopping_cart',
        iconColor: 'text-stock-red bg-stock-red/10 border-stock-red/20',
        onClick: () => navigateTo('/inventory', item.name)
      })
    } else {
      actions.push({
        id: 'restock-general',
        title: 'Restock Products',
        description: 'Verify current store levels and create new purchase transactions.',
        icon: 'shopping_cart',
        iconColor: 'text-primary bg-primary/10 border-primary/20',
        onClick: () => navigateTo('/inventory')
      })
    }

    if (attentionItems.length > 1) {
      const item = attentionItems[1]
      actions.push({
        id: 'increase-threshold',
        title: `Increase inventory for ${item.name}`,
        description: 'Configure higher safety levels for this popular item.',
        icon: 'trending_up',
        iconColor: 'text-stock-turmeric bg-stock-turmeric/10 border-stock-turmeric/20',
        onClick: () => navigateTo('/inventory', item.name)
      })
    } else {
      actions.push({
        id: 'increase-threshold-general',
        title: 'Review Safety Stock',
        description: 'Update minimum threshold configurations for optimal logistics.',
        icon: 'trending_up',
        iconColor: 'text-stock-turmeric bg-stock-turmeric/10 border-stock-turmeric/20',
        onClick: () => navigateTo('/inventory')
      })
    }

    actions.push({
      id: 'review-health',
      title: 'Review inventory health',
      description: 'Audit product counts and sales performance dashboards.',
      icon: 'monitoring',
      iconColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      onClick: () => navigateTo('/analytics')
    })

    actions.push({
      id: 'check-slow-moving',
      title: 'Check slow-moving products',
      description: 'Find stagnant stock to run seasonal discount sales.',
      icon: 'hourglass_empty',
      iconColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      onClick: () => navigateTo('/analytics')
    })

    return actions
  }

  if (loading) {
    return <LoadingCard message="Loading dashboard..." fullPage={true} />
  }

  if (error) {
    return (
      <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-5xl mx-auto w-full flex items-center justify-center min-h-[50vh]">
        <div className="ledger-card p-8 text-center rounded-lg w-full max-w-md bg-ledger-paper border border-ledger-hairline">
          <span className="material-symbols-outlined text-4xl text-stock-red mb-2 block">error_outline</span>
          <p className="font-body-md text-stock-red">Unable to load dashboard data.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 space-y-8 md:space-y-10 max-w-5xl mx-auto w-full">
      {/* Header section */}
      <div>
        <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface">Dashboard Overview</h2>
        <p className="font-body-sm text-sm text-outline mt-1">{today}</p>
      </div>

      {/* ── KPI Stat Row ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <SummaryCard
          title="Total Items"
          value={stats.totalProducts}
          variant="maroon"
          icon="inventory_2"
        />
        <SummaryCard
          title="Low Stock"
          value={stats.lowStockCount}
          variant={stats.lowStockCount > 0 ? 'low-stock' : 'default'}
          icon="warning"
        />
        <SummaryCard
          title="Today's Updates"
          value={stats.todayTransactions}
          variant="gold"
          icon="update"
        />
      </section>

      {/* ── AI Insights ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <h2 className="font-bold text-lg sm:text-xl text-on-surface">AI Insights</h2>
          </div>
          <button
            type="button"
            onClick={loadInsights}
            disabled={insightsLoading}
            className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:text-primary-container transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-lg ${insightsLoading ? 'animate-spin' : ''}`}>refresh</span>
            <span>Refresh</span>
          </button>
        </div>

        {insightsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-xl border border-ledger-hairline bg-ledger-paper animate-pulse h-24">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex-shrink-0" />
                <div className="flex-grow space-y-2.5 mt-1">
                  <div className="h-3 rounded bg-surface-container-high w-1/3" />
                  <div className="h-4 rounded bg-surface-container-high w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : insightsError ? (
          <div className="p-5 text-center bg-ledger-paper rounded-2xl border border-ledger-hairline">
            <p className="text-sm font-medium text-stock-red">Unable to generate AI insights. Please check config or try again.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {parsedInsights.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 p-4 rounded-2xl border ${item.bgClass} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
              >
                <div className="p-2 rounded-xl bg-ledger-paper border border-ledger-hairline flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className={`material-symbols-outlined ${item.iconClass}`} style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                    {item.icon}
                  </span>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-outline">{item.title}</span>
                    {item.priority && (
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-stock-red/10 border border-stock-red/20 text-stock-red tracking-wider">
                        {item.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium mt-1 leading-snug text-on-surface">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Recommended Actions ── */}
      <section className="space-y-4">
        <h2 className="font-bold text-lg sm:text-xl text-on-surface">Recommended Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendedActions().map((action) => (
            <div
              key={action.id}
              onClick={action.onClick}
              className="bg-ledger-paper border border-ledger-hairline rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-3 cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-xl ${action.iconColor} border flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {action.icon}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-on-surface leading-tight group-hover:text-primary transition-colors">{action.title}</h4>
                <p className="text-xs text-outline mt-1 leading-normal">{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Two-column grid (desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Needs Attention */}
        <section className="space-y-4">
          <h2 className="font-bold text-lg sm:text-xl text-on-surface">Needs Attention</h2>
          {attentionItems.length === 0 ? (
            <div className="p-10 text-center bg-ledger-paper rounded-2xl border border-ledger-hairline">
              <span className="material-symbols-outlined text-4xl text-stock-green mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <p className="text-sm font-semibold text-on-surface">All items are sufficiently stocked.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {attentionItems.slice(0, 4).map((item) => (
                <NeedsAttentionCard
                  key={item.id}
                  item={item}
                  onRestock={() => navigateTo('/inventory', item.name)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg sm:text-xl text-on-surface">Recent Activity</h2>
            <button
              onClick={() => navigateTo('/transactions')}
              className="text-primary text-xs sm:text-sm font-semibold hover:text-primary-container transition-colors"
            >
              View All
            </button>
          </div>
          <ActivityTimeline activities={activities} />
        </section>
      </div>
    </main>
  )
}
