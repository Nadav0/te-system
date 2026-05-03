import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Receipt, Plane, AlertTriangle, Clock, Plus,
  TrendingUp, CheckCircle, ShieldAlert, Utensils, Monitor, Hotel,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { listExpenses } from '../../api/expenses'
import { listTravel } from '../../api/travel'
import { getSummary } from '../../api/analytics'
import { currency, date } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  meals: Utensils,
  transport: Plane,
  lodging: Hotel,
  conference: Receipt,
  other: Monitor,
}

function getCategoryIcon(category?: string) {
  const Icon = CATEGORY_ICONS[category ?? ''] ?? Receipt
  return Icon
}

function StatCard({
  label, value, sub, tag, gradient, icon: Icon,
}: {
  label: string
  value: string | number
  sub: string
  tag: string
  gradient: string
  icon: React.ElementType
}) {
  return (
    <div className="rounded-2xl p-5 text-white relative overflow-hidden flex flex-col justify-between min-h-[160px]" style={{ background: gradient }}>
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-white/20">
          <Icon size={18} className="text-white" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">{tag}</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">{label}</p>
        <p className="text-4xl font-black leading-none">{value}</p>
        <p className="text-xs text-white/70 mt-2 flex items-center gap-1">
          <TrendingUp size={11} />{sub}
        </p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)!

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => listExpenses(),
  })
  const { data: travels = [], isLoading: travLoading } = useQuery({
    queryKey: ['travel'],
    queryFn: () => listTravel(),
  })
  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: getSummary,
  })

  if (expLoading || travLoading) return <Spinner className="h-96" />

  const pendingApprovals = (expenses as any[]).filter((e) => e.status === 'submitted' || e.status === 'under_review')
  const myDraftExpenses = (expenses as any[]).filter((e) => e.status === 'draft')
  const myExpenses = user.role === 'employee' ? myDraftExpenses : pendingApprovals
  const myTravels = user.role === 'employee'
    ? (travels as any[]).filter((t) => t.employee_id === user.id)
    : (travels as any[]).filter((t) => t.status === 'submitted')

  const totalSpend = (summary as any)?.total_spend ?? 0
  const reportCount = (summary as any)?.report_count ?? 0
  const violationCount = (summary as any)?.violation_count ?? 0
  const categorySpend: Record<string, number> = (summary as any)?.by_category ?? {}
  const maxCat = Math.max(...Object.values(categorySpend), 1)

  const firstName = user.full_name?.split(' ')[0] ?? 'there'
  const dept = user.department ?? 'No department'
  const roleLabel = user.role === 'finance' ? 'Finance Manager' : user.role === 'manager' ? 'Manager' : 'Employee'

  return (
    <div className="p-8 max-w-6xl">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Good morning, {firstName} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">{roleLabel} • {dept}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Spend"
          value={currency(totalSpend)}
          sub="This month"
          tag="This Month"
          gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
          icon={Receipt}
        />
        <StatCard
          label="Reports"
          value={reportCount}
          sub={`${pendingApprovals.length} pending approval`}
          tag="Active"
          gradient="linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)"
          icon={CheckCircle}
        />
        <StatCard
          label="Pending"
          value={String(pendingApprovals.length).padStart(2, '0')}
          sub="Avg. 2 days in queue"
          tag="Action Req"
          gradient="linear-gradient(135deg, #fb923c 0%, #ef4444 100%)"
          icon={Clock}
        />
        <StatCard
          label="Violations"
          value={String(violationCount).padStart(2, '0')}
          sub="Policy breaches detected"
          tag="Urgent"
          gradient="linear-gradient(135deg, #f87171 0%, #dc2626 100%)"
          icon={ShieldAlert}
        />
      </div>

      {/* Two-column cards */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Expense Reports */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">
              {user.role === 'employee' ? 'My Expense Reports' : 'Pending Expense Approvals'}
            </h2>
            <Link to="/expenses" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View All
            </Link>
          </div>
          {myExpenses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nothing here yet</p>
          ) : (
            <div className="space-y-3">
              {myExpenses.slice(0, 3).map((exp: any) => {
                const Icon = getCategoryIcon(exp.items?.[0]?.category)
                return (
                  <Link
                    key={exp.id}
                    to={`/expenses/${exp.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{exp.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {exp.employee?.full_name ?? 'You'} · Submitted {date(exp.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{currency(exp.total_amount)}</p>
                      <div className="mt-1">
                        {exp.has_violations
                          ? <span className="badge badge-action_req">Action Req</span>
                          : <StatusBadge status={exp.status} />
                        }
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Travel Requests */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">
              {user.role === 'employee' ? 'My Travel Requests' : 'Pending Travel Approvals'}
            </h2>
            <Link to="/travel" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View All
            </Link>
          </div>
          {myTravels.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nothing here yet</p>
          ) : (
            <div className="space-y-3">
              {myTravels.slice(0, 3).map((tr: any) => (
                <Link
                  key={tr.id}
                  to={`/travel/${tr.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <Plane size={16} className="text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{tr.destination}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tr.employee?.full_name ?? 'You'} · {date(tr.departure_date)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">EST {currency(tr.estimated_budget)}</p>
                    <div className="mt-1">
                      <StatusBadge status={tr.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spend by Category */}
      {Object.keys(categorySpend).length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Spend by Category</h2>
            <span className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded-lg">Last 30 days</span>
          </div>
          <div className="space-y-3">
            {Object.entries(categorySpend).map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  {(() => { const Icon = getCategoryIcon(cat); return <Icon size={14} className="text-brand-600" /> })()}
                </div>
                <span className="w-24 text-sm text-gray-700 capitalize flex-shrink-0">{cat}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${((amt as number) / maxCat) * 100}%`,
                      background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                    }}
                  />
                </div>
                <span className="w-20 text-right text-sm font-bold text-gray-800">{currency(amt as number)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating New Report button */}
      <Link
        to="/expenses/new"
        className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold text-sm shadow-xl hover:shadow-2xl transition-all hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
      >
        <Plus size={18} />
        New Report
      </Link>
    </div>
  )
}
