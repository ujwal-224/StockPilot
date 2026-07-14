// ─── Data ────────────────────────────────────────────────────────────────────

const needsAttentionItems = [
  { id: 1, name: 'Fortune Sunflower Oil (1L)', units: '0 units',  progressPct: 0,  variant: 'danger'  as const },
  { id: 2, name: 'Tata Salt (1kg)',            units: '12 units', progressPct: 15, variant: 'warning' as const },
  { id: 3, name: 'Aashirvaad Atta (5kg)',      units: '8 units',  progressPct: 10, variant: 'warning' as const },
  { id: 4, name: 'Maggi Noodles (Pack 12)',    units: '5 units',  progressPct: 8,  variant: 'warning' as const },
]

const recentActivity = [
  {
    id: 1, type: 'bill', label: 'Bill photo processed', time: '10m ago',
    imgSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDels1yOzCu7GS5EQ2irUhBSs27aKdIYCvAqJ1pd6ddu8ICiyq0NXn8Fi34BL6JHhn6So67pKvJ0Bh1caWzK7_jDWNSFzTuX3tatbTK0A6u50sW7xY2Qv4tGlVllMlTdOfz9tLygLCuK8Hq1mDkq7asMj5COng7Cob19jsA2k5a00srPubqaBP7zU-xVtsNQ5Ll4howHMvAazxFMRKdP0rWT5_xU-SS7JoXhoC8HmPkbMpViB1ZVEWQ8kAZOOOx7N9KPrGSUnZA1Ddn',
  },
  { id: 2, type: 'voice', label: 'Voice note: Added 10kg sugar',       time: '45m ago', icon: 'mic'  },
  { id: 3, type: 'chat',  label: 'WhatsApp message: Updated oil price', time: '2h ago',  icon: 'chat' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function NeedsAttentionRow({ item, isLast }: { item: (typeof needsAttentionItems)[0]; isLast: boolean }) {
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

function ActivityRow({ item, isLast }: { item: (typeof recentActivity)[0]; isLast: boolean }) {
  return (
    <div className={`margin-rule-maroon p-4 flex items-center gap-4 ${isLast ? '' : 'hairline-bottom'} hover:bg-surface-container-low transition-colors cursor-pointer`}>
      {item.type === 'bill' ? (
        <div className="w-12 h-12 flex-shrink-0 bg-surface-container-high rounded-lg border border-outline-variant overflow-hidden">
          <img src={item.imgSrc} alt="Bill thumbnail" className="w-full h-full object-cover opacity-80" />
        </div>
      ) : item.type === 'voice' ? (
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
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

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
          <span className="font-number-display text-right text-primary text-xl md:text-2xl lg:text-3xl">1,248</span>
        </div>

        <div className="bg-brand-turmeric rounded-card border border-[#9c7118] margin-rule-gold p-3 md:p-5 flex flex-col justify-between h-24 md:h-28 lg:h-32">
          <span className="font-body-sm text-[11px] md:text-xs leading-tight text-white uppercase tracking-wider font-semibold">
            Low Stock
          </span>
          <span className="font-number-display text-right text-white text-xl md:text-2xl lg:text-3xl">14</span>
        </div>

        <div className="bg-ledger-surface rounded-card hairline-border margin-rule-maroon p-3 md:p-5 flex flex-col justify-between h-24 md:h-28 lg:h-32">
          <span className="font-body-sm text-[11px] md:text-xs leading-tight text-on-surface-variant uppercase tracking-wider">
            Today's Updates
          </span>
          <span className="font-number-display text-right text-primary text-xl md:text-2xl lg:text-3xl">28</span>
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
            {needsAttentionItems.map((item, idx) => (
              <NeedsAttentionRow key={item.id} item={item} isLast={idx === needsAttentionItems.length - 1} />
            ))}
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
            {recentActivity.map((item, idx) => (
              <ActivityRow key={item.id} item={item} isLast={idx === recentActivity.length - 1} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
