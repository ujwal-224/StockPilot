import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../services/aiService'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────

/** Converts inline markdown tokens (**bold**, *italic*, `code`) to React nodes. */
function parseInline(text: string, keyBase: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Matches: `code`, **bold**, __bold__, *italic*, _italic_
  const regex = /(`[^`\n]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_)/g
  let lastIndex = 0
  let match
  let ki = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const m = match[0]
    const k = `${keyBase}-i${ki++}`
    if (m.startsWith('`') && m.endsWith('`')) {
      parts.push(
        <code key={k} className="bg-ledger-paper text-primary font-mono text-[0.8em] px-1 py-0.5 rounded border border-ledger-hairline">
          {m.slice(1, -1)}
        </code>
      )
    } else if (m.startsWith('**') || m.startsWith('__')) {
      parts.push(<strong key={k} className="font-bold">{m.slice(2, -2)}</strong>)
    } else {
      parts.push(<em key={k}>{m.slice(1, -1)}</em>)
    }
    lastIndex = match.index + m.length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

/** Converts a full markdown string into rendered React elements. */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]
    const k = String(key++)

    // ── Fenced code block ──────────────────────────────────────────────────────
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={k} className="bg-ledger-paper rounded-lg px-3 py-2.5 text-xs font-mono overflow-x-auto my-2 border border-ledger-hairline text-on-surface leading-relaxed">
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      i++; continue
    }

    // ── Headings ──────────────────────────────────────────────────────────────
    if (line.startsWith('### ')) {
      elements.push(<p key={k} className="font-semibold text-sm text-on-surface mt-2 mb-0.5">{parseInline(line.slice(4), k)}</p>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      elements.push(<p key={k} className="font-bold text-sm text-on-surface mt-2 mb-0.5">{parseInline(line.slice(3), k)}</p>)
      i++; continue
    }
    if (line.startsWith('# ')) {
      elements.push(<p key={k} className="font-bold text-base text-primary mt-2 mb-1">{parseInline(line.slice(2), k)}</p>)
      i++; continue
    }

    // ── Bullet list (collect consecutive items) ───────────────────────────────
    if (/^[-*+] /.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(<li key={i}>{parseInline(lines[i].slice(2), `${k}-li${i}`)}</li>)
        i++
      }
      elements.push(
        <ul key={k} className="list-disc pl-5 space-y-0.5 my-1 text-sm">{items}</ul>
      )
      continue
    }

    // ── Numbered list (collect consecutive items) ─────────────────────────────
    if (/^\d+\. /.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i}>{parseInline(lines[i].replace(/^\d+\. /, ''), `${k}-li${i}`)}</li>)
        i++
      }
      elements.push(
        <ol key={k} className="list-decimal pl-5 space-y-0.5 my-1 text-sm">{items}</ol>
      )
      continue
    }

    // ── Horizontal rule ───────────────────────────────────────────────────────
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={k} className="border-ledger-hairline my-2" />)
      i++; continue
    }

    // ── Blank line ────────────────────────────────────────────────────────────
    if (line.trim() === '') {
      elements.push(<div key={k} className="h-1.5" />)
      i++; continue
    }

    // ── Regular paragraph ─────────────────────────────────────────────────────
    elements.push(
      <p key={k} className="text-sm leading-relaxed">{parseInline(line, k)}</p>
    )
    i++
  }

  return <div className="space-y-0.5">{elements}</div>
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mb-1">
        <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
      </div>
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
    hour: '2-digit', minute: '2-digit', hour12: true,
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
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mb-5">
        <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
      </div>
      <div className="flex flex-col max-w-[80%]">
        <div className="bg-ledger-surface border border-ledger-hairline rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
          {/* Rendered markdown — no raw ** or * shown */}
          {renderMarkdown(msg.content)}
        </div>
        <span className="text-[10px] text-outline mt-1 ml-1">{timeStr}</span>
      </div>
    </div>
  )
}

// ─── Chat Window ──────────────────────────────────────────────────────────────

interface ChatWindowProps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isMaximized: boolean
  onMinimize: () => void
  onToggleMaximize: () => void
  onClose: () => void
}

