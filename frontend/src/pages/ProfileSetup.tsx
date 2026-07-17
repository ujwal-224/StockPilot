import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getShopProfile, updateShopProfile } from '../services/shopService'

const BUSINESS_TYPES = [
  'Kirana Store',
  'Grocery Store',
  'Pharmacy',
  'Bakery',
  'Electronics',
  'Clothing',
  'Restaurant',
  'Hardware',
  'Stationery',
  'Other',
]

const CURRENCIES = [
  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
  { value: 'AED', label: 'AED (د.إ) - UAE Dirham' },
]

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+5:30)' },
  { value: 'UTC', label: 'UTC (GMT+0:00)' },
  { value: 'America/New_York', label: 'America/New_York (GMT-5:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT+0:00 / +1:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8:00)' },
]

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi (हिन्दी)' },
  { value: 'Spanish', label: 'Spanish (Español)' },
  { value: 'French', label: 'French (Français)' },
  { value: 'Arabic', label: 'Arabic (العربية)' },
]

export default function ProfileSetup() {
  const { session, signOut, refreshSession } = useAuth()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    businessType: 'Kirana Store',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    preferredLanguage: 'English',
    shopLogo: '',
  })

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Pre-populate with existing signup info if available
    getShopProfile()
      .then((res) => {
        if (res.success && res.data) {
          const s = res.data
          setForm({
            name: s.name || '',
            phone: s.phone || '',
            businessType: s.businessType || 'Kirana Store',
            address: s.address || '',
            city: s.city || '',
            state: s.state || '',
            country: s.country || '',
            pincode: s.pincode || '',
            currency: s.currency || 'INR',
            timezone: s.timezone || 'Asia/Kolkata',
            preferredLanguage: s.preferredLanguage || 'English',
            shopLogo: s.shopLogo || '',
          })
          if (s.shopLogo) {
            setLogoPreview(s.shopLogo)
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load shop details:', err)
      })
      .finally(() => {
        setFetching(false)
      })
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to PNG, JPG, JPEG, SVG
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      return setError('Invalid file format. Please select PNG, JPG, JPEG, or SVG.')
    }

    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      return setError('Logo file size must not exceed 2 MB.')
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setLogoPreview(dataUrl)
      setForm((prev) => ({ ...prev, shopLogo: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const removeLogo = () => {
    setLogoPreview('')
    setForm((prev) => ({ ...prev, shopLogo: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic Validation
    if (!form.name.trim()) return setError('Shop Name is required')
    if (!form.phone.trim()) return setError('Phone Number is required')
    if (!form.businessType.trim()) return setError('Business Type is required')

    setLoading(true)
    try {
      const res = await updateShopProfile(form)
      if (res.success) {
        setToast('Shop profile set up successfully!')
        // Wait 1.5s then reload auth context so App.tsx redirects to dashboard
        setTimeout(async () => {
          await refreshSession()
        }, 1500)
      } else {
        setError('Failed to update shop details.')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong while setting up profile.')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <main className="min-h-screen bg-ledger-paper flex items-center justify-center p-5">
        <div className="text-primary font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined animate-spin">sync</span>
          Loading onboarding…
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-ledger-paper flex flex-col items-center justify-center p-4 md:p-8 select-none">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-container shadow-lg rounded-xl px-5 py-3 flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      {/* Floating Logout Button */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-secondary text-secondary font-bold text-xs hover:bg-secondary hover:text-white transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          Sign out
        </button>
      </div>

      <section className="w-full max-w-2xl bg-ledger-surface border border-ledger-hairline bahi-spine rounded-card p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
        {/* Onboarding Header */}
        <div className="text-center border-b border-ledger-divider pb-5 mb-6">
          <span className="text-[10px] font-bold text-secondary tracking-widest uppercase bg-surface-container-high px-3 py-1 rounded-full">
            Step 1 of 1 · Onboarding
          </span>
          <h1 className="font-headline-lg text-2xl md:text-3xl text-primary mt-3">
            Welcome to StockPilot!
          </h1>
          <p className="font-body-sm text-sm text-on-surface-variant mt-1.5">
            Let's set up your business in under a minute.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* LOGO UPLOAD COMPONENT */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-surface-container-low p-4 rounded-xl border border-outline-variant/40">
            <div className="relative group">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Shop Logo Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-dashed border-primary/40 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">storefront</span>
                </div>
              )}
              {logoPreview && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-1 -right-1 bg-stock-red text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-surface shadow-sm hover:bg-red-800 transition-colors"
                  title="Remove logo"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>
            <div className="flex-grow text-center sm:text-left">
              <h3 className="font-bold text-sm text-primary">Shop Logo</h3>
              <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                PNG, JPG, JPEG, or SVG. Maximum file size 2 MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleLogoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={triggerFileSelect}
                className="mt-3.5 px-4 py-2 bg-secondary hover:bg-primary text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
              >
                Choose Image File
              </button>
            </div>
          </div>

          {/* REQUIRED FIELDS SECTION */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase text-secondary tracking-wider border-b border-ledger-divider pb-1">
              Required Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  Shop Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ganesh Kirana Store"
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  Business Type
                </label>
                <select
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm"
                >
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* OPTIONAL FIELDS SECTION */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-xs uppercase text-secondary tracking-wider border-b border-ledger-divider pb-1">
              Location & Details (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. 123 Main Market, Ground Floor"
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="e.g. India"
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="e.g. 400001"
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* PREFERENCES SECTION */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-xs uppercase text-secondary tracking-wider border-b border-ledger-divider pb-1">
              Localization Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">Timezone</label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">Language</label>
                <select
                  value={form.preferredLanguage}
                  onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-error font-medium">{error}</p>}

          {/* Action button */}
          <button
            disabled={loading}
            className="w-full h-12 rounded-lg bg-primary hover:bg-brand-maroon text-white font-semibold shadow-sm hover:shadow-md disabled:opacity-60 transition-all duration-200 active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                Saving profile…
              </>
            ) : (
              <>
                Save & Continue
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  )
}
