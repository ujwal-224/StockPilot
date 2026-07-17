import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getShopProfile, updateShopProfile, type ShopProfile } from '../services/shopService'

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

export default function Profile() {
  const { session, signOut, refreshSession } = useAuth()
  const [activeSection, setActiveSection] = useState<'overview' | 'shop-settings'>('overview')
  const [shop, setShop] = useState<ShopProfile | null>(null)
  
  // Shop Settings form state
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

  const isOwner = session?.membership.role === 'OWNER'

  const loadShopData = () => {
    setFetching(true)
    getShopProfile()
      .then((res) => {
        if (res.success && res.data) {
          const s = res.data
          setShop(s)
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
          setLogoPreview(s.shopLogo || '')
        }
      })
      .catch((err) => {
        console.error('Failed to load shop details:', err)
      })
      .finally(() => {
        setFetching(false)
      })
  }

  useEffect(() => {
    loadShopData()
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwner) return
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      return setError('Invalid file format. Please select PNG, JPG, JPEG, or SVG.')
    }

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

  const removeLogo = () => {
    if (!isOwner) return
    setLogoPreview('')
    setForm((prev) => ({ ...prev, shopLogo: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner) return
    setError('')

    if (!form.name.trim()) return setError('Shop Name is required')
    if (!form.phone.trim()) return setError('Phone Number is required')
    if (!form.businessType.trim()) return setError('Business Type is required')

    setLoading(true)
    try {
      const res = await updateShopProfile(form)
      if (res.success) {
        setToast('Shop profile updated successfully!')
        setShop(res.data)
        await refreshSession()
        setTimeout(() => setToast(''), 3000)
      } else {
        setError('Failed to update shop details.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong while updating profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = (label: string) => {
    if (label === 'Shop Settings') {
      setActiveSection('shop-settings')
    }
  }

  const settingsItems = [
    { icon: 'storefront', label: 'Shop Settings', badge: null, badgeClass: '' },
    { icon: 'schedule', label: 'Business Hours', badge: null, badgeClass: '' },
    {
      icon: 'chat',
      label: 'WhatsApp Integration',
      badge: 'ACTIVE',
      badgeClass:
        'text-on-tertiary-fixed bg-tertiary-fixed text-[10px] font-bold px-1.5 py-0.5 rounded-full',
    },
    { icon: 'support_agent', label: 'Support', badge: null, badgeClass: '' },
  ]

  if (fetching) {
    return (
      <main className="flex-grow p-5 md:p-8 lg:p-10 flex items-center justify-center">
        <div className="text-primary font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined animate-spin">sync</span>
          Loading profile...
        </div>
      </main>
    )
  }

  return (
    <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-3xl mx-auto w-full space-y-6 select-none relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-container shadow-lg rounded-xl px-5 py-3 flex items-center gap-3 animate-fade-in-down">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      {activeSection === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 md:gap-8 items-start animate-fade-in">
          {/* Profile Header Card */}
          <section className="bg-surface border border-outline-variant rounded-lg overflow-hidden bahi-khata-spine shadow-sm lg:w-80">
            <div className="p-6 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full border-2 border-primary p-1 bg-surface-container-low flex items-center justify-center overflow-hidden">
                  {shop?.shopLogo ? (
                    <img
                      className="w-full h-full rounded-full object-cover"
                      src={shop.shopLogo}
                      alt={`${shop.name} logo`}
                    />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-primary/60">
                      storefront
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full border-2 border-surface">
                  <span
                    className="material-symbols-outlined block"
                    style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
              </div>

              <h2 className="font-headline-sm text-primary mb-1 truncate max-w-full">
                {shop?.name || session?.shop.name}
              </h2>
              <p className="font-body-md text-secondary text-sm">
                {session?.user.name} · <span className="font-bold">{session?.membership.role}</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold rounded-full uppercase tracking-wider">
                  Platinum Merchant
                </span>
              </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 ruled-line bg-surface-container-low">
              <div className="p-4 text-center border-r border-outline-variant">
                <p className="font-body-sm text-secondary text-xs">Member Since</p>
                <p className="font-number-data font-bold text-primary mt-1">OCT 2021</p>
              </div>
              <div className="p-4 text-center">
                <p className="font-body-sm text-secondary text-xs">Store Rating</p>
                <p className="font-number-data font-bold text-primary flex items-center justify-center gap-1 mt-1">
                  4.8{' '}
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1", fontSize: '16px' }}
                  >
                    star
                  </span>
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="hidden lg:grid grid-cols-2 bg-surface-container-low">
              <div className="p-4 text-center border-r border-outline-variant">
                <p className="font-body-sm text-secondary text-xs">Total SKUs</p>
                <p className="font-number-data font-bold text-primary mt-1">1,248</p>
              </div>
              <div className="p-4 text-center">
                <p className="font-body-sm text-secondary text-xs">Monthly Sales</p>
                <p className="font-number-data font-bold text-primary mt-1">₹2.1L</p>
              </div>
            </div>
          </section>

          {/* Settings + Logout */}
          <div className="space-y-6">
            {/* Account Management */}
            <section className="space-y-3">
              <h3 className="font-body-sm text-secondary uppercase tracking-widest text-xs px-1 font-bold">
                Account Management
              </h3>
              <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden divide-y divide-[#D8D4C7]">
                {settingsItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleItemClick(item.label)}
                    className="w-full flex items-center h-row-height-min px-4 bahi-khata-spine hover:bg-surface-variant transition-colors group"
                  >
                    <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors">
                      {item.icon}
                    </span>
                    <span className="ml-4 flex-grow text-left font-body-md text-on-surface text-sm md:text-base">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.badge && <span className={item.badgeClass}>{item.badge}</span>}
                      <span className="material-symbols-outlined text-outline">chevron_right</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Notification preferences */}
            <section className="space-y-3">
              <h3 className="font-body-sm text-secondary uppercase tracking-widest text-xs px-1 font-bold">
                Notifications
              </h3>
              <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden divide-y divide-[#D8D4C7]">
                {[
                  { label: 'Low stock alerts', checked: true },
                  { label: 'Daily sales summary', checked: true },
                  { label: 'WhatsApp notifications', checked: false },
                ].map((pref) => (
                  <label
                    key={pref.label}
                    className="flex items-center h-row-height-min px-4 bahi-khata-spine hover:bg-surface-variant transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-secondary">notifications</span>
                    <span className="ml-4 flex-grow font-body-md text-on-surface text-sm md:text-base">
                      {pref.label}
                    </span>
                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        pref.checked ? 'bg-primary' : 'bg-outline-variant'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                          pref.checked ? 'left-6' : 'left-1'
                        }`}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Logout */}
            <div className="pt-2 space-y-4">
              <button
                onClick={signOut}
                className="w-full h-row-height-min border-2 border-secondary text-secondary font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-secondary hover:text-white active:scale-95 transition-all duration-150"
              >
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
              <p className="text-center font-body-sm text-outline text-xs">
                App Version 2.4.1-stable
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* SHOP SETTINGS FORM TAB */
        <div className="space-y-6 animate-fade-in">
          {/* Header & Back Button */}
          <div className="flex items-center justify-between border-b border-ledger-divider pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSection('overview')
                  setError('')
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors text-primary"
                title="Back to profile"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h1 className="font-headline-sm text-xl text-primary">Shop Settings</h1>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Manage your business profile details
                </p>
              </div>
            </div>
            {!isOwner && (
              <span className="text-[10px] font-bold text-outline-variant bg-surface-container-high px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">lock</span>
                Read Only
              </span>
            )}
          </div>

          {!isOwner && (
            <div className="bg-surface-container-low border border-outline-variant/60 p-3 rounded-lg flex items-center gap-2 text-secondary text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              Read-only access. Only the shop owner can edit shop information.
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Logo Upload (disabled if not owner) */}
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
                {isOwner && logoPreview && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-1 -right-1 bg-stock-red text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-surface shadow-sm hover:bg-red-800 transition-colors"
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
                  disabled={!isOwner}
                  accept=".png,.jpg,.jpeg,.svg"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 px-4 py-2 bg-secondary hover:bg-primary text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                  >
                    Choose Image File
                  </button>
                )}
              </div>
            </div>

            {/* General Info Card */}
            <div className="bg-surface border border-outline-variant rounded-lg p-5 space-y-4">
              <h3 className="font-bold text-xs uppercase text-secondary tracking-wider border-b border-ledger-divider pb-1">
                Required Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isOwner}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={!isOwner}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm disabled:opacity-75"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                    Business Type
                  </label>
                  <select
                    disabled={!isOwner}
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm disabled:opacity-75"
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

            {/* Optional Location Card */}
            <div className="bg-surface border border-outline-variant rounded-lg p-5 space-y-4">
              <h3 className="font-bold text-xs uppercase text-secondary tracking-wider border-b border-ledger-divider pb-1">
                Location Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                    Street Address
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                    City
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                    State
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                    Country
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                    Pincode
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm disabled:opacity-75"
                  />
                </div>
              </div>
            </div>

            {/* Localization Preferences Card */}
            <div className="bg-surface border border-outline-variant rounded-lg p-5 space-y-4">
              <h3 className="font-bold text-xs uppercase text-secondary tracking-wider border-b border-ledger-divider pb-1">
                Localization settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                    Currency
                  </label>
                  <select
                    disabled={!isOwner}
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm disabled:opacity-75"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                    Timezone
                  </label>
                  <select
                    disabled={!isOwner}
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm disabled:opacity-75"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                    Language
                  </label>
                  <select
                    disabled={!isOwner}
                    value={form.preferredLanguage}
                    onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors text-sm disabled:opacity-75"
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

            {/* Save Button (OWNER only) */}
            {isOwner && (
              <button
                disabled={loading}
                className="w-full h-12 rounded-lg bg-primary hover:bg-brand-maroon text-white font-semibold shadow-sm hover:shadow-md disabled:opacity-60 transition-all duration-200 active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                    Saving changes…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            )}
          </form>
        </div>
      )}
    </main>
  )
}
