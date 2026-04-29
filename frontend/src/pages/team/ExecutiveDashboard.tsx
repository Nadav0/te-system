import { useQuery } from '@tanstack/react-query'
import { DollarSign, Wallet, FileText, Minus } from 'lucide-react'
import {
  LineChart, Line, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { getSummary, getByEmployee, getByDepartment, getMonthlyTrend } from '../../api/analytics'
import { currency } from '../../utils/format'
import Spinner from '../../components/Spinner'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PIE_COLORS = ['#000000', '#555555', '#999999', '#cccccc', '#e5e5e5']

export default function ExecutiveDashboard() {
  const { data: summary, isLoading: sl } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: getSummary,
  })
  const { data: byEmployee = [], isLoading: el } = useQuery({
    queryKey: ['analytics', 'by-employee'],
    queryFn: getByEmployee,
  })
  const { data: byDept = [], isLoading: dl } = useQuery({
    queryKey: ['analytics', 'by-department'],
    queryFn: getByDepartment,
  })
  const { data: trend = [], isLoading: tl } = useQuery({
    queryKey: ['analytics', 'trend'],
    queryFn: getMonthlyTrend,
  })

  if (sl || el || dl || tl) return <Spinner className="h-96" />

  const trendData = (trend as any[]).map((t) => ({
    month: MONTH_NAMES[t.month - 1],
    total: t.total,
  }))

  const categoryData = Object.entries(summary?.by_category ?? {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number,
  }))

  const totalSpend = summary?.total_spend ?? 0
  const totalBudget = totalSpend * 1.4
  const budgetRemaining = totalBudget - totalSpend
  const budgetPercent = Math.round((totalSpend / totalBudget) * 100)
  const reportCount = summary?.report_count ?? 0
  const avgClaim = reportCount > 0 ? totalSpend / reportCount : 0

  const maxDeptSpend = Math.max(...(byDept as any[]).map((d: any) => d.total), 1)
  const catTotal = categoryData.reduce((s, c) => s + c.value, 0)

  const now = new Date()
  const lastUpdated =
    now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() +
    ' ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            Executive Live Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time enterprise expense overview and budget tracking.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Updated</p>
          <p className="text-sm font-bold text-gray-900">{lastUpdated}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          {
            label: 'Total Spend',
            value: currency(totalSpend),
            sub: '+12% vs last month',
            icon: DollarSign,
          },
          {
            label: 'Budget Remaining',
            value: currency(budgetRemaining),
            sub: `${budgetPercent}% Utilized`,
            icon: Wallet,
            progress: budgetPercent,
          },
          {
            label: 'Claims Count',
            value: reportCount.toLocaleString(),
            sub: '-3% vs last month',
            icon: FileText,
          },
          {
            label: 'Avg Claim Value',
            value: currency(avgClaim),
            sub: '— Stable trend',
            icon: Minus,
          },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {card.label}
              </p>
              <card.icon size={15} className="text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            {card.progress !== undefined && (
              <div className="mt-2 h-1.5 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full bg-gray-800 rounded"
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Monthly trend */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Monthly Spend Trend
          </p>
          {trendData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-16">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v) => currency(Number(v))} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#000"
                  strokeWidth={2}
                  dot={{ fill: '#000', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By department */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Spend by Department
            </p>
            <span className="text-gray-400 font-bold">⋮</span>
          </div>
          {(byDept as any[]).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-16">No data yet</p>
          ) : (
            <div className="space-y-3 pt-1">
              {(byDept as any[]).slice(0, 4).map((dept: any) => (
                <div key={dept.department}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{dept.department}</span>
                    <span className="font-semibold text-gray-900">
                      ${(dept.total / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-black rounded"
                      style={{ width: `${(dept.total / maxDeptSpend) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-4">
        {/* By category donut */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Spend by Category
          </p>
          {categoryData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-16">No data yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => currency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-gray-600 flex-1">{c.name}</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round((c.value / catTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top 5 spenders */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Top 5 Spenders
          </p>
          {(byEmployee as any[]).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-16">No data yet</p>
          ) : (
            <div className="space-y-3">
              {(byEmployee as any[]).slice(0, 5).map((emp: any) => {
                const initials = emp.name
                  ?.split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
                return (
                  <div key={emp.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 border-2 border-gray-800 rounded flex items-center justify-center text-xs font-bold text-gray-800 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        {emp.department ?? '—'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{currency(emp.total_spend)}</p>
                      <p className="text-xs text-gray-400">{emp.report_count} claims</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
