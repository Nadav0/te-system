import { Outlet, useNavigate } from 'react-router-dom'
import { Bell, HelpCircle, ChevronDown, Search, FileText, Plane, User, CheckCheck } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useAuthStore, MOCK_USERS } from '../../store/auth'
import { login } from '../../api/auth'
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
    if (type.startsWith('expense')) return <FileText size={14} className="text-gray-500" />
    if (type.startsWith('travel')) return <Plane size={14} className="text-gray-500" />
    return <Bell size={14} className="text-gray-500" />
  }

  return (
    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 w-80">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-900">
          Notifications {unread > 0 && <span className="ml-1 bg-black text-white text-xs rounded-full px-1.5 py-0.5">{unread}</span>}
        </p>
        {unread > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
          >
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {(notifications as Notification[]).length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</div>
        ) : (
          (notifications as Notification[]).map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${!n.read ? 'bg-gray-50' : ''}`}
            >
              <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-semibold text-gray-900 leading-tight ${!n.read ? 'font-bold' : ''}`}>{n.title}</p>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
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
    if (type === 'expense') return <FileText size={13} className="text-gray-400" />
    if (type === 'travel') return <Plane size={13} className="text-gray-400" />
    return <User size={13} className="text-gray-400" />
  }

  return (
    <div ref={ref} className="relative flex-1 max-w-sm">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Search reports, trips, or employees…"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-full focus:outline-none focus:border-brand-300 focus:bg-white placeholder:text-gray-400 transition-colors"
      />
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 w-80">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-400">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">No results for "{query}"</div>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex-shrink-0">{typeIcon(r.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                  <p className="text-xs text-gray-400 truncate">{r.sub}</p>
                </div>
                <span className="text-[10px] text-gray-300 uppercase tracking-wider flex-shrink-0">{r.type}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function Header() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const setAuth = useAuthStore((s) => s.setAuth)
  const [roleOpen, setRoleOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
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

  const firstName = user?.full_name?.split(' ')[0] ?? 'User'
  const roleLabel = user?.role === 'finance' ? 'Finance Manager' : user?.role === 'manager' ? 'Manager' : 'Employee'
  const initials = user?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'

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
    navigate('/team')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-10 flex-shrink-0 shadow-sm">
      <SearchBar />

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setRoleOpen(false) }}
            className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
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

        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <HelpCircle size={18} />
        </button>

        {/* Role switcher */}
        <div className="relative">
          <button
            onClick={() => { setRoleOpen(!roleOpen); setNotifOpen(false) }}
            disabled={switching}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-800">Travel &amp; Expense</span>
            <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white">
              {switching ? '…' : initials}
            </div>
            <ChevronDown size={12} className="text-gray-400" />
          </button>

          {roleOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setRoleOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[180px] py-1">
                <p className="px-3 py-1.5 text-xs text-gray-400 uppercase tracking-wider font-semibold">Switch Role</p>
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => switchRole(opt.key)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${user?.role === opt.key ? 'font-semibold text-brand-600' : 'text-gray-700'}`}
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
  const token = useAuthStore((s) => s.token)
  const setAuth = useAuthStore((s) => s.setAuth)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (token && token !== 'demo') { setReady(true); return }
    // No real token — auto-login as manager
    login('manager@company.com', 'password')
      .then((res) => setAuth(res.user, res.access_token))
      .catch(() => setAuth(MOCK_USERS.manager, 'demo'))
      .finally(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <div className="flex min-h-screen" style={{ background: '#F5F7FF' }}>
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
