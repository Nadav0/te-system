import { Outlet } from 'react-router-dom'
import { Search, Bell, HelpCircle } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuthStore } from '../../store/auth'

function Header() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.full_name?.split(' ')[0] ?? 'User'
  const roleLabel = user?.role === 'finance' ? 'Finance Manager' : user?.role === 'manager' ? 'Manager' : 'Employee'
  const initials = user?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'

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
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{firstName}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-tight">{roleLabel}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
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
