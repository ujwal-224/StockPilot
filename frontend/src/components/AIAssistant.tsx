import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import { sendChatMessage } from '../services/aiService'

const API_URL = import.meta.env.VITE_API_URL || ''

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
  isVoice?: boolean
}

// ─── Suggested Prompts ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: 'Inventory Summary', icon: 'inventory_2', prompt: 'Give me a complete summary of my current inventory.' },
  { label: 'Low Stock Items', icon: 'warning', prompt: 'Which items are currently low on stock or out of stock?' },
  { label: 'Restocking Suggestions', icon: 'shopping_cart', prompt: 'Which items should I restock soon? Give me purchase recommendations.' },
  { label: "Today's Updates", icon: 'update', prompt: 'What are the most important inventory updates I should know about today?' },
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
    if (line.startsWith('## ')) { elements.push(<p key={k} className="font-bold text-sm text-on-surface mt-2 mb-0.5">{parseInline(line.slice(3), k)}</p>); i++; continue }
    if (line.startsWith('# ')) { elements.push(<p key={k} className="font-bold text-base text-primary mt-2 mb-1">{parseInline(line.slice(2), k)}</p>); i++; continue }

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

// ─── Typing / Status Indicator ───────────────────────────────────────────────

interface TypingIndicatorProps {
  status: 'thinking' | 'transcribing' | 'listening'
}

