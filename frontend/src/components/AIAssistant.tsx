import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../services/aiService'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      {/* AI Avatar */}
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mb-1">
        <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
      </div>
      {/* Bubble */}
      <div className="bg-ledger-surface border border-ledger-hairline rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'

  const timeStr = msg.timestamp.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2 mb-4">
        <div className="flex flex-col items-end max-w-[80%]">
          <div className="bg-primary text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
            <p className="font-body-sm text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          </div>
          <span className="text-[10px] text-outline mt-1 mr-1">{timeStr}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2 mb-4">
      {/* AI Avatar */}
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mb-5">
        <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
      </div>
      <div className="flex flex-col max-w-[80%]">
        <div className="bg-ledger-surface border border-ledger-hairline rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
          <p className="font-body-sm text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
        <span className="text-[10px] text-outline mt-1 ml-1">{timeStr}</span>
      </div>
    </div>
  )
}

// ─── Chat Window ──────────────────────────────────────────────────────────────

interface ChatWindowProps {
  onClose: () => void
}

function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: "Namaste! I'm the StockPilot AI assistant. Ask me anything about your inventory, sales trends, or restocking strategies.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when window opens
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const reply = await sendChatMessage(trimmed)
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: reply,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'ai',
        content: 'Sorry, I could not reach the AI service right now. Please try again in a moment.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col"
      style={{
        width: 'min(380px, calc(100vw - 2rem))',
        height: 'min(560px, calc(100dvh - 10rem))',
      }}
    >
      {/* Card shell */}
      <div className="flex flex-col h-full bg-ledger-paper rounded-2xl shadow-2xl border border-ledger-hairline overflow-hidden bahi-spine">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 bg-primary flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-bold text-white text-sm leading-tight">StockPilot AI</h3>
            <p className="text-white/70 text-[11px]">
              {isLoading ? (
                <span className="animate-pulse">Thinking…</span>
              ) : (
                'Ask me anything about your store'
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
            title="Close AI Assistant"
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* ── Messages ── */}
        <div className="flex-grow overflow-y-auto px-3 pt-4 pb-2 space-y-0 no-scrollbar">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Row ── */}
        <div className="flex-shrink-0 px-3 py-3 bg-ledger-surface hairline-top">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask about your inventory…"
              className="flex-grow h-10 px-3 text-sm font-body-sm bg-ledger-paper border border-ledger-hairline rounded-xl outline-none focus:border-primary transition-colors text-on-surface placeholder:text-outline disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary-container transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              title="Send message"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>
                  sync
                </span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                  send
                </span>
              )}
            </button>
          </div>
          <p className="text-[10px] text-outline text-center mt-2">
            Powered by StockPilot AI
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Floating Button ──────────────────────────────────────────────────────────

function FloatingButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      className={`
        fixed bottom-20 right-4 sm:right-6 sm:bottom-6 z-50
        w-14 h-14 rounded-full shadow-lg
        flex items-center justify-center
        transition-all duration-300 active:scale-90
        ${isOpen
          ? 'bg-on-surface text-white rotate-[360deg]'
          : 'bg-primary text-white hover:bg-primary-container hover:scale-105'
        }
      `}
    >
      <span
        className="material-symbols-outlined transition-transform duration-300"
        style={{
          fontSize: '26px',
          fontVariationSettings: "'FILL' 1",
        }}
      >
        {isOpen ? 'close' : 'auto_awesome'}
      </span>
    </button>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      <FloatingButton isOpen={isOpen} onClick={() => setIsOpen((prev) => !prev)} />
    </>
  )
}
