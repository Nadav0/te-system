import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Receipt, Plane, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { listExpenses } from '../../api/expenses'
import { listTravel } from '../../api/travel'
import { getSummary } from '../../api/analytics'
import { currency, date } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
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

  const pendingApprovals = expenses.filter((e: any) => e.status === 'submitted' || e.status === 'under_review')
  const myDraftExpenses = expenses.filter((e: any) => e.status === 'draft')
  const pendingTravel = travels.filter((t: any) => t.status === 'submitted')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.full_name.split(' ')[0]}
        </h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">
          {user.role} · {user.department ?? 'No department'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Spend"
          value={currency(summary?.total_spend ?? 0)}
          icon={Receipt}
          color="bg-blue-600"
        />
        <StatCard
          label="Reports"
          value={summary?.report_count ?? 0}
          icon={Receipt}
          color="bg-indigo-600"
        />
        {(user.role === 'manager' || user.role === 'finance') && (
          <StatCard
            label="Pending Approvals"
            value={pendingApprovals.length}
            icon={Clock}
            color="bg-amber-500"
          />
        )}
        <StatCard
          label="Policy Violations"
          value={summary?.violation_count ?? 0}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expenses section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Receipt size={18} className="text-blue-600" />
              {user.role === 'employee' ? 'My Expense Reports' : 'Pending Expense Approvals'}
            </h2>
            <Link to="/expenses/new" className="btn-primary text-xs px-3 py-1.5">
              <Plus size={14} /> New
            </Link>
          </div>
          {(user.role === 'employee' ? myDraftExpenses : pendingApprovals).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Nothing here yet</p>
          ) : (
            <div className="space-y-2">
              {(user.role === 'employee' ? myDraftExpenses : pendingApprovals).slice(0, 5).map((exp: any) => (
                <Link
                  key={exp.id}
                  to={`/expenses/${exp.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{exp.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {exp.employee?.full_name ?? 'You'} · {date(exp.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {exp.has_violations && <AlertTriangle size={14} className="text-amber-500" />}
                    <StatusBadge status={exp.status} />
                    <span className="text-sm font-semibold text-gray-700">{currency(exp.total_amount)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Travel section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Plane size={18} className="text-indigo-600" />
              {user.role === 'employee' ? 'My Travel Requests' : 'Pending Travel Approvals'}
            </h2>
            <Link to="/travel/new" className="btn-primary text-xs px-3 py-1.5">
              <Plus size={14} /> New
            </Link>
          </div>
          {(user.role === 'employee' ? travels.filter((t: any) => t.employee_id === user.id) : pendingTravel).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Nothing here yet</p>
          ) : (
            <div className="space-y-2">
              {(user.role === 'employee' ? travels : pendingTravel).slice(0, 5).map((tr: any) => (
                <Link
                  key={tr.id}
                  to={`/travel/${tr.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tr.destination}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tr.employee?.full_name ?? 'You'} · {date(tr.departure_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={tr.status} />
                    <span className="text-sm font-semibold text-gray-700">{currency(tr.estimated_budget)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spend by category */}
      {summary?.by_category && Object.keys(summary.by_category).length > 0 && (
        <div className="card mt-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" /> Spend by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(summary.by_category as Record<string, number>).map(([cat, amt]) => (
              <div key={cat} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{currency(amt)}</p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">{cat}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
