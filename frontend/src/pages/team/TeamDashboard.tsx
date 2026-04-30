import { useQuery } from '@tanstack/react-query'
import { UserCheck, Info } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { getSummary, getRecentActivity } from '../../api/analytics'
import { listExpenses } from '../../api/expenses'
import { currency } from '../../utils/format'
import Spinner from '../../components/Spinner'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export default function TeamDashboard() {
  const user = useAuthStore((s) => s.user)!

  const { data: summary, isLoading: sl } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: getSummary,
  })
  const { data: expenses = [], isLoading: el } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => listExpenses(),
  })
  const { data: recentActivity = [], isLoading: al } = useQuery({
    queryKey: ['analytics', 'recent-activity'],
    queryFn: () => getRecentActivity(8),
  })

  if (sl || el || al) return <Spinner className="h-96" />

  const totalSpent = (summary as any)?.total_spend ?? 0
  const totalBudget = (summary as any)?.budget ?? 200000
  const budgetRemaining = Math.max(totalBudget - totalSpent, 0)
  const budgetPercent = Math.min(Math.round((totalSpent / totalBudget) * 100), 100)
  const pendingApprovals = (expenses as any[]).filter(
    (e) => e.status === 'submitted' || e.status === 'under_review'
  ).length

  const budgetBarColor =
    budgetPercent >= 100 ? 'bg-red-600' : budgetPercent >= 80 ? 'bg-amber-500' : 'bg-black'

  const categorySpend: Record<string, number> = (summary as any)?.by_category ?? {}
  const maxCatSpend = Math.max(...Object.values(categorySpend as Record<string, number>), 1)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitoring expenditure and team compliance for Q3.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border-2 border-gray-900 text-gray-900 text-sm font-semibold rounded hover:bg-gray-50 transition-colors">
          <UserCheck size={16} />
          Delegate Approvals
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900">{currency(totalSpent)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Budget Remaining</p>
          <p className="text-2xl font-bold text-gray-900">{currency(budgetRemaining)}</p>
        </div>
        <div className="bg-black rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pending Approvals</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-white">{pendingApprovals}</p>
            {pendingApprovals > 0 && <span className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </div>
      </div>

      {/* Department Budget Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Department Budget Status</h2>
          <span className="text-sm text-gray-500 border border-gray-200 px-3 py-1 rounded">
            Q3 Fiscal Year
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>{currency(totalSpent)} Spent</span>
          <span>{currency(totalBudget)} Total</span>
        </div>
        <div className="w-full h-9 bg-gray-100 rounded overflow-hidden">
          <div
            className={`h-full ${budgetBarColor} flex items-center justify-end pr-3 transition-all duration-500`}
            style={{ width: `${Math.max(budgetPercent, 3)}%` }}
          >
            <span className="text-white text-sm font-semibold">{budgetPercent}%</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <Info size={12} />
          Budget bar changes visual state at 80% (warning) and 100% (danger)
        </p>
      </div>

      {/* Spend by Category + Recent Activity */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Spend by Category</h2>
          {Object.keys(categorySpend).length === 0 ? (
            <p className="text-sm text-gray-400">No expense data yet.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(categorySpend).map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-4">
                  <span className="w-32 text-sm text-gray-700 capitalize">{cat}</span>
                  <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-gray-800 rounded transition-all duration-500"
                      style={{ width: `${((amt as number) / maxCatSpend) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-sm font-semibold text-gray-800">
                    {currency(amt as number)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Recent Activity
          </p>
          {(recentActivity as any[]).length === 0 ? (
            <p className="text-sm text-gray-400">No recent activity.</p>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto max-h-64">
              {(recentActivity as any[]).map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      item.status === 'submitted' ? 'bg-black' : item.status === 'approved' ? 'bg-green-500' : item.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="mt-6 w-full text-sm text-gray-600 border border-gray-200 bg-white py-2 rounded hover:bg-gray-50 transition-colors">
            View Audit Log
          </button>
        </div>
      </div>
    </div>
  )
}
