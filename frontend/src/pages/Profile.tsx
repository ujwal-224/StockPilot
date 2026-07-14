// ─── Data ────────────────────────────────────────────────────────────────────

const STORE_LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuACP3WYYWBkhJT-n7HcrMlD2ApHw29kJagqIYFHF-hs61xIGWBxefp2RuV3Tj4QJNtR4F-eQ3eAOhrkFMnnTqG78wxAUGHZDKH8tNdmdBO5GTsYL0axLrP4FCW8w7A8YnKe22KHR1TT0HkB8arilt6xEsWOu04RTpxU4gBiL9myeVg1QD-6C7mztMRCUTiJeL_bkoXiK3CYwz7lCrLiMHsItMC927q7m6pxOKzWRmipH-H8CSOfZnW2_SIX5oLh1tHfptdoMpT-J-Ax'

const settingsItems = [
  { icon: 'storefront', label: 'Shop Settings',        badge: null,     badgeClass: '' },
  { icon: 'schedule',   label: 'Business Hours',       badge: null,     badgeClass: '' },
  { icon: 'chat',       label: 'WhatsApp Integration', badge: 'ACTIVE', badgeClass: 'text-on-tertiary-fixed bg-tertiary-fixed text-[10px] font-bold px-1.5 py-0.5 rounded-full' },
  { icon: 'support_agent', label: 'Support',           badge: null,     badgeClass: '' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Profile() {
  return (
    <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-3xl mx-auto w-full space-y-6">

      {/* ── Two-column on desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 md:gap-8 items-start">

        {/* Profile Header Card */}
        <section className="bg-surface border border-outline-variant rounded-lg overflow-hidden bahi-khata-spine shadow-sm lg:w-80">
          <div className="p-6 flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full border-2 border-primary p-1">
                <img
                  className="w-full h-full rounded-full object-cover"
                  src={STORE_LOGO}
                  alt="Ganesh Kirana Store logo"
                />
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full border-2 border-surface">
                <span className="material-symbols-outlined block" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
            </div>

            <h2 className="font-headline-sm text-primary mb-1">Ganesh Kirana Store</h2>
            <p className="font-body-md text-secondary">Owner: Rajesh Kumar Gupta</p>

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

          {/* Quick stats (desktop bonus) */}
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
            <h3 className="font-body-sm text-secondary uppercase tracking-widest text-xs px-1">
              Account Management
            </h3>
            <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden divide-y divide-[#D8D4C7]">
              {settingsItems.map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center h-row-height-min px-4 bahi-khata-spine hover:bg-surface-variant transition-colors group"
                >
                  <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors">
                    {item.icon}
                  </span>
                  <span className="ml-4 flex-grow text-left font-body-md text-on-surface text-sm md:text-base">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className={item.badgeClass}>{item.badge}</span>
                    )}
                    <span className="material-symbols-outlined text-outline">chevron_right</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Notification preferences */}
          <section className="space-y-3">
            <h3 className="font-body-sm text-secondary uppercase tracking-widest text-xs px-1">
              Notifications
            </h3>
            <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden divide-y divide-[#D8D4C7]">
              {[
                { label: 'Low stock alerts',      checked: true  },
                { label: 'Daily sales summary',   checked: true  },
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
                  {/* Toggle */}
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${pref.checked ? 'bg-primary' : 'bg-outline-variant'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${pref.checked ? 'left-6' : 'left-1'}`} />
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Logout */}
          <div className="pt-2 space-y-4">
            <button className="w-full h-row-height-min border-2 border-secondary text-secondary font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-secondary hover:text-white active:scale-95 transition-all duration-150">
              <span className="material-symbols-outlined">logout</span>
              Logout
            </button>
            <p className="text-center font-body-sm text-outline text-xs">App Version 2.4.1-stable</p>
          </div>
        </div>
      </div>
    </main>
  )
}
