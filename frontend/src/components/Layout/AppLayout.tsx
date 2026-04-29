import { Outlet, useNavigate } from 'react-router-dom'
import { Search, Bell, HelpCircle, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import Sidebar from './Sidebar'
import { useAuthStore, MOCK_USERS } from '../../store/auth'
import { login } from '../../api/auth'

const ROLE_OPTIONS = [
  { key: 'manager', label: 'Manager', email: 'manager@company.com' },
  { key: 'employee', label: 'Employee', email: 'employee@company.com' },
  { key: 'finance', label: 'Finance', email: 'finance@company.com' },
]

function Header() {
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const navigate = useNavigate()

  const firstName = user?.full_name?.split(' ')[0] ?? 'User'
  const roleLabel = user?.role === 'finance' ? 'Finance Manager' : user?.role === 'manager' ? 'Manager' : 'Employee'
  const initials = user?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'

  const switchRole = async (key: string) => {
    setOpen(false)
    setSwitching(true)
    const option = ROLE_OPTIONS.find((r) => r.key === key)!
    try {
      const res = await login(option.email, 'password')
      setAuth(res.user, res.access_token)
    } catch {
      setAuth(MOCK_USERS[key], 'demo')
    }
    setSwitching(false)
    navigate('/team')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-10 flex-shrink-0">
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search claims, team members..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
          <Bell size={18} />
        </button>
        <button className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
          <HelpCircle size={18} />
        </button>
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Role switcher */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            disabled={switching}
            className="flex items-center gap-2.5 hover:bg-gray-50 rounded-md px-2 py-1 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{firstName}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-tight">{roleLabel}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white">
              {switching ? '…' : initials}
            </div>
            <ChevronDown size={13} className="text-gray-400" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px] py-1">
                <p className="px-3 py-1.5 text-xs text-gray-400 uppercase tracking-wider font-semibold">Switch Role</p>
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => switchRole(opt.key)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${user?.role === opt.key ? 'font-semibold text-black' : 'text-gray-700'}`}
                  >
                    {opt.label}
                    {user?.role === opt.key && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
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
  return (
    <div className="flex min-h-screen bg-gray-50">
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