function TypingIndicator({ status }: TypingIndicatorProps) {
  const getStatusLabel = () => {
    if (status === 'listening') return 'Listening'
    if (status === 'transcribing') return 'Transcribing'
    return 'Thinking'
  }

  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mb-1">
        <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
      </div>
      <div className="bg-ledger-surface border border-ledger-hairline rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm animate-pulse">
        <div className="flex items-center gap-2">
          <span className="text-xs text-outline font-semibold tracking-wide">{getStatusLabel()}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
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
            {msg.isVoice && (
              <div className="flex items-center gap-1 text-[11px] text-white/80 font-medium mb-1 border-b border-white/20 pb-0.5" title="Voice Message">
                <span className="material-symbols-outlined text-[13px]">mic</span>
                <span>Voice Message</span>
              </div>
            )}
            <p className="font-body-sm text-sm leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </p>
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
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [statusText, setStatusText] = useState<'thinking' | 'transcribing' | 'listening' | 'idle'>('idle')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // MediaRecorder states and refs
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Screen size detection for mobile responsiveness
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Smooth-scroll to newest message / typing indicator
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 60)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, statusText, scrollToBottom])

  // Re-focus input when switching maximize modes
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(t)
  }, [isMaximized])

  // Cleanup media recording when component unmounts
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = null
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  const addErrorMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, {
      id: `err-${Date.now()}`,
      role: 'ai',
      content: text,
      timestamp: new Date(),
    }])
    scrollToBottom()
  }, [setMessages, scrollToBottom])

  // Send audio payload to the backend and handle loading transitions
  const sendAudioMessage = useCallback(async (audioBlob: Blob, extension: string) => {
    setHasUserSentMessage(true)
    setIsLoading(true)
    setStatusText('transcribing')

    // Add temporary transcription state message (without emojis)
    const userMsgId = `user-${Date.now()}`
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: 'Transcribing voice message...',
      timestamp: new Date(),
      isVoice: true,
    }])
    scrollToBottom()

    // Simulate transition to 'Thinking...' after 2 seconds if request takes time
    const progressTimer = setTimeout(() => {
      setStatusText('thinking')
      setMessages(prev =>
        prev.map(m => m.id === userMsgId ? { ...m, content: 'Thinking...' } : m)
      )
      scrollToBottom()
    }, 2000)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, `voice_recording.${extension}`)

      const response = await axios.post<{ success: boolean; transcript: string; reply: string }>(
        `${API_URL}/api/ai/speech-to-text`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 25000, // 25s timeout limit
        }
      )

      clearTimeout(progressTimer)

      if (response.data.success) {
        // Replace temporary placeholder content with actual text transcript
        setMessages(prev =>
          prev.map(m => m.id === userMsgId ? { ...m, content: response.data.transcript } : m)
        )
        // Add AI assistant reply
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: response.data.reply,
          timestamp: new Date(),
        }])
        scrollToBottom()
      } else {
        throw new Error('API returned unsuccessful response code')
      }
    } catch (err: unknown) {
      clearTimeout(progressTimer)
      console.error('Failed to send voice message:', err)
      // Remove temporary placeholder bubble on failure
      setMessages(prev => prev.filter(m => m.id !== userMsgId))

      let errorMessage = 'Sorry, I couldn\'t process your request right now. Please try again.'
      
      if (axios.isAxiosError(err) && (err.code === 'ECONNABORTED' || err.message?.includes('timeout'))) {
        errorMessage = 'Connection timed out. Please check your internet connection and try again.'
      } else if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status
        if (status === 422) {
          errorMessage = 'No speech was detected. Please speak clearly and try again.'
        } else if (status === 502) {
          errorMessage = 'Speech-to-text transcription failed. Please speak clearly or try typing your message.'
        } else if (status === 403 || err.response.data?.message?.includes('permission')) {
          errorMessage = 'Microphone permission was denied. Please allow microphone access in your browser settings.'
        }
      }
      addErrorMessage(errorMessage)
    } finally {
      setIsLoading(false)
      setStatusText('idle')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [setMessages, setHasUserSentMessage, addErrorMessage, scrollToBottom])

  const startRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      addErrorMessage('Audio recording is not supported in this browser.')
      return
    }

    audioChunksRef.current = []
    setRecordingSeconds(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      let options = {}
      if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        options = { mimeType: 'audio/ogg;codecs=opus' }
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' }
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        options = { mimeType: 'audio/wav' }
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' }
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' }
      }

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Release mic resources instantly
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }
        setRecordingSeconds(0)
        setIsRecording(false)

        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        console.log("Recorded MIME:", mimeType);
        let extension = 'webm'
        if (mimeType.includes('wav')) extension = 'wav'
        else if (mimeType.includes('ogg')) extension = 'ogg'
        else if (mimeType.includes('mp3')) extension = 'mp3'
        else if (mimeType.includes('mpeg')) extension = 'mp3'
        else if (mimeType.includes('mp4')) extension = 'mp4'
        else if (mimeType.includes('m4a')) extension = 'm4a'

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        if (audioBlob.size > 0) {
          await sendAudioMessage(audioBlob, extension)
        } else {
          addErrorMessage('Recording was empty. Please try speaking again.')
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setStatusText('listening')
      scrollToBottom()

      // Start live counter
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1)
      }, 1000)
    } catch (err: unknown) {
      console.error('Failed to get mic stream:', err)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        addErrorMessage('Microphone permission was denied. Please allow microphone access in your settings.')
      } else {
        addErrorMessage('Could not access microphone. Please check your recording device connection.')
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    setRecordingSeconds(0)
    setIsRecording(false)
  }

  // Cancel recording and prevent API call completely
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Unlink the stop callback to discard chunks
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    setRecordingSeconds(0)
    setIsRecording(false)
    setStatusText('idle')
    console.log('[MediaRecorder] Recording cancelled and discarded.')
  }, [])

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

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
    setStatusText('thinking')

    try {
      const reply = await sendChatMessage(trimmed)
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: reply,
        timestamp: new Date(),
      }])
    } catch {
      addErrorMessage('Sorry, I could not reach the AI service right now. Please try again in a moment.')
    } finally {
      setIsLoading(false)
      setStatusText('idle')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isLoading, setMessages, setHasUserSentMessage, addErrorMessage])

  const handleSend = () => dispatchMessage(input)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleSuggestion = (prompt: string) => dispatchMessage(prompt)

  // ── Panel sizing ──────────────────────────────────────────────────────────
  const panelStyle = isMaximized
    ? {
        width: isMobile ? '100vw' : 'min(900px, 80vw)',
        height: isMobile ? '100dvh' : 'min(90vh, 860px)',
        borderRadius: isMobile ? '0px' : '16px',
      }
    : {
        width: isMobile ? 'calc(100vw - 1rem)' : 'min(380px, calc(100vw - 2rem))',
        height: isMobile ? 'calc(100dvh - 8rem)' : 'min(560px, calc(100dvh - 10rem))',
        borderRadius: '16px',
      }

  const showWelcome = !hasUserSentMessage

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

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
            : isMobile
            ? 'fixed bottom-16 left-2 right-2 z-50 pointer-events-none'
            : 'fixed bottom-24 right-4 sm:right-6 sm:bottom-6 z-50 pointer-events-none'
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
                  ? <span className="animate-pulse font-semibold">Thinking...</span>
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
                {isLoading && (
                  <TypingIndicator status={statusText === 'idle' ? 'thinking' : statusText} />
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Input row ── */}
          <div className="flex-shrink-0 px-3 py-3 bg-ledger-surface hairline-top">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isLoading}
                title={isRecording ? 'Stop recording' : 'Record voice'}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 flex-shrink-0 ${isRecording
                    ? 'bg-[#ba1a1a] text-white animate-pulse'
                    : 'bg-ledger-paper border border-ledger-hairline text-outline hover:text-primary hover:bg-ledger-surface'
                  }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: isRecording ? "'FILL' 1" : "'FILL' 0" }}>
                  {isRecording ? 'mic_off' : 'mic'}
                </span>
              </button>
              
              {isRecording ? (
                /* Live recording block containing duration timer and Cancel button */
                <div className="flex-grow h-10 px-3 flex items-center justify-between bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    <span>Recording {formatTimer(recordingSeconds)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="text-xs font-bold text-red-500 hover:text-red-700 underline active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* Standard input block */
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
              )}

              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || isRecording}
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
  const [isOpen, setIsOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  const handleMinimize = () => setIsOpen(false)
  const handleClose = () => { setIsOpen(false); setIsMaximized(false) }
  const handleToggleMaximize = () => setIsMaximized(prev => !prev)
  const handleFloatButton = () => setIsOpen(prev => !prev)

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
