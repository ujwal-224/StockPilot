import { useState, useEffect } from 'react'
import axios from 'axios'

type ReportStatus = 'idle' | 'generating' | 'ready'

const colorClasses = ['bg-primary', 'bg-ink-blue', 'bg-secondary', 'bg-outline']

const formatSalesValue = (val: number) => {
  if (val >= 1000) {
    const kVal = (val / 1000).toFixed(1).replace(/\.0$/, '')
    return `₹${kVal}k`
  }
  return `₹${val}`
}

export default function Analytics() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [reportStatus, setReportStatus] = useState<ReportStatus>('idle')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/analytics`)
      .then((res) => {
        if (res.data && res.data.success) {
          setData(res.data.data)
        } else {
          setError(true)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching analytics:', err)
        setError(true)
        setLoading(false)
      })
  }, [])

  const handleGenerateReport = () => {
    if (reportStatus !== 'idle') return
    setReportStatus('generating')
    setTimeout(() => {
      setReportStatus('ready')
      setTimeout(() => setReportStatus('idle'), 2000)
    }, 1500)
  }

  if (loading) {
    return (
      <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-5xl mx-auto w-full flex items-center justify-center min-h-[50vh]">
        <div className="ledger-card p-8 text-center rounded-lg w-full max-w-md">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block animate-spin">sync</span>
          <p className="font-body-md text-on-surface-variant">Loading analytics...</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-5xl mx-auto w-full flex items-center justify-center min-h-[50vh]">
        <div className="ledger-card p-8 text-center rounded-lg w-full max-w-md">
          <span className="material-symbols-outlined text-4xl text-stock-red mb-2 block">error_outline</span>
          <p className="font-body-md text-stock-red">Unable to load analytics data.</p>
        </div>
      </main>
    )
  }

  const { weeklySales, dailySales, categorySales, fastMovingItems } = data

  // 1. Weekly sales calculations
  const totalRevenueFormatted = `₹${(weeklySales?.totalRevenue || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  const changePercentage = weeklySales?.changePercentage || 0
  const changePercentageFormatted = `${changePercentage >= 0 ? '+' : ''}${changePercentage}% from last week`

  // 2. Daily sales chart calculation
  const maxSales = Math.max(...(dailySales || []).map((d: any) => d.sales), 0)
  const salesBars = (dailySales || []).map((d: any) => {
    const isHighest = maxSales > 0 && d.sales === maxSales
    const heightPx = maxSales > 0 ? (d.sales / maxSales) * 112 : 8
    return {
      day: d.day.toUpperCase(),
      heightPx: Math.max(heightPx, 8),
      value: formatSalesValue(d.sales),
      isHighest,
    }
  })

  // 3. Category sales calculations
  const totalCategoryRevenue = (categorySales || []).reduce((sum: number, c: any) => sum + c.revenue, 0)
  const mappedCategories = (categorySales || []).map((c: any, idx: number) => {
    const pct = totalCategoryRevenue > 0 ? Math.round((c.revenue / totalCategoryRevenue) * 100) : 0
    return {
      name: c.category,
      pct,
      colorClass: colorClasses[idx % colorClasses.length],
    }
  })

  // 4. Fast moving items calculations
  const mappedFastMoving = (fastMovingItems || []).map((item: any, idx: number) => ({
    rank: String(idx + 1).padStart(2, '0'),
    name: item.name,
    units: `${item.quantitySold} units sold`,
    revenue: `₹${(item.revenue || 0).toLocaleString('en-IN')}`,
    status: (item.stock || 0) <= 10 ? ('low-stock' as const) : ('in-stock' as const),
  }))

  return (
    <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 space-y-6 md:space-y-8 max-w-5xl mx-auto w-full">
      {/* ── Page title (desktop) ── */}
      <div className="hidden lg:block">
        <h2 className="font-headline-lg text-2xl text-on-surface">Weekly Analytics</h2>
        <p className="font-body-sm text-sm text-on-surface-variant mt-1">Performance overview — past 7 days</p>
      </div>

      {/* ── Summary Card ── */}
      <section>
        <div className="ledger-card p-5 rounded-lg">
          <p className="font-body-sm text-secondary uppercase tracking-wider mb-1">Total Sales This Week</p>
          <h2 className="font-number-display text-[36px] md:text-[40px] text-primary leading-tight">
            {totalRevenueFormatted}
          </h2>
          <div className="flex items-center gap-2 mt-2 text-tertiary">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="font-number-data text-body-sm">{changePercentageFormatted}</span>
          </div>
        </div>
      </section>

      {/* ── Two-column: Chart + Categories (desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 md:gap-8 items-start">
        {/* Chart */}
        <section>
          <div className="ledger-card p-5 rounded-lg">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="font-headline-sm text-on-surface">Daily Sales Trend</h3>
                <p className="font-body-sm text-secondary">Past 7 days performance</p>
              </div>
              <span className="material-symbols-outlined text-secondary">calendar_month</span>
            </div>

            {/* Bar chart */}
            <div className="flex items-end justify-between gap-2" style={{ height: '140px' }}>
              {salesBars.map((bar: any, idx: number) => (
                <div
                  key={bar.day}
                  className="flex flex-col items-center flex-1 gap-2 justify-end h-full cursor-pointer"
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div className="relative w-full flex flex-col justify-end" style={{ height: `${bar.heightPx}px` }}>
                    {/* Tooltip */}
                    {(hoveredBar === idx || (bar.isHighest && hoveredBar === null)) && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] px-1.5 py-0.5 font-number-data whitespace-nowrap rounded-sm shadow-sm z-10">
                        {bar.value}
                      </div>
                    )}
                    <div
                      className={`w-full rounded-t-sm transition-all duration-150 ${
                        bar.isHighest
                          ? 'bg-ink-blue'
                          : hoveredBar === idx
                          ? 'bg-ink-blue/60'
                          : 'bg-ink-blue/20 border-b-2 border-ink-blue'
                      }`}
                      style={{ height: '100%' }}
                    />
                  </div>
                  <span
                    className={`font-number-data text-[10px] ${
                      bar.isHighest ? 'text-primary font-bold' : 'text-secondary'
                    }`}
                  >
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sales by Category */}
        <section>
          <div className="ledger-card p-5 rounded-lg">
            <h3 className="font-headline-sm text-on-surface mb-4">Sales by Category</h3>
            <div className="space-y-4">
              {mappedCategories.length === 0 ? (
                <p className="font-body-sm text-secondary">No category sales data available.</p>
              ) : (
                mappedCategories.map((cat: any) => (
                  <div key={cat.name}>
                    <div className="flex justify-between mb-1.5">
                      <span className="font-body-md text-sm text-on-surface">{cat.name}</span>
                      <span className="font-number-data text-sm text-on-surface-variant">{cat.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-ledger-divider rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${cat.colorClass}`}
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ── Fast Moving Items ── */}
      <section>
        <div className="ledger-card overflow-hidden rounded-lg">
          <div className="p-5 hairline-bottom">
            <h3 className="font-headline-sm text-on-surface">Fast Moving Items</h3>
            <p className="font-body-sm text-secondary">Top 5 by volume this week</p>
          </div>

          <div className="divide-y divide-ledger-divider">
            {mappedFastMoving.length === 0 ? (
              <div className="p-5 text-center text-secondary">
                No fast moving items found.
              </div>
            ) : (
              mappedFastMoving.map((item: any) => (
                <div
                  key={item.rank}
                  className="flex items-center justify-between min-h-[56px] px-5 py-3 hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <span className="font-number-data text-primary font-bold flex-shrink-0">{item.rank}</span>
                    <div className="min-w-0">
                      <p className="font-body-md font-bold text-on-surface text-sm md:text-base truncate">
                        {item.name}
                      </p>
                      <p className="font-body-sm text-secondary text-xs md:text-sm">{item.units}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-number-data text-on-surface text-sm">{item.revenue}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        item.status === 'in-stock'
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {item.status === 'in-stock' ? 'IN STOCK' : 'LOW STOCK'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Generate Report CTA ── */}
      <div className="pt-2">
        <button
          onClick={handleGenerateReport}
          disabled={reportStatus === 'generating'}
          className={`w-full lg:w-auto lg:px-8 h-row-height-min flex items-center justify-center gap-2 font-bold transition-all active:scale-95 rounded-sm ${
            reportStatus === 'ready'
              ? 'bg-tertiary text-white'
              : 'bg-primary text-white hover:bg-primary-container'
          } disabled:opacity-80`}
        >
          {reportStatus === 'idle' && (
            <>
              <span className="material-symbols-outlined">download</span> GENERATE WEEKLY REPORT
            </>
          )}
          {reportStatus === 'generating' && (
            <>
              <span className="material-symbols-outlined animate-spin">sync</span> GENERATING…
            </>
          )}
          {reportStatus === 'ready' && (
            <>
              <span className="material-symbols-outlined">check_circle</span> REPORT READY
            </>
          )}
        </button>
      </div>
    </main>
  )
}
