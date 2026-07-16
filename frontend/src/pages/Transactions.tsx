import { useState, useEffect, useMemo } from 'react'
import { getTransactions } from '../services/transactionService'
import type { TransactionRecord } from '../types'
import { SearchBar, SummaryCard, StatusBadge, LoadingCard, EmptyState } from '../components/SharedComponents'

type TransactionFilter = 'ALL' | 'SALE' | 'PURCHASE' | 'ADJUSTMENT'

const FILTERS: { id: TransactionFilter; label: string }[] = [
  { id: 'ALL',        label: 'All'         },
  { id: 'SALE',       label: 'Sales'       },
  { id: 'PURCHASE',   label: 'Purchases'   },
  { id: 'ADJUSTMENT', label: 'Adjustments' },
]

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('ALL')

  const fetchTransactions = () => {
    getTransactions()
      .then((res) => {
        setTransactions(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching transactions:', err)
        setError(true)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  // Calculate count metrics dynamically from transactions array
  const salesCount = useMemo(() => transactions.filter((t) => t.type === 'SALE').length, [transactions])
  const purchasesCount = useMemo(() => transactions.filter((t) => t.type === 'PURCHASE').length, [transactions])
  const adjustmentsCount = useMemo(() => transactions.filter((t) => t.type === 'ADJUSTMENT').length, [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Search Query Match
      const productName = t.product ? t.product.name.toLowerCase() : 'unknown product'
      const type = t.type.toLowerCase()
      const query = searchQuery.toLowerCase()
      const matchSearch = productName.includes(query) || type.includes(query)

      // 2. Filter Match
      const matchFilter = activeFilter === 'ALL' || t.type === activeFilter

      return matchSearch && matchFilter
    })
  }, [transactions, searchQuery, activeFilter])

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [filteredTransactions])

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (loading) {
    return <LoadingCard message="Loading transactions ledger..." fullPage={true} />
  }

  if (error) {
    return (
      <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-5xl mx-auto w-full flex items-center justify-center min-h-[50vh]">
        <div className="ledger-card p-8 text-center rounded-lg w-full max-w-md">
          <span className="material-symbols-outlined text-4xl text-stock-red mb-2 block">error_outline</span>
          <p className="font-body-md text-stock-red">Unable to load transactions ledger.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 space-y-6 max-w-5xl mx-auto w-full">
      {/* ── Page title ── */}
      <div>
        <h2 className="font-headline-lg text-2xl text-on-surface">Transactions Ledger</h2>
        <p className="font-body-sm text-sm text-on-surface-variant mt-1">
          Historical record of all stock updates, sales, and purchases.
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <SummaryCard
          title="Total Sales"
          value={salesCount}
          variant="red"
          icon="shopping_cart"
        />
        <SummaryCard
          title="Total Purchases"
          value={purchasesCount}
          variant="green"
          icon="local_shipping"
        />
        <SummaryCard
          title="Total Adjustments"
          value={adjustmentsCount}
          variant="turmeric"
          icon="sync_alt"
        />
      </section>

      {/* ── Search Bar ── */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search transactions by product name or transaction type..."
      />

      {/* ── Filter pills ── */}
      <section className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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
      </section>

      {/* ── Table / Empty state ── */}
      {sortedTransactions.length === 0 ? (
        <EmptyState
          icon="history"
          message="No transaction records found."
        />
      ) : (
        <>
          {/* Mobile Card List (Visible on mobile, hidden on medium screens and up) */}
          <div className="block md:hidden space-y-3">
            {sortedTransactions.map((t) => (
              <div key={t._id} className="bg-ledger-surface border border-bahi-hairline rounded-lg p-4 space-y-3 shadow-sm bahi-spine">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-grow">
                    <h4 className="font-bold text-on-surface text-base truncate">
                      {t.product ? t.product.name : <span className="text-secondary italic">Deleted Product</span>}
                    </h4>
                    <span className="text-xs text-secondary block mt-0.5">{formatDateTime(t.createdAt)}</span>
                  </div>
                  <StatusBadge type={t.type} className="ml-2 flex-shrink-0" />
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-ledger-divider text-xs">
                  <div>
                    <span className="block text-secondary mb-0.5">Qty</span>
                    <span className="font-number-data text-on-surface font-semibold">
                      {t.quantity} {t.product?.unit || ''}
                    </span>
                  </div>
                  <div>
                    <span className="block text-secondary mb-0.5">Prev Stock</span>
                    <span className="font-number-data text-secondary">{t.previousStock}</span>
                  </div>
                  <div>
                    <span className="block text-secondary mb-0.5">New Stock</span>
                    <span className="font-number-data text-on-surface font-semibold">{t.newStock}</span>
                  </div>
                </div>
                
                {t.note && (
                  <div className="pt-2 border-t border-ledger-divider text-xs text-secondary italic">
                    <strong>Note: </strong>{t.note}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table (Hidden on mobile, visible on medium screens and up) */}
          <div className="hidden md:block overflow-x-auto border border-bahi-hairline rounded-lg bg-ledger-surface shadow-sm">
            <table className="w-full text-left border-collapse font-body-sm text-sm">
              <thead>
                <tr className="bg-ledger-surface border-b border-bahi-hairline text-secondary uppercase font-bold text-xs">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Transaction Type</th>
                  <th className="px-6 py-4 text-right">Quantity</th>
                  <th className="px-6 py-4 text-right">Previous Stock</th>
                  <th className="px-6 py-4 text-right">New Stock</th>
                  <th className="px-6 py-4">Note</th>
                  <th className="px-6 py-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger-divider">
                {sortedTransactions.map((t) => (
                  <tr key={t._id} className="hover:bg-surface-container-high transition-colors">
                    <td className="px-6 py-4 font-bold text-on-surface">
                      {t.product ? t.product.name : <span className="text-secondary italic">Deleted Product</span>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge type={t.type} />
                    </td>
                    <td className="px-6 py-4 text-right font-number-data text-on-surface">
                      {t.quantity} {t.product?.unit || ''}
                    </td>
                    <td className="px-6 py-4 text-right font-number-data text-secondary">
                      {t.previousStock}
                    </td>
                    <td className="px-6 py-4 text-right font-number-data text-on-surface font-semibold">
                      {t.newStock}
                    </td>
                    <td className="px-6 py-4 text-secondary max-w-[200px] truncate" title={t.note}>
                      {t.note || <span className="italic text-outline-variant">-</span>}
                    </td>
                    <td className="px-6 py-4 text-secondary whitespace-nowrap">
                      {formatDateTime(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}
