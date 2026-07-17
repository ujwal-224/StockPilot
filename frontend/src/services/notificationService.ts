import type { AppNotification, BackendProduct, TransactionRecord } from '../types'

const LOCAL_STORAGE_KEY = 'app_notifications'
const MAX_NOTIFICATIONS = 200

export function getNotifications(): AppNotification[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveNotifications(notifications: AppNotification[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)))
  window.dispatchEvent(new Event('notifications-updated'))
}

export function addNotification(notif: Omit<AppNotification, 'read' | 'timestamp'>) {
  const list = getNotifications()
  // Avoid duplicate ID if it already exists
  if (list.some((n) => n.id === notif.id)) return

  const newNotif: AppNotification = {
    ...notif,
    timestamp: Date.now(),
    read: false,
  }
  list.unshift(newNotif)
  saveNotifications(list)
}

export function markAllAsRead() {
  const list = getNotifications()
  const updated = list.map((n) => ({ ...n, read: true }))
  saveNotifications(updated)
}

export function markNotificationsAsRead(ids: string[]) {
  const list = getNotifications()
  const updated = list.map((n) => {
    if (ids.includes(n.id)) {
      return { ...n, read: true }
    }
    return n
  })
  saveNotifications(updated)
}

export function syncWithBackend(products: BackendProduct[], transactions: TransactionRecord[]) {
  const list = getNotifications()
  const ids = new Set(list.map((notification) => notification.id))
  let changed = false

  const ensureNotification = (
    id: string,
    type: AppNotification['type'],
    title: string,
    description: string,
    icon: string,
    timestamp: number
  ) => {
    if (!ids.has(id)) {
      list.push({
        id,
        title,
        description,
        icon,
        timestamp,
        read: false,
        type,
      })
      changed = true
      ids.add(id)
    }
  }

  // 1. Process Low Stock and Out of Stock alerts
  products.forEach((p) => {
    const timestamp = p.updatedAt ? new Date(p.updatedAt).getTime() : Date.now()
    if (p.stock === 0) {
      ensureNotification(
        `out-of-stock-${p._id}-${p.stock}`,
        'out_of_stock',
        'Out of Stock',
        `${p.name} is currently out of stock.`,
        'error',
        timestamp
      )
    } else if (p.stock <= p.threshold) {
      ensureNotification(
        `low-stock-${p._id}-${p.stock}`,
        'low_stock',
        'Low Stock',
        `${p.name} has reached the minimum stock level.`,
        'warning',
        timestamp
      )
    }
  })

  // 2. Process transaction updates
  transactions.forEach((t) => {
    const productName = t.product ? t.product.name : 'Deleted Product'
    const productUnit = t.product ? ` ${t.product.unit}` : ''
    const timestamp = new Date(t.createdAt).getTime()

    if (t.type === 'SALE') {
      ensureNotification(
        `trans-${t._id}`,
        'sale',
        'Sale Recorded',
        `Sold ${t.quantity}${productUnit} of ${productName}.`,
        'shopping_cart',
        timestamp
      )
    } else if (t.type === 'PURCHASE') {
      ensureNotification(
        `trans-${t._id}`,
        'purchase',
        'Purchase Recorded',
        `Purchased ${t.quantity}${productUnit} of ${productName}.`,
        'local_shipping',
        timestamp
      )
    } else if (t.type === 'ADJUSTMENT') {
      ensureNotification(
        `trans-${t._id}`,
        'adjustment',
        'Stock Adjusted',
        `Adjusted stock of ${productName}.`,
        'sync_alt',
        timestamp
      )
    }
  })

  if (changed) {
    list.sort((a, b) => b.timestamp - a.timestamp)
    saveNotifications(list)
  }
}

export function getNotifIconColor(type: string): string {
  switch (type) {
    case 'out_of_stock':
    case 'sale':
    case 'product_deleted':
      return 'text-stock-red'
    case 'purchase':
      return 'text-stock-green'
    case 'low_stock':
    case 'adjustment':
      return 'text-stock-turmeric'
    default:
      return 'text-primary'
  }
}
