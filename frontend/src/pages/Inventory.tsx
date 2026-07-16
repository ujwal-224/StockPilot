import { useState, useMemo, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService'
import { createTransaction } from '../services/transactionService'
import type { StockStatus, InventoryItem, BackendProduct } from '../types'
import { LoadingCard, EmptyState } from '../components/SharedComponents'
import { addNotification } from '../services/notificationService'

// ─── Backend → UI mapper ──────────────────────────────────────────────────────

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
    category:    p.category || '',
    price:       p.price || 0,
    stock:       p.stock,
    unit:        p.unit,
    threshold:   p.threshold,
    image:       p.image || '',
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
  const [searchQuery,  setSearchQuery]  = useState<string>(() => {
    const saved = localStorage.getItem('inventory-search')
    if (saved) {
      localStorage.removeItem('inventory-search')
      return saved
    }
    return ''
  })
  const [activeFilter, setActiveFilter] = useState<FilterId>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    unit: 'piece',
    threshold: '10',
    image: '',
  })

  // Transaction Modal State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [transactionForm, setTransactionForm] = useState({
    productId: '',
    type: 'SALE',
    quantity: '',
    note: '',
  })

  const selectedProduct = useMemo(() => {
    return allItems.find((item) => item.id === transactionForm.productId)
  }, [allItems, transactionForm.productId])

  const fetchProducts = () => {
    getProducts()
      .then((res) => {
        setAllItems(res.data.map(mapProduct))
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }

  // Fetch products from backend on mount
  useEffect(() => {
    fetchProducts()
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const openModal = () => {
    setEditingId(null)
    setFormData({
      name: '',
      category: '',
      price: '',
      stock: '',
      unit: 'piece',
      threshold: '10',
      image: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(item.id)
    setFormData({
      name: item.name,
      category: item.category,
      price: String(item.price),
      stock: String(item.stock),
      unit: item.unit,
      threshold: String(item.threshold),
      image: item.image,
    })
    setIsModalOpen(true)
  }

  const openTransactionModal = () => {
    setTransactionForm({
      productId: '',
      type: 'SALE',
      quantity: '',
      note: '',
    })
    setIsTransactionModalOpen(true)
  }

  const handleTransactionInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setTransactionForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleTransactionSave = (e: React.FormEvent) => {
    e.preventDefault()
    const product = allItems.find((p) => p.id === transactionForm.productId)
    const productName = product ? product.name : 'Unknown Product'
    const productUnit = product ? ` ${product.unit}` : ''

    createTransaction({
      product: transactionForm.productId,
      type: transactionForm.type as 'SALE' | 'PURCHASE' | 'ADJUSTMENT',
      quantity: Number(transactionForm.quantity),
      note: transactionForm.note,
    })
      .then((res) => {
        toast.success("Transaction recorded successfully")
        
        const newTrans = res.data
        const quantity = Number(transactionForm.quantity)
        const type = transactionForm.type as 'SALE' | 'PURCHASE' | 'ADJUSTMENT'
        
        let notifTitle = ''
        let notifDesc = ''
        let notifIcon = ''
        let notifType: 'sale' | 'purchase' | 'adjustment' = 'sale'

        if (type === 'SALE') {
          notifTitle = 'Sale Recorded'
          notifDesc = `Sold ${quantity}${productUnit} of ${productName}.`
          notifIcon = 'shopping_cart'
          notifType = 'sale'
        } else if (type === 'PURCHASE') {
          notifTitle = 'Purchase Recorded'
          notifDesc = `Purchased ${quantity}${productUnit} of ${productName}.`
          notifIcon = 'local_shipping'
          notifType = 'purchase'
        } else if (type === 'ADJUSTMENT') {
          notifTitle = 'Stock Adjusted'
          notifDesc = `Adjusted stock of ${productName}.`
          notifIcon = 'sync_alt'
          notifType = 'adjustment'
        }

        addNotification({
          id: `trans-${newTrans._id}`,
          type: notifType,
          title: notifTitle,
          description: notifDesc,
          icon: notifIcon
        })

        setIsTransactionModalOpen(false)
        setTransactionForm({
          productId: '',
          type: 'SALE',
          quantity: '',
          note: '',
        })
        fetchProducts()
      })
      .catch((error: unknown) => {
        console.error('Error recording transaction:', error)
        const err = error as { response?: { data?: { message?: string } } }
        toast.error(err.response?.data?.message || "Failed to record transaction")
      })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const { name, category, price, stock, unit, threshold, image } = formData

    if (editingId) {
      updateProduct(editingId, {
        name,
        category,
        price: Number(price),
        stock: Number(stock),
        unit,
        threshold: Number(threshold),
        image,
      })
        .then((res) => {
          toast.success("Product updated successfully")
          const updatedProd = res.data
          addNotification({
            id: `updated-${editingId}-${Date.now()}`,
            type: 'product_updated',
            title: 'Product Updated',
            description: `Updated "${updatedProd.name}".`,
            icon: 'edit'
          })
          setIsModalOpen(false)
          setFormData({
            name: '',
            category: '',
            price: '',
            stock: '',
            unit: 'piece',
            threshold: '10',
            image: '',
          })
          setEditingId(null)
          fetchProducts()
        })
        .catch((err) => {
          console.error('Error updating product:', err)
          toast.error("Failed to update product")
        })
    } else {
      createProduct({
        name,
        category,
        price: Number(price),
        stock: Number(stock),
        unit,
        threshold: Number(threshold),
        image,
      })
        .then((res) => {
          toast.success("Product added successfully")
          const newProd = res.data
          addNotification({
            id: `added-${newProd._id}`,
            type: 'product_added',
            title: 'Product Added',
            description: `Added "${newProd.name}" to inventory.`,
            icon: 'inventory_2'
          })
          setIsModalOpen(false)
          setFormData({
            name: '',
            category: '',
            price: '',
            stock: '',
            unit: 'piece',
            threshold: '10',
            image: '',
          })
          fetchProducts()
        })
        .catch((err) => {
          console.error('Error adding product:', err)
          toast.error("Failed to add product")
        })
    }
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(id)
  }

  const confirmDeleteProduct = () => {
    if (!deletingId) return

    const product = allItems.find((p) => p.id === deletingId)
    const productName = product ? product.name : 'Unknown Product'

    deleteProduct(deletingId)
      .then(() => {
        toast.success("Product deleted successfully")
        addNotification({
          id: `deleted-${deletingId}-${Date.now()}`,
          type: 'product_deleted',
          title: 'Product Deleted',
          description: `Removed "${productName}" from inventory.`,
          icon: 'delete'
        })
        setDeletingId(null)
        fetchProducts()
      })
      .catch((err) => {
        console.error('Error deleting product:', err)
        toast.error("Failed to delete product")
      })
  }

  return (
    <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-5xl mx-auto w-full space-y-5">
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            duration: 2500,
            style: {
              background: '#F4F2EC',
              color: '#211a1a',
              border: '1px solid #D8D4C7',
              borderLeft: '4px solid #2D5A27',
              fontFamily: 'IBM Plex Sans, sans-serif'
            }
          },
          error: {
            duration: 3500,
            style: {
              background: '#F4F2EC',
              color: '#211a1a',
              border: '1px solid #D8D4C7',
              borderLeft: '4px solid #B33B2E',
              fontFamily: 'IBM Plex Sans, sans-serif'
            }
          }
        }}
      />

      {/* ── Page title (desktop) ── */}
      <div className="hidden lg:flex justify-between items-center">
        <div>
          <h2 className="font-headline-lg text-2xl text-on-surface">Live Inventory</h2>
          <p className="font-body-sm text-sm text-on-surface-variant mt-1">
            {loading ? 'Loading…' : `${filteredItems.length} items · ${lowCount} low stock · ${outCount} out of stock`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openTransactionModal}
            className="border border-bahi-hairline bg-ledger-surface text-secondary hover:bg-surface-container-high px-4 py-2 font-body-sm text-sm font-semibold rounded-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span> Record Transaction
          </button>
          <button
            onClick={openModal}
            className="bg-primary text-white px-4 py-2 font-body-sm text-sm font-semibold rounded-sm hover:bg-primary-container transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Add Product
          </button>
        </div>
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
        <div className="flex justify-between items-center lg:hidden">
          <h3 className="font-headline-sm text-primary">Live Inventory</h3>
          <div className="flex gap-2">
            <button
              onClick={openTransactionModal}
              className="border border-bahi-hairline bg-ledger-surface text-secondary hover:bg-surface-container-high px-2.5 py-1.5 font-body-sm text-[11px] font-semibold rounded-sm transition-all active:scale-95 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">swap_horiz</span> Record
            </button>
            <button
              onClick={openModal}
              className="bg-primary text-white px-2.5 py-1.5 font-body-sm text-[11px] font-semibold rounded-sm hover:bg-primary-container transition-all active:scale-95 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">add</span> Add Product
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && <LoadingCard message="Loading inventory..." />}

        {/* Error state */}
        {!loading && error && (
          <EmptyState
            icon="error_outline"
            message="Unable to load inventory."
            paddingClass="p-8"
            textColor="text-stock-red"
            iconColor="text-stock-red"
          />
        )}

        {/* Empty search result */}
        {!loading && !error && filteredItems.length === 0 && (
          <EmptyState
            icon="inventory_2"
            message="No items match your search."
            paddingClass="p-8"
          />
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
                      <div className="w-24 sm:w-32 md:w-40 h-1.5 bg-outline-variant rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                          style={{ width: `${item.progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Qty + status badge */}
                    <div className="text-right flex-shrink-0 flex items-center gap-3">
                      <div>
                        <span className={`font-number-data text-sm block ${cfg.qtyClass}`}>{item.qty}</span>
                        <span className={`text-[10px] font-body-sm uppercase tracking-widest ${cfg.labelClass}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <button
                        onClick={(e) => openEditModal(item, e)}
                        className="text-secondary hover:text-primary transition-colors p-1"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="text-secondary hover:text-stock-red transition-colors p-1"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Add Product Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-ledger-surface max-w-md w-full rounded-lg border border-bahi-hairline bahi-spine p-6 shadow-xl relative space-y-4">
            <div className="flex justify-between items-center hairline-bottom pb-3">
              <h3 className="font-headline-sm text-primary">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-secondary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 font-body-sm text-sm">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-on-surface">Product Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Basmati Rice"
                  className="w-full h-11 px-3 input-bahi font-body-md text-sm rounded-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-on-surface">Category</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full h-11 px-3 input-bahi font-body-md text-sm rounded-sm bg-ledger-paper"
                >
                  <option value="" disabled>Select Category</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Grains">Grains</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Oils">Oils</option>
                  <option value="Spices">Spices</option>
                  <option value="Pulses">Pulses</option>
                  <option value="Rice & Flour">Rice & Flour</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Frozen Foods">Frozen Foods</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface">Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full h-11 px-3 input-bahi font-body-md text-sm rounded-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full h-11 px-3 input-bahi font-body-md text-sm rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface">Unit</label>
                  <select
                    name="unit"
                    required
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 input-bahi font-body-md text-sm rounded-sm bg-ledger-paper"
                  >
                    <option value="piece">piece</option>
                    <option value="kg">kg</option>
                    <option value="litre">litre</option>
                    <option value="packet">packet</option>
                    <option value="bottle">bottle</option>
                    <option value="box">box</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface">Threshold</label>
                  <input
                    type="number"
                    name="threshold"
                    min="0"
                    required
                    value={formData.threshold}
                    onChange={handleInputChange}
                    placeholder="10"
                    className="w-full h-11 px-3 input-bahi font-body-md text-sm rounded-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-on-surface">Image URL (Optional)</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full h-11 px-3 input-bahi font-body-md text-sm rounded-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 hairline-top">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 h-10 border border-bahi-hairline text-secondary hover:bg-surface-container-high rounded-sm transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 h-10 bg-primary text-white hover:bg-primary-container rounded-sm transition-all font-semibold"
                >
                  {editingId ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-ledger-surface max-w-md w-full rounded-lg border border-bahi-hairline bahi-spine-red p-6 shadow-xl relative space-y-4">
            <div className="flex justify-between items-center hairline-bottom pb-3">
              <h3 className="font-headline-sm text-stock-red">Delete Product</h3>
              <button
                onClick={() => setDeletingId(null)}
                className="text-secondary hover:text-stock-red transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2 py-2">
              <p className="font-body-md text-on-surface">
                Are you sure you want to delete this product?
              </p>
              <p className="font-body-sm text-secondary">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 hairline-top">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 h-10 border border-bahi-hairline text-secondary hover:bg-surface-container-high rounded-sm transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                className="px-4 h-10 bg-stock-red text-white hover:bg-stock-red/90 rounded-sm transition-all font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Record Transaction Modal ── */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-ledger-surface max-w-md w-full rounded-lg border border-bahi-hairline bahi-spine p-6 shadow-xl relative space-y-4">
            <div className="flex justify-between items-center hairline-bottom pb-3">
              <h3 className="font-headline-sm text-primary">Record Transaction</h3>
              <button
                onClick={() => setIsTransactionModalOpen(false)}
                className="text-secondary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleTransactionSave} className="space-y-4 font-body-sm text-sm">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-on-surface">Product</label>
                <select
                  name="productId"
                  required
                  value={transactionForm.productId}
                  onChange={handleTransactionInputChange}
                  className="w-full h-11 px-3 input-bahi font-body-md text-sm rounded-sm bg-ledger-paper"
                >
                  <option value="" disabled>Select Product</option>
                  {allItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="bg-ledger-paper p-3 rounded border border-bahi-hairline space-y-1 font-body-sm text-xs text-secondary mt-1">
                  <div className="flex justify-between">
                    <span>Current Stock:</span>
                    <span className="font-bold text-on-surface">{selectedProduct.stock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Unit:</span>
                    <span className="font-bold text-on-surface">{selectedProduct.unit}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="font-bold text-on-surface">Transaction Type</label>
                <select
                  name="type"
                  required
                  value={transactionForm.type}
                  onChange={handleTransactionInputChange}
                  className="w-full h-11 px-3 input-bahi font-body-md text-sm rounded-sm bg-ledger-paper"
                >
                  <option value="SALE">SALE</option>
                  <option value="PURCHASE">PURCHASE</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-on-surface">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  required
                  value={transactionForm.quantity}
                  onChange={handleTransactionInputChange}
                  placeholder="0"
                  className="w-full h-11 px-3 input-bahi font-body-md text-sm rounded-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-on-surface">Note</label>
                <textarea
                  name="note"
                  value={transactionForm.note}
                  onChange={handleTransactionInputChange}
                  placeholder="Add a transaction note..."
                  rows={3}
                  className="w-full p-3 input-bahi font-body-md text-sm rounded-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 hairline-top">
                <button
                  type="button"
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="px-4 h-10 border border-bahi-hairline text-secondary hover:bg-surface-container-high rounded-sm transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 h-10 bg-primary text-white hover:bg-primary-container rounded-sm transition-all font-semibold"
                >
                  Record Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
