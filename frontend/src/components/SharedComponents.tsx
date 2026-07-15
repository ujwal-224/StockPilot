import type { StockStatus } from '../types'

interface SearchBarProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ value, onChange, placeholder = "Search...", className = "" }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
        search
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-14 pl-12 pr-4 input-bahi font-body-md text-body-md rounded-lg bg-ledger-surface"
      />
    </div>
  )
}

interface SummaryCardProps {
  title: string
  value: string | number
  variant?: 'maroon' | 'gold' | 'red' | 'green' | 'turmeric' | 'low-stock' | 'default'
  className?: string
  icon?: string
}

export function SummaryCard({ title, value, variant = 'default', className = "", icon }: SummaryCardProps) {
  let borderClass = 'hairline-border'
  let textClass = 'text-primary'
  let bgClass = 'bg-ledger-surface'
  let iconColorClass = 'text-primary'

  switch (variant) {
    case 'maroon':
      borderClass = 'hairline-border border-l-4 border-l-primary-container'
      iconColorClass = 'text-primary-container'
      break
    case 'gold':
      borderClass = 'hairline-border border-l-4 border-l-brand-turmeric'
      iconColorClass = 'text-brand-turmeric'
      break
    case 'red':
      borderClass = 'hairline-border border-l-4 border-l-stock-red'
      textClass = 'text-stock-red'
      iconColorClass = 'text-stock-red'
      break
    case 'green':
      borderClass = 'hairline-border border-l-4 border-l-stock-green'
      textClass = 'text-stock-green'
      iconColorClass = 'text-stock-green'
      break
    case 'turmeric':
      borderClass = 'hairline-border border-l-4 border-l-stock-turmeric'
      textClass = 'text-stock-turmeric'
      iconColorClass = 'text-stock-turmeric'
      break
    case 'low-stock':
      bgClass = 'bg-ledger-surface'
      borderClass = 'hairline-border border-l-4 border-l-stock-turmeric'
      textClass = 'text-stock-turmeric'
      iconColorClass = 'text-stock-turmeric'
      break
  }

  const titleTextClass = 'text-on-surface-variant'

  return (
    <div className={`${bgClass} rounded-card ${borderClass} p-3 md:p-5 flex flex-col justify-between h-24 md:h-28 lg:h-32 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-1 w-full">
        <span className={`font-body-sm text-[11px] md:text-xs leading-tight uppercase tracking-wider ${titleTextClass}`}>
          {title}
        </span>
        {icon && (
          <span className={`material-symbols-outlined text-[18px] md:text-[22px] ${iconColorClass}`}>
            {icon}
          </span>
        )}
      </div>
      <span className={`font-number-display text-right ${textClass} text-xl md:text-2xl lg:text-3xl`}>
        {value}
      </span>
    </div>
  )
}

interface StatusBadgeProps {
  type: StockStatus | 'SALE' | 'PURCHASE' | 'ADJUSTMENT'
  label?: string
  className?: string
}

export function StatusBadge({ type, label, className = "" }: StatusBadgeProps) {
  let badgeStyle = ""
  const displayLabel = label || type.replace('-', ' ')

  switch (type) {
    case 'in-stock':
    case 'PURCHASE':
      badgeStyle = "bg-stock-green/10 text-stock-green border border-stock-green/20"
      break
    case 'low-stock':
    case 'ADJUSTMENT':
      badgeStyle = "bg-stock-turmeric/10 text-stock-turmeric border border-stock-turmeric/20"
      break
    case 'out-of-stock':
    case 'SALE':
      badgeStyle = "bg-stock-red/10 text-stock-red border border-stock-red/20"
      break
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded border uppercase tracking-wider whitespace-nowrap ${badgeStyle} ${className}`}>
      {displayLabel}
    </span>
  )
}

interface LoadingCardProps {
  message?: string
  fullPage?: boolean
}

export function LoadingCard({ message = "Loading...", fullPage = false }: LoadingCardProps) {
  if (fullPage) {
    return (
      <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-5xl mx-auto w-full flex items-center justify-center min-h-[50vh]">
        <div className="ledger-card p-8 text-center rounded-lg w-full max-w-md">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block animate-spin">sync</span>
          <p className="font-body-md text-on-surface-variant">{message}</p>
        </div>
      </main>
    )
  }

  return (
    <div className="ledger-card p-8 text-center rounded-lg">
      <span className="material-symbols-outlined text-4xl text-outline mb-2 block animate-spin">sync</span>
      <p className="font-body-md text-on-surface-variant">{message}</p>
    </div>
  )
}

interface EmptyStateProps {
  icon: string
  message: string
  paddingClass?: string
  textColor?: string
  iconColor?: string
}

export function EmptyState({
  icon,
  message,
  paddingClass = "p-12",
  textColor = "text-on-surface-variant",
  iconColor = "text-outline",
}: EmptyStateProps) {
  return (
    <div className={`ledger-card text-center rounded-lg ${paddingClass}`}>
      <span className={`material-symbols-outlined text-4xl mb-2 block ${iconColor}`}>{icon}</span>
      <p className={`font-body-md ${textColor}`}>{message}</p>
    </div>
  )
}
