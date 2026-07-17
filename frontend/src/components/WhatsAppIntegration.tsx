import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  createWhatsAppLinkCode, disconnectWhatsApp, getWhatsAppStatus,
  updateWhatsAppSettings, type WhatsAppStatus,
} from '../services/whatsappService'

export default function WhatsAppIntegration({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null)
  const [code, setCode] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = () => getWhatsAppStatus()
    .then((data) => { setStatus(data); setBusinessNumber(data.businessNumber) })
    .catch(() => setError('Unable to load WhatsApp status.'))
    .finally(() => setLoading(false))

  useEffect(() => { void load() }, [])
  useEffect(() => {
    if (!code || status?.linked) return
    const timer = window.setInterval(() => { void load() }, 5000)
    return () => window.clearInterval(timer)
  }, [code, status?.linked])

  const generateCode = async () => {
    setBusy(true); setError('')
    try {
      const result = await createWhatsAppLinkCode()
      setCode(result.code); setExpiresAt(result.expiresAt); setBusinessNumber(result.businessNumber)
    } catch (requestError) {
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.message || 'Unable to generate code.' : 'Unable to generate code.')
    } finally { setBusy(false) }
  }

  const openWhatsApp = () => {
    const phone = businessNumber.replace(/\D/g, '')
    if (!phone || !code) return
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`LINK ${code}`)}`, '_blank', 'noopener,noreferrer')
  }

  const toggleAlerts = async () => {
    if (!status) return
    const enabled = !status.lowStockAlertsEnabled
    setStatus({ ...status, lowStockAlertsEnabled: enabled })
    try { await updateWhatsAppSettings(enabled) }
    catch { setStatus({ ...status }); setError('Unable to update alert settings.') }
  }

  const disconnect = async () => {
    if (!window.confirm('Disconnect this WhatsApp number from StockPilot?')) return
    setBusy(true)
    try { await disconnectWhatsApp(); setCode(''); await load() }
    catch { setError('Unable to disconnect WhatsApp.') }
    finally { setBusy(false) }
  }

  if (loading) return <div className="ledger-card p-8 text-center">Loading WhatsApp integration…</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-low" aria-label="Back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div><h2 className="text-2xl font-bold text-on-surface">WhatsApp Integration</h2><p className="text-sm text-on-surface-variant">Manage inventory using simple WhatsApp messages</p></div>
      </div>

      {!status?.configured && <div className="p-4 rounded-lg border border-stock-turmeric bg-stock-turmeric/5 text-sm">The server administrator must configure the WhatsApp Cloud API credentials before linking.</div>}
      {error && <div className="p-3 rounded-lg bg-stock-red/10 text-stock-red text-sm">{error}</div>}

      {status?.linked ? (
        <>
          <section className="ledger-card p-5 space-y-4">
            <div className="flex items-center gap-3"><span className="material-symbols-outlined text-stock-green text-3xl">check_circle</span><div><h3 className="font-bold">Connected</h3><p className="text-sm text-on-surface-variant">+{status.phoneNumber}</p></div></div>
            <div className="flex items-center justify-between border-t border-outline-variant pt-4">
              <div><p className="font-semibold">Low-stock alerts</p><p className="text-xs text-on-surface-variant">Receive an approved WhatsApp alert when stock crosses its threshold.</p></div>
              <button onClick={toggleAlerts} className={`relative w-12 h-7 rounded-full ${status.lowStockAlertsEnabled ? 'bg-primary' : 'bg-outline-variant'}`} aria-label="Toggle low-stock alerts"><span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${status.lowStockAlertsEnabled ? 'left-6' : 'left-1'}`} /></button>
            </div>
          </section>
          <section className="ledger-card p-5"><h3 className="font-bold mb-3">Available commands</h3><div className="grid sm:grid-cols-2 gap-2 text-sm font-mono"><span>STOCK rice</span><span>LOW</span><span>OUT</span><span>ADD rice 20</span><span>SALE rice 3</span><span>SET rice 15</span></div></section>
          <button disabled={busy} onClick={disconnect} className="w-full h-11 border border-stock-red text-stock-red rounded-lg font-semibold disabled:opacity-50">Disconnect WhatsApp</button>
        </>
      ) : (
        <section className="ledger-card p-5 space-y-5">
          <div><h3 className="font-bold text-lg">Link your number</h3><p className="text-sm text-on-surface-variant mt-1">Generate a private code and send it from the WhatsApp number you want to link.</p></div>
          {!code ? <button disabled={busy || !status?.configured} onClick={generateCode} className="w-full h-11 bg-primary text-white rounded-lg font-semibold disabled:opacity-50">{busy ? 'Generating…' : 'Generate linking code'}</button> : <>
            <div className="text-center p-5 rounded-lg bg-tertiary-fixed"><p className="text-xs uppercase tracking-wider">Your 10-minute code</p><p className="text-3xl font-bold tracking-widest text-primary mt-1">{code}</p><p className="text-xs mt-2">Expires {new Date(expiresAt).toLocaleTimeString()}</p></div>
            <button disabled={!businessNumber} onClick={openWhatsApp} className="w-full h-11 bg-[#25D366] text-white rounded-lg font-semibold disabled:opacity-50">Open WhatsApp and link</button>
            <p className="text-xs text-center text-on-surface-variant">Or send <strong>LINK {code}</strong> to {businessNumber || 'the configured StockPilot number'}.</p>
          </>}
        </section>
      )}
    </div>
  )
}
