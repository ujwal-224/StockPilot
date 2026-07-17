import { useState, useEffect, useCallback } from 'react'
import { getMemories, deleteMemory } from '../services/memoryService'
import type { BusinessMemory } from '../services/memoryService'

// ─── Category Config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  'Business Preference': { color: 'text-[#6E2A2E]',  bg: 'bg-[#6E2A2E]/10',  icon: 'tune'            },
  'Supplier':            { color: 'text-[#1565C0]',  bg: 'bg-[#1565C0]/10',  icon: 'local_shipping'  },
  'Reminder':            { color: 'text-[#E65100]',  bg: 'bg-[#E65100]/10',  icon: 'alarm'           },
  'Restocking Rule':     { color: 'text-[#2E7D32]',  bg: 'bg-[#2E7D32]/10',  icon: 'sync'            },
  'Store Information':   { color: 'text-[#6A1B9A]',  bg: 'bg-[#6A1B9A]/10',  icon: 'storefront'      },
  'General Note':        { color: 'text-[#546E7A]',  bg: 'bg-[#546E7A]/10',  icon: 'notes'           },
  'Customer Preference': { color: 'text-[#AD1457]',  bg: 'bg-[#AD1457]/10',  icon: 'people'          },
}

const DEFAULT_CAT = { color: 'text-[#546E7A]', bg: 'bg-[#546E7A]/10', icon: 'memory' }

function getCatConfig(cat: string) {
  return CATEGORY_CONFIG[cat] || DEFAULT_CAT
}

