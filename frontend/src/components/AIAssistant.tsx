import { useState, useRef, useEffect, useCallback } from 'react'
import { sendChatMessage } from '../services/aiService'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

// ─── Suggested Prompts ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: 'Inventory Summary',      icon: 'inventory_2',     prompt: 'Give me a complete summary of my current inventory.' },
  { label: 'Low Stock Items',        icon: 'warning',         prompt: 'Which items are currently low on stock or out of stock?' },
  { label: 'Restocking Suggestions', icon: 'shopping_cart',   prompt: 'Which items should I restock soon? Give me purchase recommendations.' },
  { label: "Today's Updates",        icon: 'update',          prompt: 'What are the most important inventory updates I should know about today?' },
]

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function parseInline(text: string, keyBase: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(`[^`\n]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_)/g
  let lastIndex = 0
  let match
  let ki = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
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

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]
    const k = String(key++)

    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]); i++
      }
      elements.push(
        <pre key={k} className="bg-ledger-paper rounded-lg px-3 py-2.5 text-xs font-mono overflow-x-auto my-2 border border-ledger-hairline text-on-surface leading-relaxed">
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      i++; continue
    }
    if (line.startsWith('### ')) { elements.push(<p key={k} className="font-semibold text-sm text-on-surface mt-2 mb-0.5">{parseInline(line.slice(4), k)}</p>); i++; continue }
    if (line.startsWith('## '))  { elements.push(<p key={k} className="font-bold text-sm text-on-surface mt-2 mb-0.5">{parseInline(line.slice(3), k)}</p>); i++; continue }
    if (line.startsWith('# '))   { elements.push(<p key={k} className="font-bold text-base text-primary mt-2 mb-1">{parseInline(line.slice(2), k)}</p>); i++; continue }

    if (/^[-*+] /.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(<li key={i}>{parseInline(lines[i].slice(2), `${k}-li${i}`)}</li>); i++
      }
      elements.push(<ul key={k} className="list-disc pl-5 space-y-0.5 my-1 text-sm">{items}</ul>)
      continue
    }
    if (/^\d+\. /.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i}>{parseInline(lines[i].replace(/^\d+\. /, ''), `${k}-li${i}`)}</li>); i++
      }
      elements.push(<ol key={k} className="list-decimal pl-5 space-y-0.5 my-1 text-sm">{items}</ol>)
      continue
    }
    if (/^---+$/.test(line.trim())) { elements.push(<hr key={k} className="border-ledger-hairline my-2" />); i++; continue }
    if (line.trim() === '') { elements.push(<div key={k} className="h-1.5" />); i++; continue }

    elements.push(<p key={k} className="text-sm leading-relaxed">{parseInline(line, k)}</p>)
    i++
  }
  return <div className="space-y-0.5">{elements}</div>
}

// ─── Typing Indicator (three animated dots) ───────────────────────────────────

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

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleCopy}
        title="Copy response"
        className="w-6 h-6 flex items-center justify-center rounded-md text-outline hover:text-primary hover:bg-ledger-surface transition-all"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: copied ? "'FILL' 1" : "'FILL' 0" }}>
          {copied ? 'check_circle' : 'content_copy'}
        </span>
      </button>
      {copied && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-on-surface text-white text-[10px] rounded-md whitespace-nowrap pointer-events-none z-10">
          Copied!
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-on-surface" />
        </div>
      )}
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
        <div className="group bg-ledger-surface border border-ledger-hairline rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
          {renderMarkdown(msg.content)}
          {/* Copy button — appears in bottom-right of bubble on hover */}
          <div className="flex justify-end mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={msg.content} />
          </div>
        </div>
        <span className="text-[10px] text-outline mt-1 ml-1">{timeStr}</span>
      </div>
    </div>
  )
}

// ─── Empty / Welcome State ────────────────────────────────────────────────────

interface WelcomeStateProps {
  onSuggestion: (prompt: string) => void
}

