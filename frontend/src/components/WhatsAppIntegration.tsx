import { useMemo, useState } from 'react'

const SAVED_NUMBER_KEY = 'stockpilot.whatsapp.recipient'

const messageTemplates = [
  {
    label: 'Stock enquiry',
    message: 'Hello, I am contacting you from StockPilot. Could you please confirm the current stock availability?',
  },
  {
    label: 'Low-stock reminder',
    message: 'Hello, this is a StockPilot reminder: an item is running low. Please arrange replenishment at the earliest.',
  },
  {
    label: 'Order follow-up',
    message: 'Hello, I am following up on an inventory order from StockPilot. Please share the latest status.',
  },
]

export default function WhatsAppIntegration({ onBack }: { onBack: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem(SAVED_NUMBER_KEY) || '')
  const [message, setMessage] = useState(messageTemplates[0].message)
  const [error, setError] = useState('')

  const normalizedNumber = useMemo(() => phoneNumber.replace(/\D/g, ''), [phoneNumber])

  const openWhatsApp = () => {
    if (normalizedNumber.length < 8 || normalizedNumber.length > 15) {
      setError('Enter a valid WhatsApp number with country code, for example 919876543210.')
      return
    }
    if (!message.trim()) {
      setError('Enter a message before opening WhatsApp.')
      return
    }

    setError('')
    localStorage.setItem(SAVED_NUMBER_KEY, normalizedNumber)
    window.open(
      `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message.trim())}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-low" aria-label="Back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Chat on WhatsApp</h2>
          <p className="text-sm text-on-surface-variant">Open a prepared inventory message in WhatsApp</p>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-[#25D366]/40 bg-[#25D366]/5 text-sm text-on-surface-variant">
        This opens WhatsApp with your message ready to send. It does not link your account, read messages, or send automatic alerts.
      </div>

      {error && <div className="p-3 rounded-lg bg-stock-red/10 text-stock-red text-sm">{error}</div>}

      <section className="ledger-card p-5 space-y-5">
        <div>
          <label htmlFor="whatsapp-number" className="block font-semibold mb-2">WhatsApp recipient</label>
          <div className="flex items-center rounded-lg border border-outline-variant bg-surface overflow-hidden focus-within:border-primary">
            <span className="px-3 text-on-surface-variant">+</span>
            <input
              id="whatsapp-number"
              type="tel"
              inputMode="numeric"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="919876543210"
              className="w-full h-11 pr-3 bg-transparent outline-none"
            />
          </div>
          <p className="text-xs text-on-surface-variant mt-2">Include the country code and omit spaces or the leading +.</p>
        </div>

        <div>
          <p className="font-semibold mb-2">Quick messages</p>
          <div className="flex flex-wrap gap-2">
            {messageTemplates.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => setMessage(template.message)}
                className="px-3 py-2 rounded-full border border-outline-variant text-sm hover:border-primary hover:text-primary"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="whatsapp-message" className="block font-semibold mb-2">Message</label>
          <textarea
            id="whatsapp-message"
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type the message you want to send…"
            className="w-full p-3 rounded-lg border border-outline-variant bg-surface outline-none resize-y focus:border-primary"
          />
        </div>

        <button type="button" onClick={openWhatsApp} className="w-full h-11 bg-[#25D366] text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#20bd5a]">
          <span className="material-symbols-outlined">chat</span>
          Open in WhatsApp
        </button>
      </section>
    </div>
  )
}
