import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Bot, Send, X, Sparkles, Loader2, AlertCircle } from 'lucide-react'
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

export default function ChatWidget() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<UIMessage[]>([])
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

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, mutation.isPending])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  if (!enabled) return null

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || mutation.isPending) return
    const history: ChatMessage[] = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.content }))
    const userMsg: UIMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detail = (err as any)?.response?.data?.detail
          const status = (err as { response?: { status?: number } })?.response?.status
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

  return (
    <>
      {/* Floating action button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-white shadow-lg transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)' }}
          aria-label="Open AI assistant"
        >
          <Sparkles size={18} />
          <span className="text-sm font-semibold">Ask AI</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-40 flex h-[600px] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          style={{ border: '1px solid #e5e7eb' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">AI Assistant</p>
                <p className="text-[11px] text-white/80 leading-tight">
                  Ask about your expenses & travel
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-white/15"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Not configured banner */}
          {health?.configured === false && (
            <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[12px] text-amber-800">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                AI is not configured on the server. Set <code className="font-mono">ANTHROPIC_API_KEY</code> in <code className="font-mono">backend/.env</code> to enable.
              </span>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: '#F8F9FF' }}>
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-xl bg-white p-3 text-[13px] text-gray-700 shadow-sm">
                  Hi {user?.full_name?.split(' ')[0] || 'there'}! I can answer questions about your travel & expense data. Try one of these:
                </div>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => send(p)}
                      className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-[12px] text-indigo-700 hover:bg-indigo-50"
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
              <div className="flex items-center gap-2 text-[12px] text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                <span>Thinking…</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Ask about your expenses…"
                className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-[13px] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                style={{ maxHeight: 120 }}
                disabled={mutation.isPending}
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={!input.trim() || mutation.isPending}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)' }}
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-gray-400">
              AI can make mistakes — verify critical numbers in the source data.
            </p>
          </div>
        </div>
      )}
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
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700"
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
              ? 'rounded-2xl rounded-tr-sm px-3 py-2 text-[13px] text-white'
              : message.error
                ? 'rounded-2xl rounded-tl-sm border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700'
                : 'rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-[13px] text-gray-800 shadow-sm'
          }
          style={
            isUser
              ? { background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)' }
              : undefined
          }
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  )
}
