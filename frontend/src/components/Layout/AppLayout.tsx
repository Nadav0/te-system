import { Outlet, useNavigate, Navigate } from 'react-router-dom'
import { Bell, HelpCircle, ChevronDown, Search, FileText, Plane, User, CheckCheck, Sun, Moon, X, Keyboard, Sparkles } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Sidebar from './Sidebar'
import ChatWidget from '../ChatWidget/ChatWidget'
import { useAuthStore, MOCK_USERS } from '../../store/auth'
import { login } from '../../api/auth'
import { useThemeStore } from '../../store/theme'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listNotifications, markAllRead, markRead } from '../../api/notifications'
import { search as searchApi } from '../../api/search'
import type { Notification } from '../../types'

const ROLE_OPTIONS = [
 { key: 'manager', label: 'Manager', email: 'manager@company.com' },
 { key: 'employee', label: 'Employee', email: 'employee@company.com' },
 { key: 'finance', label: 'Finance', email: 'finance@company.com' },
]

function timeAgo(iso: string): string {
 const diff = Date.now() - new Date(iso).getTime()
 const mins = Math.floor(diff / 60000)
 if (mins < 1) return 'Just now'
 if (mins < 60) return `${mins}m ago`
 const hrs = Math.floor(mins / 60)
 if (hrs < 24) return `${hrs}h ago`
 return `${Math.floor(hrs / 24)}d ago`
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
 const qc = useQueryClient()
 const navigate = useNavigate()
 const token = useAuthStore((s) => s.token)
 const { data: notifications = [] } = useQuery<Notification[]>({
 queryKey: ['notifications'],
 queryFn: listNotifications,
 refetchInterval: 30000,
 enabled: !!token && token !== 'demo',
 })

 const markAllMutation = useMutation({
 mutationFn: markAllRead,
 onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
 })

 const markOneMutation = useMutation({
 mutationFn: (id: string) => markRead(id),
 onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
 })

 const unread = (notifications as Notification[]).filter((n) => !n.read).length

 const handleClick = (n: Notification) => {
 if (!n.read) markOneMutation.mutate(n.id)
 if (n.ref_type === 'expense' && n.ref_id) navigate(`/expenses/${n.ref_id}`)
 else if (n.ref_type === 'travel' && n.ref_id) navigate(`/travel/${n.ref_id}`)
 onClose()
 }

 const typeIcon = (type: string) => {
 if (type.startsWith('expense')) return <FileText size={14} className="text-ink-3" />
 if (type.startsWith('travel')) return <Plane size={14} className="text-ink-3" />
 return <Bell size={14} className="text-ink-3" />
 }

 return (
 <div className="absolute right-0 top-full mt-1 bg-surface-2 border border-edge-hi rounded-xl z-20 w-80">
 <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
 <p className="text-sm font-semibold text-ink">
 Notifications{unread > 0 && (
 <span className="ml-2 bg-brand-600 text-white text-xs rounded-full px-1.5 py-0.5 font-variant-numeric-tabular">{unread}</span>
 )}
 </p>
 {unread > 0 && (
 <button
 onClick={() => markAllMutation.mutate()}
 className="flex items-center gap-1 text-xs text-ink-3 hover:text-ink transition-colors"
 >
 <CheckCheck size={12} /> Mark all read
 </button>
 )}
 </div>
 <div className="max-h-80 overflow-y-auto">
 {(notifications as Notification[]).length === 0 ? (
 <div className="px-4 py-8 text-center text-sm text-ink-3">No notifications yet</div>
 ) : (
 (notifications as Notification[]).map((n) => (
 <button
 key={n.id}
 onClick={() => handleClick(n)}
 className={`w-full text-left px-4 py-3 border-b border-edge hover:bg-surface-hover transition-colors flex gap-3 ${!n.read ? 'bg-surface-hover' : ''}`}
 >
 <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <p className={`text-xs leading-tight text-ink ${!n.read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
 {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-600 flex-shrink-0 mt-1" />}
 </div>
 <p className="text-xs text-ink-3 mt-0.5 line-clamp-2">{n.message}</p>
 <p className="text-[11px] text-ink-3/60 mt-1">{timeAgo(n.created_at)}</p>
 </div>
 </button>
 ))
 )}
 </div>
 </div>
 )
}

function Highlight({ text, query }: { text: string; query: string }) {
 if (!query.trim()) return <>{text}</>
 const idx = text.toLowerCase().indexOf(query.toLowerCase())
 if (idx === -1) return <>{text}</>
 return (
  <>
   {text.slice(0, idx)}
   <mark className="bg-brand-600/20 text-brand-600 not-italic rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
   {text.slice(idx + query.length)}
  </>
 )
}

function SearchBar() {
 const navigate = useNavigate()
 const [query, setQuery] = useState('')
 const [open, setOpen] = useState(false)
 const [results, setResults] = useState<any[]>([])
 const [loading, setLoading] = useState(false)
 const ref = useRef<HTMLDivElement>(null)
 const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

 useEffect(() => {
 const handler = (e: MouseEvent) => {
 if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
 }
 document.addEventListener('mousedown', handler)
 return () => document.removeEventListener('mousedown', handler)
 }, [])

 const handleChange = (val: string) => {
 setQuery(val)
 if (timerRef.current) clearTimeout(timerRef.current)
 if (val.trim().length < 2) { setResults([]); setOpen(false); return }
 timerRef.current = setTimeout(async () => {
 setLoading(true)
 try {
 const data = await searchApi(val.trim())
 setResults(data)
 setOpen(true)
 } catch {
 setResults([])
 } finally {
 setLoading(false)
 }
 }, 300)
 }

 const handleSelect = (item: any) => {
 if (item.url) navigate(item.url)
 setOpen(false)
 setQuery('')
 }

 const typeIcon = (type: string) => {
 if (type === 'expense') return <FileText size={13} className="text-ink-3" />
 if (type === 'travel') return <Plane size={13} className="text-ink-3" />
 return <User size={13} className="text-ink-3" />
 }

 return (
 <div ref={ref} className="relative flex-1 max-w-sm">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
 <input
 type="text"
 placeholder="Search or type ⌘K"
 value={query}
 onChange={(e) => handleChange(e.target.value)}
 onFocus={() => results.length > 0 && setOpen(true)}
 className="w-full pl-9 pr-4 py-2 text-sm bg-surface-0 border border-edge rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand-600/60 focus:ring-2 focus:ring-brand-600/10 transition-all"
 />
 {open && (
 <div className="absolute left-0 top-full mt-1 bg-surface-2 border border-edge-hi rounded-xl z-30 w-80">
 {loading ? (
 <div className="px-4 py-3 text-sm text-ink-3">Searching…</div>
 ) : results.length === 0 ? (
 <div className="px-4 py-3 text-sm text-ink-3">No results for "{query}"</div>
 ) : (
 results.map((r) => (
 <button
 key={r.id}
 onClick={() => handleSelect(r)}
 className="w-full text-left px-4 py-2.5 hover:bg-surface-hover flex items-center gap-3 border-b border-edge last:border-0 transition-colors"
 >
 <div className="flex-shrink-0">{typeIcon(r.type)}</div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-ink truncate"><Highlight text={r.title} query={query} /></p>
 <p className="text-xs text-ink-3 truncate"><Highlight text={r.sub ?? ''} query={query} /></p>
 </div>
 <span className="text-[10px] text-ink-3/60 uppercase tracking-wider flex-shrink-0">{r.type}</span>
 </button>
 ))
 )}
 </div>
 )}
 </div>
 )
}

function HelpModal({ onClose }: { onClose: () => void }) {
 const shortcuts = [
  { keys: ['G', 'D'], label: 'Go to Dashboard' },
  { keys: ['G', 'E'], label: 'Go to Expenses' },
  { keys: ['G', 'T'], label: 'Go to Travel' },
  { keys: ['G', 'A'], label: 'Go to Approvals' },
  { keys: ['N', 'E'], label: 'New Expense Report' },
  { keys: ['N', 'T'], label: 'New Travel Request' },
  { keys: ['/'], label: 'Focus search bar' },
  { keys: ['Esc'], label: 'Close panel / modal' },
 ]
 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
   <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />
   <div className="relative bg-surface-1 border border-edge-hi rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
     <div className="flex items-center gap-2">
      <Keyboard size={16} className="text-brand-600" />
      <h2 className="text-base font-bold text-ink">Help & Keyboard Shortcuts</h2>
     </div>
     <button onClick={onClose} className="text-ink-3 hover:text-ink p-1 rounded-lg hover:bg-surface-hover transition-colors">
      <X size={16} />
     </button>
    </div>
    <div className="p-6">
     <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-4">Navigation shortcuts</p>
     <div className="space-y-2">
      {shortcuts.map(({ keys, label }) => (
       <div key={label} className="flex items-center justify-between py-1.5">
        <span className="text-sm text-ink-2">{label}</span>
        <div className="flex items-center gap-1">
         {keys.map((k, i) => (
          <span key={i} className="px-2 py-0.5 bg-surface-0 border border-edge rounded text-xs font-mono font-semibold text-ink-2">{k}</span>
         ))}
        </div>
       </div>
      ))}
     </div>
     <div className="mt-6 pt-4 border-t border-edge">
      <p className="text-xs text-ink-3">
       Need more help? Contact your system administrator or visit the internal knowledge base.
      </p>
     </div>
    </div>
   </div>
  </div>
 )
}

function Header() {
 const user = useAuthStore((s) => s.user)
 const token = useAuthStore((s) => s.token)
 const setAuth = useAuthStore((s) => s.setAuth)
 const [roleOpen, setRoleOpen] = useState(false)
 const [notifOpen, setNotifOpen] = useState(false)
 const [helpOpen, setHelpOpen] = useState(false)
 const [chatOpen, setChatOpen] = useState(false)
 const [switching, setSwitching] = useState(false)
 const navigate = useNavigate()
 const qc = useQueryClient()

 const { data: notifications = [] } = useQuery<Notification[]>({
 queryKey: ['notifications'],
 queryFn: listNotifications,
 refetchInterval: 30000,
 enabled: !!token && token !== 'demo',
 })
 const unreadCount = (notifications as Notification[]).filter((n) => !n.read).length

 const initials = user?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'
 const { dark, toggle: toggleTheme } = useThemeStore()

 const switchRole = async (key: string) => {
 setRoleOpen(false)
 setSwitching(true)
 const option = ROLE_OPTIONS.find((r) => r.key === key)!
 try {
 const res = await login(option.email, 'password')
 setAuth(res.user, res.access_token)
 } catch {
 setAuth(MOCK_USERS[key], 'demo')
 }
 setSwitching(false)
 qc.clear()
 navigate('/dashboard')
 }

 return (
 <header className="h-14 glass border-b border-edge/60 flex items-center px-6 gap-4 sticky top-0 z-10 flex-shrink-0">
 <SearchBar />

 <div className="flex items-center gap-1 ml-auto">
 {/* AI Chat */}
 <button
  onClick={() => { setChatOpen(!chatOpen); setNotifOpen(false); setRoleOpen(false) }}
  title="AI Assistant"
  className={`p-2 rounded-lg transition-colors ${chatOpen ? 'bg-brand-600/10 text-brand-600' : 'text-ink-3 hover:text-ink hover:bg-surface-hover'}`}
 >
  <Sparkles size={17} />
 </button>
 <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />

 {/* Notifications */}
 <div className="relative">
 <button
 onClick={() => { setNotifOpen(!notifOpen); setRoleOpen(false) }}
 className="relative p-2 text-ink-3 hover:text-ink rounded-lg hover:bg-surface-hover transition-colors"
 >
 <Bell size={18} />
 {unreadCount > 0 && (
 <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-600 rounded-full" />
 )}
 </button>
 {notifOpen && (
 <>
 <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
 <div className="relative z-20">
 <NotificationPanel onClose={() => setNotifOpen(false)} />
 </div>
 </>
 )}
 </div>

 {/* Theme toggle */}
 <button
 onClick={toggleTheme}
 title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
 className="p-2 text-ink-3 hover:text-ink rounded-lg hover:bg-surface-hover transition-colors"
 >
 {dark ? <Sun size={18} /> : <Moon size={18} />}
 </button>

 <button
  onClick={() => { setHelpOpen(true); setNotifOpen(false); setRoleOpen(false) }}
  title="Help & shortcuts"
  className="p-2 text-ink-3 hover:text-ink rounded-lg hover:bg-surface-hover transition-colors"
 >
  <HelpCircle size={18} />
 </button>
 {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

 {/* Role switcher */}
 <div className="relative ml-1">
 <button
 onClick={() => { setRoleOpen(!roleOpen); setNotifOpen(false) }}
 disabled={switching}
 className="flex items-center gap-2 px-2.5 py-1.5 border border-edge rounded-lg hover:bg-surface-hover transition-colors"
 >
 <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">
 {switching ? '…' : initials}
 </div>
 <span className="text-sm font-medium text-ink">{user?.full_name?.split(' ')[0] ?? 'User'}</span>
 <ChevronDown size={12} className="text-ink-3" />
 </button>

 {roleOpen && (
 <>
 <div className="fixed inset-0 z-10" onClick={() => setRoleOpen(false)} />
 <div className="absolute right-0 top-full mt-1 bg-surface-2 border border-edge-hi rounded-xl z-20 min-w-[180px] py-1">
 <p className="px-3 py-1.5 text-xs text-ink-3 uppercase tracking-wider font-semibold">Switch Role</p>
 {ROLE_OPTIONS.map((opt) => (
 <button
 key={opt.key}
 onClick={() => switchRole(opt.key)}
 className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors flex items-center justify-between ${
 user?.role === opt.key ? 'text-brand-400 font-semibold' : 'text-ink-2'
 }`}
 >
 {opt.label}
 {user?.role === opt.key && <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
 </button>
 ))}
 </div>
 </>
 )}
 </div>
 </div>
 </header>
 )
}

export default function AppLayout() {
 const user = useAuthStore((s) => s.user)

 if (!user) return <Navigate to="/login" replace />

 return (
 <div className="flex min-h-screen bg-surface-0">
 <Sidebar />
 <div className="flex-1 flex flex-col min-w-0">
 <Header />
 <main className="flex-1 overflow-auto">
 <Outlet />
 </main>
 </div>
 </div>
 )
}
