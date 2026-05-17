import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium toast-enter ${
              t.type === 'success'
                ? 'bg-surface-1 border-emerald-500/30 text-ink'
                : t.type === 'error'
                ? 'bg-surface-1 border-red-500/30 text-ink'
                : 'bg-surface-1 border-brand-600/30 text-ink'
            }`}
          >
            {t.type === 'success' && <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />}
            {t.type === 'error'   && <XCircle size={15}    className="text-red-500 flex-shrink-0" />}
            {t.type === 'info'    && <Info size={15}        className="text-brand-600 flex-shrink-0" />}
            <span className="max-w-[260px] leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 text-ink-3 hover:text-ink transition-colors flex-shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}
