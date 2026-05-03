import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, Users, BarChart3, Settings, FileDown,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import type { User } from '../../types'

function navItems(role: User['role']) {
  return [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: role === 'finance' ? '/policy' : '/approvals', icon: CheckSquare, label: 'Approvals' },
    { to: '/team', icon: Users, label: 'Team' },
    { to: '/analytics', icon: BarChart3, label: 'Reports' },
    { to: '/reports', icon: FileDown, label: 'Export' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  const initials = user.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'
  const role = user.role === 'finance' ? 'Finance Manager' : user.role === 'manager' ? 'Manager' : 'Employee'

  return (
    <aside className="w-[220px] min-h-screen flex flex-col flex-shrink-0" style={{ background: '#1E1B4B' }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #2d2a6e' }}>
        <p className="text-xl font-black text-white tracking-tight">Travelex</p>
        <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: '#818cf8' }}>
          Enterprise T&amp;E
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems(user.role).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-[#c7d2fe] hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-brand-600' : 'text-[#818cf8]'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 mx-3 mb-3 rounded-xl" style={{ background: '#16133a' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.full_name?.split(' ')[0]}</p>
            <p className="text-[10px] truncate" style={{ color: '#818cf8' }}>{role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