// ─── Format Date ──────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function MemorySkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white/60 border border-[#D8D4C7] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-20 h-5 bg-[#D8D4C7] rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="w-full h-3.5 bg-[#D8D4C7] rounded" />
            <div className="w-4/5 h-3.5 bg-[#D8D4C7] rounded" />
          </div>
          <div className="mt-3 w-24 h-3 bg-[#D8D4C7] rounded" />
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: 'linear-gradient(135deg, #6E2A2E22, #BD8A1E22)' }}
      >
        <span className="material-symbols-outlined text-4xl text-[#6E2A2E]/60">psychology</span>
      </div>
      <h3 className="font-bold text-lg text-[#211a1a] mb-1">No business memories yet</h3>
      <p className="text-sm text-[#5C4E3A] max-w-xs leading-relaxed">
        Start a conversation with the AI Assistant. When you share business information like
        your supplier, restocking rules, or store preferences, they'll be remembered here.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-sm">
        {['Try: "My supplier is ABC Traders"', 'Try: "Reorder milk when stock &lt; 20"', 'Try: "We are closed on Sundays"'].map((hint) => (
          <span
            key={hint}
            className="text-xs bg-[#6E2A2E]/8 text-[#6E2A2E] border border-[#6E2A2E]/20 rounded-full px-3 py-1.5"
            dangerouslySetInnerHTML={{ __html: hint }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteDialog({
  memory,
  onConfirm,
  onCancel,
  deleting,
}: {
  memory: BusinessMemory
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="bg-[#F4F2EC] border border-[#D8D4C7] rounded-2xl p-6 shadow-2xl max-w-sm w-full"
        style={{ borderLeft: '4px solid #ba1a1a' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="material-symbols-outlined text-[#ba1a1a] text-2xl mt-0.5">warning</span>
          <div>
            <h4 className="font-bold text-[#211a1a] text-base">Delete Memory?</h4>
            <p className="text-sm text-[#5C4E3A] mt-1 leading-relaxed">
              This memory will be permanently removed and the AI won't recall it in future conversations.
            </p>
          </div>
        </div>
        <blockquote className="bg-white/60 border border-[#D8D4C7] rounded-lg px-4 py-3 text-sm text-[#211a1a] italic mb-5 leading-relaxed">
          "{memory.memory.length > 120 ? memory.memory.slice(0, 120) + '…' : memory.memory}"
        </blockquote>
        <div className="flex gap-3">
          <button
            id="confirm-delete-memory-btn"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 bg-[#ba1a1a] text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-[#9b1515] active:scale-95 transition-all disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <button
            id="cancel-delete-memory-btn"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 bg-white/60 border border-[#D8D4C7] text-[#211a1a] font-semibold text-sm rounded-xl py-2.5 hover:bg-[#E7E4DC] active:scale-95 transition-all disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Memory Card ──────────────────────────────────────────────────────────────

function MemoryCard({
  memory,
  index,
  onDelete,
}: {
  memory: BusinessMemory
  index: number
  onDelete: (m: BusinessMemory) => void
}) {
  const cat = getCatConfig(memory.category)

  return (
    <div
      id={`memory-card-${index}`}
      className="group relative bg-white/70 border border-[#D8D4C7] rounded-xl overflow-hidden hover:shadow-md hover:border-[#BD8A1E]/40 transition-all duration-200"
      style={{ borderLeft: '4px solid #6E2A2E' }}
    >
      {/* Subtle ruled lines decoration */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, #5C4E3A 24px)',
          backgroundSize: '100% 24px',
        }}
      />

      <div className="relative p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cat.bg} ${cat.color}`}>
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {cat.icon}
            </span>
            {memory.category}
          </div>
          <button
            id={`delete-memory-${index}`}
            onClick={() => onDelete(memory)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#5C4E3A]/40 hover:bg-red-50 hover:text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
            title="Delete memory"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>

        {/* Memory content */}
        <p className="text-sm text-[#211a1a] leading-relaxed mb-3 pr-2">{memory.memory}</p>

        {/* Footer */}
        <div className="flex items-center gap-1.5 text-[#9A8F7E] text-[11px]">
          <span className="material-symbols-outlined text-[13px]">calendar_today</span>
          {formatDate(memory.createdAt)}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = ['All', ...Object.keys(CATEGORY_CONFIG)]

export default function BusinessMemory() {
  const [memories, setMemories]             = useState<BusinessMemory[]>([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [search, setSearch]                 = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [toDelete, setToDelete]             = useState<BusinessMemory | null>(null)
  const [deleting, setDeleting]             = useState(false)

  const loadMemories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMemories()
      setMemories(data)
    } catch {
      setError('Failed to load memories. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteMemory(toDelete.id)
      setMemories((prev) => prev.filter((m) => m.id !== toDelete.id))
      setToDelete(null)
    } catch {
      // keep dialog open on failure
    } finally {
      setDeleting(false)
    }
  }

  // Client-side filter
  const filtered = memories.filter((m) => {
    const matchesCategory = activeCategory === 'All' || m.category === activeCategory
    const matchesSearch   = !search.trim() ||
      m.memory.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <main className="flex-1 pb-28 lg:pb-8 px-5 md:px-8 lg:px-10 pt-6">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="material-symbols-outlined text-[#6E2A2E] text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            psychology
          </span>
          <h2 className="font-bold text-xl text-[#211a1a]">Business Memory</h2>
        </div>
        <p className="text-sm text-[#5C4E3A]">
          Long-term business information shared across all conversations.
          {memories.length > 0 && (
            <span className="ml-1 font-semibold text-[#6E2A2E]">{memories.length} {memories.length === 1 ? 'memory' : 'memories'} saved.</span>
          )}
        </p>
      </div>

      {/* ── Search + Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#9A8F7E]">
            search
          </span>
          <input
            id="memory-search-input"
            type="text"
            placeholder="Search memories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/60 border border-[#D8D4C7] rounded-xl focus:outline-none focus:border-[#6E2A2E] focus:bg-white transition-all text-[#211a1a] placeholder-[#9A8F7E]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8F7E] hover:text-[#211a1a] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Refresh */}
        <button
          id="memory-refresh-btn"
          onClick={loadMemories}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#6E2A2E] bg-[#6E2A2E]/8 border border-[#6E2A2E]/20 rounded-xl hover:bg-[#6E2A2E]/15 active:scale-95 transition-all disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>
      </div>

      {/* ── Category Filter Chips ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {ALL_CATEGORIES.map((cat) => {
          const isActive = cat === activeCategory
          const cfg      = cat === 'All' ? null : getCatConfig(cat)
          return (
            <button
              key={cat}
              id={`category-filter-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isActive
                  ? 'bg-[#6E2A2E] text-white border-[#6E2A2E]'
                  : 'bg-white/60 text-[#5C4E3A] border-[#D8D4C7] hover:border-[#6E2A2E]/40'
              }`}
            >
              {cfg && (
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {cfg.icon}
                </span>
              )}
              {cat}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <MemorySkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-[#ba1a1a] mb-3">error_outline</span>
          <p className="text-sm text-[#5C4E3A] mb-4">{error}</p>
          <button
            onClick={loadMemories}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#6E2A2E] rounded-xl hover:bg-[#57202A] active:scale-95 transition-all"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        memories.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-[#9A8F7E] mb-3">search_off</span>
            <p className="text-sm text-[#5C4E3A]">No memories match your search.</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('All') }}
              className="mt-3 text-sm text-[#6E2A2E] font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((m, i) => (
            <MemoryCard
              key={m.id}
              memory={m}
              index={i}
              onDelete={setToDelete}
            />
          ))}
        </div>
      )}

      {/* ── Tip Banner ── */}
      {!loading && memories.length > 0 && (
        <div className="mt-8 flex items-start gap-3 p-4 bg-[#BD8A1E]/8 border border-[#BD8A1E]/25 rounded-xl">
          <span className="material-symbols-outlined text-[#BD8A1E] text-xl flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
            tips_and_updates
          </span>
          <p className="text-xs text-[#5C4E3A] leading-relaxed">
            <span className="font-semibold text-[#211a1a]">Tip:</span> These memories are automatically recalled when you chat with the AI. All users in your shop share this memory. Only Owners and Managers can view and delete memories.
          </p>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {toDelete && (
        <DeleteDialog
          memory={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          deleting={deleting}
        />
      )}
    </main>
  )
}
