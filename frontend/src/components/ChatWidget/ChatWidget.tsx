import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Bot, Send, Sparkles, Loader2, AlertCircle, X } from 'lucide-react'
import { sendChatMessage, chatHealth, type ChatMessage } from '../../api/chat'
import { useAuthStore } from '../../store/auth'

const STARTER_PROMPTS = [
 'What did I spend last month?',
 'Any pending expense reports?',
 'Show my upcoming travel',
 'Where are policy violations happening?',
]

interface UIMessage extends ChatMessage {
 id: string
 toolCalls?: { name: string }[]
 error?: boolean
}

interface Props {
 open: boolean
 onClose: () => void
}

export default function ChatWidget({ open, onClose }: Props) {
 const token = useAuthStore((s) => s.token)
 const user = useAuthStore((s) => s.user)
 const [input, setInput] = useState('')
 const [messages, setMessages] = useState<UIMessage[]>([])
 const [visible, setVisible] = useState(false)
 const scrollRef = useRef<HTMLDivElement | null>(null)
 const inputRef = useRef<HTMLTextAreaElement | null>(null)

 const enabled = !!token && token !== 'demo' && !!user
 const { data: health } = useQuery({
  queryKey: ['chat-health'],
  queryFn: chatHealth,
  enabled,
  retry: false,
  staleTime: 5 * 60_000,
 })

 const mutation = useMutation({
  mutationFn: ({ message, history }: { message: string; history: ChatMessage[] }) =>
   sendChatMessage(message, history),
 })

 // Drive the CSS transition: mount first, then set visible for enter animation
 useEffect(() => {
  if (open) {
   setVisible(true)
   setTimeout(() => inputRef.current?.focus(), 120)
  } else {
   setVisible(false)
  }
 }, [open])

 // Auto-scroll on new messages
 useEffect(() => {
  if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
 }, [messages, mutation.isPending])

 if (!enabled) return null

 const send = (text: string) => {
  const trimmed = text.trim()
  if (!trimmed || mutation.isPending) return
  const history: ChatMessage[] = messages
   .filter((m) => !m.error)
   .map((m) => ({ role: m.role, content: m.content }))
  const userMsg: UIMessage = { id: `u-${Date.now()}`, role: 'user', content: trimmed }
  setMessages((prev) => [...prev, userMsg])
  setInput('')
  mutation.mutate(
   { message: trimmed, history },
   {
    onSuccess: (resp) => {
     setMessages((prev) => [
      ...prev,
      {
       id: `a-${Date.now()}`,
       role: 'assistant',
       content: resp.reply,
       toolCalls: resp.tool_calls?.map((t) => ({ name: t.name })) ?? [],
      },
     ])
    },
    onError: (err) => {
     const detail = (err as any)?.response?.data?.detail
     const status = (err as any)?.response?.status
     let msg = detail || 'Something went wrong. Please try again.'
     if (status === 503) msg = String(detail || 'AI assistant is not configured on this server.')
     setMessages((prev) => [
      ...prev,
      { id: `e-${Date.now()}`, role: 'assistant', content: msg, error: true },
     ])
    },
   },
  )
 }

 const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
   e.preventDefault()
   send(input)
  }
 }

 if (!open && !visible) return null

 return (
  <>
   {/* Backdrop */}
   <div
    className="fixed inset-0 z-30"
    onClick={onClose}
   />

   {/* Panel — slides down from header */}
   <div
    className="fixed top-14 right-4 z-40 flex flex-col w-[380px] max-w-[calc(100vw-2rem)]"
    style={{
     height: 540,
     borderRadius: 16,
     overflow: 'hidden',
     boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)',
     border: '1px solid rgba(79,70,229,0.18)',
     transform: visible ? 'translateY(0) scale(1)' : 'translateY(-16px) scale(0.97)',
     opacity: visible ? 1 : 0,
     transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease',
    }}
   >
    {/* Header */}
    <div
     className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0"
     style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
    >
     <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
       <Bot size={16} />
      </div>
      <div>
       <p className="text-[13px] font-semibold leading-tight">AI Assistant</p>
       <p className="text-[11px] text-white/70 leading-tight">Ask about expenses &amp; travel</p>
      </div>
     </div>
     <button
      type="button"
      onClick={onClose}
      className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
      aria-label="Close"
     >
      <X size={15} />
     </button>
    </div>

    {/* Not configured banner */}
    {health?.configured === false && (
     <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[12px] text-amber-800 flex-shrink-0">
      <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
      <span>
       AI is not configured. Set <code className="font-mono">ANTHROPIC_API_KEY</code> in <code className="font-mono">backend/.env</code> to enable.
      </span>
     </div>
    )}

    {/* Messages */}
    <div
     ref={scrollRef}
     className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface-0"
    >
     {messages.length === 0 && (
      <div className="space-y-3">
       <div className="rounded-xl bg-surface-1 border border-edge px-3 py-2.5 text-[13px] text-ink-2">
        Hi {user?.full_name?.split(' ')[0] || 'there'}! Ask me anything about your travel &amp; expense data.
       </div>
       <div className="flex flex-wrap gap-2">
        {STARTER_PROMPTS.map((p) => (
         <button
          key={p}
          type="button"
          onClick={() => send(p)}
          className="rounded-full border border-brand-600/20 bg-surface-1 px-3 py-1.5 text-[12px] text-brand-600 hover:bg-brand-600/5 transition-colors"
         >
          {p}
         </button>
        ))}
       </div>
      </div>
     )}

     {messages.map((m) => (
      <MessageBubble key={m.id} message={m} />
     ))}

     {mutation.isPending && (
      <div className="flex items-center gap-2 text-[12px] text-ink-3">
       <Loader2 size={13} className="animate-spin" />
       <span>Thinking…</span>
      </div>
     )}
    </div>

    {/* Input */}
    <div className="border-t border-edge bg-surface-1 p-3 flex-shrink-0">
     <div className="flex items-end gap-2">
      <textarea
       ref={inputRef}
       value={input}
       onChange={(e) => setInput(e.target.value)}
       onKeyDown={handleKey}
       rows={1}
       placeholder="Ask about your expenses…"
       className="flex-1 resize-none rounded-lg border border-edge px-3 py-2 text-[13px] text-ink bg-surface-0
                  focus:border-brand-600/60 focus:outline-none focus:ring-2 focus:ring-brand-600/15 transition-all"
       style={{ maxHeight: 100 }}
       disabled={mutation.isPending}
      />
      <button
       type="button"
       onClick={() => send(input)}
       disabled={!input.trim() || mutation.isPending}
       className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-40 flex-shrink-0"
       style={{ background: 'linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)' }}
       aria-label="Send"
      >
       <Send size={15} />
      </button>
     </div>
     <p className="mt-1.5 text-[10px] text-ink-3">
      AI can make mistakes — verify critical numbers in the source data.
     </p>
    </div>
   </div>
  </>
 )
}

function MessageBubble({ message }: { message: UIMessage }) {
 const isUser = message.role === 'user'
 return (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
   <div className="max-w-[85%]">
    {message.toolCalls && message.toolCalls.length > 0 && (
     <div className="mb-1 flex flex-wrap gap-1">
      {message.toolCalls.map((t, i) => (
       <span
        key={i}
        className="inline-flex items-center gap-1 rounded-full bg-brand-600/8 px-2 py-0.5 text-[10px] font-medium text-brand-600"
       >
        <Sparkles size={9} />
        {t.name}
       </span>
      ))}
     </div>
    )}
    <div
     className={
      isUser
       ? 'rounded-xl rounded-tr-sm px-3 py-2 text-[13px] text-white'
       : message.error
        ? 'rounded-xl rounded-tl-sm border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700'
        : 'rounded-xl rounded-tl-sm border border-edge bg-surface-1 px-3 py-2 text-[13px] text-ink'
     }
     style={isUser ? { background: 'linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)' } : undefined}
    >
     <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
    </div>
   </div>
  </div>
 )
}
