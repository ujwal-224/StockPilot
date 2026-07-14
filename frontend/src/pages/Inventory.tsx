import { useState, useMemo } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

interface InventoryItem {
  id: number
  name: string
  qty: string
  progressPct: number
  status: StockStatus
}

const ALL_ITEMS: InventoryItem[] = [
  { id: 1, name: 'Basmati Rice (Premium)', qty: '142 kg',  progressPct: 75,  status: 'in-stock'     },
  { id: 2, name: 'Mustard Oil (1L)',        qty: '12 units',progressPct: 25,  status: 'low-stock'    },
  { id: 3, name: 'Toor Dal',               qty: '45 kg',   progressPct: 50,  status: 'in-stock'     },
  { id: 4, name: 'Alphonso Mango Box',     qty: '0 units', progressPct: 0,   status: 'out-of-stock' },
  { id: 5, name: 'Refined Sugar',          qty: '210 kg',  progressPct: 85,  status: 'in-stock'     },
  { id: 6, name: 'Fortune Sunflower Oil',  qty: '38 units',progressPct: 40,  status: 'in-stock'     },
  { id: 7, name: 'Aashirvaad Atta (5kg)', qty: '8 units', progressPct: 10,  status: 'low-stock'    },
]

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
  const [searchQuery,  setSearchQuery]  = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterId>('all')

  const filteredItems = useMemo(() =>
    ALL_ITEMS.filter((item) => {
      const matchFilter =
        activeFilter === 'all' ||
        item.status === activeFilter
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchFilter && matchSearch
    }),
    [activeFilter, searchQuery]
  )

  return (
    <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-5xl mx-auto w-full space-y-5">

      {/* ── Page title (desktop) ── */}
      <div className="hidden lg:block">
        <h2 className="font-headline-lg text-2xl text-on-surface">Live Inventory</h2>
        <p className="font-body-sm text-sm text-on-surface-variant mt-1">
          {filteredItems.length} items · 2 low stock · 1 out of stock
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

        {filteredItems.length === 0 ? (
          <div className="ledger-card p-8 text-center rounded-lg">
            <span className="material-symbols-outlined text-4xl text-outline mb-2 block">inventory_2</span>
            <p className="font-body-md text-on-surface-variant">No items match your search.</p>
          </div>
        ) : (
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
