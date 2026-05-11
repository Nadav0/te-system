import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, CheckSquare, Users, BarChart3, Settings, FileDown, ListOrdered,
  Receipt, Plane, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { listExpenses } from '../../api/expenses'
import { listTravel } from '../../api/travel'
import type { User } from '../../types'

// Nav items per role
function navItems(role: User['role']) {
  if (role === 'employee') {
    return [
      { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
      { to: '/expenses',   icon: Receipt,          label: 'Expenses',  badge: 'expenses' },
      { to: '/travel',     icon: Plane,            label: 'Travel',    badge: 'travel'   },
      { to: '/settings',   icon: Settings,         label: 'Settings'  },
    ]
  }
  if (role === 'manager') {
    return [
      { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
      { to: '/approvals',  icon: CheckSquare,     label: 'Approvals', badge: 'approvals' },
      { to: '/expenses',   icon: Receipt,         label: 'Expenses'  },
      { to: '/travel',     icon: Plane,           label: 'Travel'    },
      { to: '/team',       icon: Users,           label: 'Team'      },
      { to: '/analytics',  icon: BarChart3,       label: 'Analytics' },
      { to: '/settings',   icon: Settings,        label: 'Settings'  },
    ]
  }
  // finance
  return [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
    { to: '/policy',       icon: CheckSquare,     label: 'Policies'     },
    { to: '/expenses',     icon: Receipt,         label: 'Expenses',    badge: 'approvals' },
    { to: '/travel',       icon: Plane,           label: 'Travel'       },
    { to: '/coding-queue', icon: ListOrdered,     label: 'Coding Queue' },
    { to: '/analytics',    icon: BarChart3,       label: 'Analytics'    },
    { to: '/reports',      icon: FileDown,        label: 'Export'       },
    { to: '/settings',     icon: Settings,        label: 'Settings'     },
  ]
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)

  // Persist collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('te_sidebar') === 'collapsed'
  })

  useEffect(() => {
    localStorage.setItem('te_sidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  // Live badge data — pending approvals & travel
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => listExpenses(),
    refetchInterval: 60_000,
  })
  const { data: travels = [] } = useQuery({
    queryKey: ['travel'],
    queryFn: () => listTravel(),
    refetchInterval: 60_000,
  })

  const approvalsCount = (expenses as any[]).filter(
    (e) => e.status === 'submitted' || e.status === 'under_review'
  ).length
  const travelCount = (travels as any[]).filter((t) => t.status === 'submitted').length
  const expensesDraftCount = (expenses as any[]).filter((e) => e.status === 'draft').length

  function getBadgeCount(badge?: string): number {
    if (!badge) return 0
    if (badge === 'approvals') return approvalsCount
    if (badge === 'travel') return travelCount
    if (badge === 'expenses') return expensesDraftCount
    return 0
  }

  if (!user) return null

  const initials = user.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'
  const roleLabel = user.role === 'finance' ? 'Finance' : user.role === 'manager' ? 'Manager' : 'Employee'
  const items = navItems(user.role)

  return (
    <aside
      className={`${
        collapsed ? 'w-[60px]' : 'w-[220px]'
      } min-h-screen flex flex-col flex-shrink-0 border-r border-sidebar-border bg-sidebar-bg transition-all duration-200`}
    >
      {/* Logo */}
      <div className={`px-3 pt-5 pb-4 border-b border-sidebar-border ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
            <span className="text-[11px] font-bold text-white tracking-tight">TX</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-[11px] font-bold text-white tracking-tight">TX</span>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-sidebar-text tracking-tight leading-none">Travelex</p>
              <p className="text-[9px] font-semibold text-sidebar-muted mt-0.5 uppercase tracking-[0.12em]">Expense Intelligence</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {items.map(({ to, icon: Icon, label, badge }) => {
          const count = getBadgeCount(badge)
          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                } ${
                  isActive
                    ? 'bg-sidebar-active text-sidebar-text'
                    : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-400 rounded-r-full" />
                  )}
                  <div className="relative flex-shrink-0">
                    <Icon size={15} className={isActive ? 'text-brand-400' : 'text-sidebar-muted'} />
                    {count > 0 && collapsed && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-brand-600 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                  </div>
                  {!collapsed && <span className="flex-1 truncate">{label}</span>}
                  {!collapsed && count > 0 && (
                    <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User + Collapse toggle */}
      <div className={`px-2 pb-4 pt-2 border-t border-sidebar-border space-y-2`}>
        {/* User row */}
        {collapsed ? (
          <div className="flex justify-center">
            <div
              title={user.full_name ?? ''}
              className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-semibold text-white"
            >
              {initials}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-sidebar-text truncate leading-tight">
                {user.full_name?.split(' ')[0]}
              </p>
              <p className="text-[11px] text-sidebar-muted truncate">{roleLabel}</p>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-full flex items-center rounded-lg px-2 py-2 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text transition-colors ${
            collapsed ? 'justify-center' : 'gap-2.5'
          }`}
        >
          {collapsed
            ? <PanelLeftOpen size={15} />
            : (
              <>
                <PanelLeftClose size={15} />
                <span className="text-[12px] font-medium">Collapse</span>
              </>
            )
          }
        </button>
      </div>
    </aside>
  )
}
