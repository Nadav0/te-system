import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Users, BarChart3, Settings, Building2 } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import type { User } from '../../types'

function navItems(role: User['role']) {
  return [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: role === 'finance' ? '/policy' : '/approvals', icon: CheckSquare, label: 'Approvals' },
    { to: '/team', icon: Users, label: 'Team' },
    { to: '/analytics', icon: BarChart3, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="px-5 py-5 border-b border-gray-200">
        <span className="text-sm font-black tracking-widest text-gray-900 uppercase">T&amp;E Platform</span>
        <p className="text-xs text-gray-400 mt-0.5">Manager Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems(user.role).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
            <Building2 size={15} className="text-gray-500" />
          </div>
          <span className="text-sm text-gray-500">Org Logo</span>
        </div>
      </div>
    </aside>
  )
}
