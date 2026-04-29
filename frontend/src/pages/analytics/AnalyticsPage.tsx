import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'
import { getSummary, getByEmployee, getByDepartment, getMonthlyTrend, getViolations } from '../../api/analytics'
import { currency } from '../../utils/format'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444']
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: summary, isLoading: sl } = useQuery({ queryKey: ['analytics', 'summary'], queryFn: getSummary })
  const { data: byEmployee = [], isLoading: el } = useQuery({ queryKey: ['analytics', 'by-employee'], queryFn: getByEmployee })
  const { data: byDept = [], isLoading: dl } = useQuery({ queryKey: ['analytics', 'by-department'], queryFn: getByDepartment })
  const { data: trend = [], isLoading: tl } = useQuery({ queryKey: ['analytics', 'trend'], queryFn: getMonthlyTrend })
  const { data: violations = [], isLoading: vl } = useQuery({ queryKey: ['analytics', 'violations'], queryFn: getViolations })

  const isLoading = sl || el || dl || tl || vl

  if (isLoading) return <Spinner className="h-96" />

  const categoryData = Object.entries(summary?.by_category ?? {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number,
  }))

  const trendData = (trend as any[]).map((t) => ({
    month: `${MONTH_NAMES[t.month - 1]} ${t.year}`,
    total: t.total,
  }))

  return (
    <div className="p-8">
      <PageHeader
        title="Analytics"
        subtitle="Spending insights and compliance overview"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Spend" value={currency(summary?.total_spend ?? 0)} />
        <StatCard label="Total Reports" value={String(summary?.report_count ?? 0)} />
        <StatCard label="Policy Violations" value={String(summary?.violation_count ?? 0)} />
        <StatCard label="Approved Reports" value={String(summary?.by_status?.approved ?? 0)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly trend */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Spend Trend</h3>
          {trendData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => currency(Number(v))} />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By category */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Spend by Category</h3>
          {categoryData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => currency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* By department */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Spend by Department</h3>
          {byDept.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byDept} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v) => currency(Number(v))} />
                <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Policy violations */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Policy Violations by Category</h3>
          {violations.length === 0 ? (
            <p className="text-green-600 text-sm text-center py-12 flex items-center justify-center gap-2">
              No violations detected
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={violations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Violations" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top spenders table */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Top Spenders</h3>
        {byEmployee.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Employee</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Department</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Reports</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(byEmployee as any[]).map((emp, i) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{emp.name}</td>
                  <td className="px-4 py-2.5 text-gray-500">{emp.department ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{emp.report_count}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{currency(emp.total_spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
