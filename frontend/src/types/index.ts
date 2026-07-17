export type PageId = 'home' | 'inventory' | 'transactions' | 'analytics' | 'team' | 'profile' | 'profile-setup'

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export interface ProductInfo {
  _id: string
  name: string
  category: string
  unit: string
  price: number
}

export interface BackendProduct {
  _id: string
  name: string
  category: string
  price: number
  stock: number
  unit: string
  threshold: number
  image?: string
  createdAt?: string
  updatedAt?: string
}

export interface InventoryItem {
  id: string
  name: string
  qty: string
  progressPct: number
  status: StockStatus
  category: string
  price: number
  stock: number
  unit: string
  threshold: number
  image: string
}

export interface TransactionRecord {
  _id: string
  product: ProductInfo | null
  productSnapshot?: { name?: string; category?: string; unit?: string }
  unitPrice?: number
  type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT'
  quantity: number
  previousStock: number
  newStock: number
  note: string
  createdAt: string
}

export interface CreateTransactionData {
  product: string
  type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT'
  quantity: number
  note?: string
}

export interface DashboardData {
  totalProducts: number
  lowStockCount: number
  todayTransactions: number
  lowStockProducts: BackendProduct[]
  recentTransactions: TransactionRecord[]
}

export interface AnalyticsData {
  weeklySales: {
    totalRevenue: number
    changePercentage: number
  }
  dailySales: {
    day: string
    sales: number
  }[]
  categorySales: {
    category: string
    revenue: number
  }[]
  fastMovingItems: {
    name: string
    quantitySold: number
    revenue: number
    stock: number
  }[]
}

export interface AppNotification {
  id: string
  title: string
  description: string
  icon: string
  timestamp: number
  read: boolean
  type: 'product_added' | 'product_updated' | 'product_deleted' | 'sale' | 'purchase' | 'adjustment' | 'low_stock' | 'out_of_stock'
}