function ChatWindow({
  messages,
  setMessages,
  isMaximized,
  onMinimize,
  onToggleMaximize,
  onClose,
}: ChatWindowProps) {
  const [input, setInput]       = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)

  // Smooth-scroll to the newest message or typing indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Re-focus input when switching maximize modes
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(t)
  }, [isMaximized])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }])
    setInput('')
    setIsLoading(true)

    try {
      const reply = await sendChatMessage(trimmed)
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: reply,
        timestamp: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'ai',
        content: 'Sorry, I could not reach the AI service right now. Please try again in a moment.',
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Sizing based on mode ───────────────────────────────────────────────────
  const panelStyle = isMaximized
    ? { width: 'min(900px, 80vw)', height: 'min(90vh, 860px)' }
    : { width: 'min(380px, calc(100vw - 2rem))', height: 'min(560px, calc(100dvh - 10rem))' }

  return (
    <>
      {/* ── Backdrop (maximized only) — clicking it restores floating mode ── */}
      {isMaximized && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onToggleMaximize}
        />
      )}

      {/* ── Outer positioning shell ── */}
      <div
        className={
          isMaximized
            ? 'fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4'
            : 'fixed bottom-24 right-4 sm:right-6 sm:bottom-6 z-50'
        }
      >
        {/* ── Panel ── */}
        <div
          className="flex flex-col bg-ledger-paper rounded-2xl shadow-2xl border border-ledger-hairline overflow-hidden bahi-spine pointer-events-auto"
          style={panelStyle}
        >

          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary flex-shrink-0">
            {/* Icon */}
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>

            {/* Title + status */}
            <div className="flex-grow min-w-0">
              <h3 className="font-bold text-white text-sm leading-tight">StockPilot AI</h3>
              <p className="text-white/70 text-[11px]">
                {isLoading
                  ? <span className="animate-pulse">Thinking…</span>
                  : 'Ask me anything about your store'
                }
              </p>
            </div>

            {/* ── Window controls ── */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {/* Minimize — hides window, preserves chat */}
              <button
                onClick={onMinimize}
                title="Minimize"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
                  remove
                </span>
              </button>

              {/* Maximize / Restore */}
              <button
                onClick={onToggleMaximize}
                title={isMaximized ? 'Restore' : 'Maximize'}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-white" style={{ fontSize: '17px' }}>
                  {isMaximized ? 'close_fullscreen' : 'open_in_full'}
                </span>
              </button>

              {/* Close — resets maximize state too */}
              <button
                onClick={onClose}
                title="Close"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
                  close
                </span>
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-grow overflow-y-auto px-3 pt-4 pb-2 no-scrollbar">
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input row ── */}
          <div className="flex-shrink-0 px-3 py-3 bg-ledger-surface hairline-top">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask about your inventory…"
                className="flex-grow h-10 px-3 text-sm font-body-sm bg-ledger-paper border border-ledger-hairline rounded-xl outline-none focus:border-primary transition-colors text-on-surface placeholder:text-outline disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                title="Send"
                className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary-container transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {isLoading
                  ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>sync</span>
                  : <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>send</span>
                }
              </button>
            </div>
            <p className="text-[10px] text-outline text-center mt-2">Powered by StockPilot AI</p>
          </div>

        </div>
      </div>
    </>
  )
}

// ─── Floating Button ──────────────────────────────────────────────────────────

interface FloatingButtonProps {
  isOpen: boolean
  isHidden: boolean
  onClick: () => void
}

function FloatingButton({ isOpen, isHidden, onClick }: FloatingButtonProps) {
  if (isHidden) return null

  return (
    <button
      onClick={onClick}
      title={isOpen ? 'Minimize AI Assistant' : 'Open AI Assistant'}
      className={`
        fixed bottom-20 right-4 sm:right-6 sm:bottom-6 z-50
        w-14 h-14 rounded-full shadow-lg
        flex items-center justify-center
        transition-all duration-300 active:scale-90
        ${isOpen
          ? 'bg-on-surface text-white'
          : 'bg-primary text-white hover:bg-primary-container hover:scale-105'
        }
      `}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '26px', fontVariationSettings: "'FILL' 1" }}
      >
        {isOpen ? 'close' : 'auto_awesome'}
      </span>
    </button>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AIAssistant() {
  const [isOpen,      setIsOpen]      = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  // Messages live in the parent so they persist across minimize/open cycles
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: "Namaste! I'm the StockPilot AI assistant. Ask me anything about your inventory, sales trends, or restocking strategies.",
      timestamp: new Date(),
    },
  ])

  // Minimize: hide window but keep chat history; float button still visible
  const handleMinimize = () => setIsOpen(false)

  // Close: hide window AND reset maximized state; chat history preserved
  const handleClose = () => { setIsOpen(false); setIsMaximized(false) }

  // Maximize / Restore toggle
  const handleToggleMaximize = () => setIsMaximized(prev => !prev)

  // Float button: toggle open. If re-opening, restore window in last mode.
  const handleFloatButton = () => setIsOpen(prev => !prev)

  return (
    <>
      {isOpen && (
        <ChatWindow
          messages={messages}
          setMessages={setMessages}
          isMaximized={isMaximized}
          onMinimize={handleMinimize}
          onToggleMaximize={handleToggleMaximize}
          onClose={handleClose}
        />
      )}

      {/* Hide the float button when maximized to avoid z-index overlap with backdrop */}
      <FloatingButton
        isOpen={isOpen}
        isHidden={isMaximized}
        onClick={handleFloatButton}
      />
    </>
  )
}
