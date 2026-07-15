import { useState, useMemo, useEffect } from 'react'
import axios from 'axios'

// ─── Types ────────────────────────────────────────────────────────────────────

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

interface InventoryItem {
  id: string
  name: string
  qty: string
  progressPct: number
  status: StockStatus
}

// ─── Backend → UI mapper ──────────────────────────────────────────────────────

interface BackendProduct {
  _id: string
  name: string
  stock: number
  unit: string
  threshold: number
}

function mapProduct(p: BackendProduct): InventoryItem {
  const status: StockStatus =
    p.stock === 0
      ? 'out-of-stock'
      : p.stock <= p.threshold
      ? 'low-stock'
      : 'in-stock'

  return {
    id:          p._id,
    name:        p.name,
    qty:         `${p.stock} ${p.unit}`,
    progressPct: Math.min((p.stock / (p.threshold * 2)) * 100, 100),
    status,
  }
}

type FilterId = 'all' | 'low-stock' | 'out-of-stock'

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all',          label: 'All Items'    },
  { id: 'low-stock',    label: 'Low Stock'    },
  { id: 'out-of-stock', label: 'Out of Stock' },
]

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StockStatus, {
  spine: string; bar: string; qtyClass: string; labelClass: string; label: string;
}> = {
  'in-stock':     { spine: 'bahi-spine',      bar: 'bg-stock-green',    qtyClass: 'text-on-surface', labelClass: 'text-secondary',     label: 'In Stock'     },
  'low-stock':    { spine: 'bahi-spine-gold', bar: 'bg-stock-turmeric', qtyClass: 'text-stock-turmeric', labelClass: 'text-stock-turmeric font-bold', label: 'Low Stock'    },
  'out-of-stock': { spine: 'bahi-spine-red',  bar: 'bg-stock-red',      qtyClass: 'text-stock-red',  labelClass: 'text-stock-red font-bold',  label: 'Out of Stock' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Inventory() {
  const [allItems,     setAllItems]     = useState<InventoryItem[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterId>('all')

  // Fetch products from backend on mount
  useEffect(() => {
    axios
      .get<{ success: boolean; data: BackendProduct[] }>(`${import.meta.env.VITE_API_URL}/api/products`)
      .then((res) => {
        setAllItems(res.data.data.map(mapProduct))
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  const filteredItems = useMemo(() =>
    allItems.filter((item) => {
      const matchFilter =
        activeFilter === 'all' ||
        item.status === activeFilter
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchFilter && matchSearch
    }),
    [allItems, activeFilter, searchQuery]
  )

  // Derived counts for subtitle
  const lowCount = allItems.filter((i) => i.status === 'low-stock').length
  const outCount = allItems.filter((i) => i.status === 'out-of-stock').length

  return (
    <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-5xl mx-auto w-full space-y-5">

      {/* ── Page title (desktop) ── */}
      <div className="hidden lg:block">
        <h2 className="font-headline-lg text-2xl text-on-surface">Live Inventory</h2>
        <p className="font-body-sm text-sm text-on-surface-variant mt-1">
          {loading ? 'Loading…' : `${filteredItems.length} items · ${lowCount} low stock · ${outCount} out of stock`}
        </p>
      </div>

      {/* ── Search & Filters ── */}
      <section className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
            search
          </span>
          <input
            type="text"
            placeholder="Search inventory…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 input-bahi font-body-md text-body-md rounded-t-lg"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-full font-body-sm text-sm whitespace-nowrap transition-all active:scale-95 ${
                activeFilter === f.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-bahi-hairline bg-ledger-surface text-secondary hover:bg-surface-container-high'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Inventory List ── */}
      <section className="space-y-3">
        <h3 className="font-headline-sm text-primary lg:hidden">Live Inventory</h3>

        {/* Loading state */}
        {loading && (
          <div className="ledger-card p-8 text-center rounded-lg">
            <span className="material-symbols-outlined text-4xl text-outline mb-2 block animate-spin">sync</span>
            <p className="font-body-md text-on-surface-variant">Loading inventory...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="ledger-card p-8 text-center rounded-lg">
            <span className="material-symbols-outlined text-4xl text-stock-red mb-2 block">error_outline</span>
            <p className="font-body-md text-stock-red">Unable to load inventory.</p>
          </div>
        )}

        {/* Empty search result */}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="ledger-card p-8 text-center rounded-lg">
            <span className="material-symbols-outlined text-4xl text-outline mb-2 block">inventory_2</span>
            <p className="font-body-md text-on-surface-variant">No items match your search.</p>
          </div>
        )}

        {/* Product cards */}
        {!loading && !error && filteredItems.length > 0 && (
          /* Mobile: cards | Desktop: wider cards with more info */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const cfg = STATUS_CONFIG[item.status]
              return (
                <div
                  key={item.id}
                  className={`bg-ledger-surface ${cfg.spine} flex flex-col rounded-r-lg hairline-border hover:bg-surface-container-high transition-colors cursor-pointer active:scale-[0.98]`}
                >
                  <div className="px-4 h-row-height-min flex items-center justify-between gap-3">
                    {/* Name + progress bar */}
                    <div className="flex flex-col min-w-0 flex-grow">
                      <span className="font-body-md font-bold text-on-surface text-sm md:text-base truncate">
                        {item.name}
                      </span>
                      <div className="w-32 md:w-40 h-1.5 bg-outline-variant rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                          style={{ width: `${item.progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Qty + status badge */}
                    <div className="text-right flex-shrink-0">
                      <span className={`font-number-data text-sm block ${cfg.qtyClass}`}>{item.qty}</span>
                      <span className={`text-[10px] font-body-sm uppercase tracking-widest ${cfg.labelClass}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