function WelcomeState({ onSuggestion }: WelcomeStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6 text-center gap-5">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
      </div>

      {/* Title + subtitle */}
      <div className="space-y-1.5">
        <h2 className="font-bold text-on-surface text-base leading-tight">Hello! I'm StockPilot AI</h2>
        <p className="text-outline text-xs leading-relaxed max-w-[260px]">
          I can help you with inventory management, stock monitoring, restocking suggestions, and business insights.
        </p>
      </div>

      {/* Suggestion cards */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {SUGGESTIONS.map(s => (
          <button
            key={s.label}
            onClick={() => onSuggestion(s.prompt)}
            className="flex flex-col items-start gap-1.5 p-3 bg-ledger-surface border border-ledger-hairline rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left active:scale-95 group"
          >
            <span
              className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform"
              style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
            >
              {s.icon}
            </span>
            <span className="text-[11px] font-medium text-on-surface leading-tight">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Chat Window ──────────────────────────────────────────────────────────────

interface ChatWindowProps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  hasUserSentMessage: boolean
  setHasUserSentMessage: React.Dispatch<React.SetStateAction<boolean>>
  isMaximized: boolean
  onMinimize: () => void
  onToggleMaximize: () => void
  onClose: () => void
}

function ChatWindow({
  messages,
  setMessages,
  hasUserSentMessage,
  setHasUserSentMessage,
  isMaximized,
  onMinimize,
  onToggleMaximize,
  onClose,
}: ChatWindowProps) {
  const [input, setInput]           = useState('')
  const [isLoading, setIsLoading]   = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)

  // Smooth-scroll to newest message / typing indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Re-focus input when switching maximize modes
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(t)
  }, [isMaximized])

  const dispatchMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setHasUserSentMessage(true)
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
  }, [isLoading, setMessages, setHasUserSentMessage])

  const handleSend = () => dispatchMessage(input)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleSuggestion = (prompt: string) => dispatchMessage(prompt)

  // ── Panel sizing ──────────────────────────────────────────────────────────
  const panelStyle = isMaximized
    ? { width: 'min(900px, 80vw)', height: 'min(90vh, 860px)' }
    : { width: 'min(380px, calc(100vw - 2rem))', height: 'min(560px, calc(100dvh - 10rem))' }

  // Show welcome state only when no user message has been sent yet
  const showWelcome = !hasUserSentMessage

  return (
    <>
      {/* Backdrop — maximized mode only */}
      {isMaximized && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onToggleMaximize}
        />
      )}

      {/* Outer positioning shell */}
      <div
        className={
          isMaximized
            ? 'fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4'
            : 'fixed bottom-24 right-4 sm:right-6 sm:bottom-6 z-50'
        }
      >
        {/* Panel */}
        <div
          className="flex flex-col bg-ledger-paper rounded-2xl shadow-2xl border border-ledger-hairline overflow-hidden bahi-spine pointer-events-auto"
          style={panelStyle}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>

            <div className="flex-grow min-w-0">
              <h3 className="font-bold text-white text-sm leading-tight">StockPilot AI</h3>
              <p className="text-white/70 text-[11px]">
                {isLoading
                  ? <span className="animate-pulse">Thinking…</span>
                  : 'Ask me anything about your store'
                }
              </p>
            </div>

            {/* Window controls */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={onMinimize} title="Minimize" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>remove</span>
              </button>
              <button onClick={onToggleMaximize} title={isMaximized ? 'Restore' : 'Maximize'} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '17px' }}>{isMaximized ? 'close_fullscreen' : 'open_in_full'}</span>
              </button>
              <button onClick={onClose} title="Close" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-grow overflow-y-auto no-scrollbar">
            {showWelcome ? (
              /* Empty / Welcome state with suggestion cards */
              <WelcomeState onSuggestion={handleSuggestion} />
            ) : (
              /* Message list */
              <div className="px-3 pt-4 pb-2">
                {messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
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
      <span className="material-symbols-outlined" style={{ fontSize: '26px', fontVariationSettings: "'FILL' 1" }}>
        {isOpen ? 'close' : 'auto_awesome'}
      </span>
    </button>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AIAssistant() {
  const [isOpen,               setIsOpen]               = useState(false)
  const [isMaximized,          setIsMaximized]           = useState(false)
  // Tracks whether the user has sent at least one message (controls welcome state visibility)
  const [hasUserSentMessage,   setHasUserSentMessage]    = useState(false)

  // Messages live in the parent — preserved across minimize/open cycles
  const [messages, setMessages] = useState<Message[]>([])

  const handleMinimize        = () => setIsOpen(false)
  const handleClose           = () => { setIsOpen(false); setIsMaximized(false) }
  const handleToggleMaximize  = () => setIsMaximized(prev => !prev)
  const handleFloatButton     = () => setIsOpen(prev => !prev)

  return (
    <>
      {isOpen && (
        <ChatWindow
          messages={messages}
          setMessages={setMessages}
          hasUserSentMessage={hasUserSentMessage}
          setHasUserSentMessage={setHasUserSentMessage}
          isMaximized={isMaximized}
          onMinimize={handleMinimize}
          onToggleMaximize={handleToggleMaximize}
          onClose={handleClose}
        />
      )}
      <FloatingButton
        isOpen={isOpen}
        isHidden={isMaximized}
        onClick={handleFloatButton}
      />
    </>
  )
}
