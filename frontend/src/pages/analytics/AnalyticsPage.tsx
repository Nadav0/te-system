import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { AlertTriangle, ArrowUpRight, Zap, TrendingUp } from 'lucide-react'
import { getSummary, getByEmployee, getByDepartment, getMonthlyTrend, getViolations } from '../../api/analytics'
import { listExpenses } from '../../api/expenses'
import { currency, date } from '../../utils/format'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'
import { useChartTheme } from '../../hooks/useChartTheme'
import type { ExpenseReport, ExpenseItem } from '../../types'

// ── Anomaly detection ─────────────────────────────────────────────────────────

type Anomaly = {
  severity: 'Critical' | 'Medium'
  title: string
  detail: string
  amount: number
}

function detectAnomalies(reports: ExpenseReport[]): Anomaly[] {
  const anomalies: Anomaly[] = []

  reports.forEach((r) => {
    ;(r.items ?? []).forEach((item: ExpenseItem) => {
      if (item.category === 'lodging' && item.amount > 300) {
        anomalies.push({
          severity: 'Medium',
          title: 'Non-Preferred Hotel',
          detail: `${item.description || r.title} — ${r.employee?.full_name ?? 'Unknown'}`,
          amount: item.amount,
        })
      }
    })
  })

  reports.forEach((r) => {
    ;(r.items ?? []).forEach((item: ExpenseItem) => {
      if (item.category === 'meals' && item.date) {
        const dow = new Date(item.date).getDay()
        if (dow === 0 || dow === 6) {
          anomalies.push({
            severity: 'Medium',
            title: 'Weekend Meal Expense',
            detail: `${item.description || r.title} on ${date(item.date)} — ${r.employee?.full_name ?? 'Unknown'}`,
            amount: item.amount,
          })
        }
      }
    })
  })

  const itemsByCategory: Record<string, { item: ExpenseItem; report: ExpenseReport }[]> = {}
  reports.forEach((r) => {
    ;(r.items ?? []).forEach((item: ExpenseItem) => {
      if (!itemsByCategory[item.category]) itemsByCategory[item.category] = []
      itemsByCategory[item.category].push({ item, report: r })
    })
  })
  Object.entries(itemsByCategory).forEach(([cat, entries]) => {
    const seen = new Map<number, ExpenseItem>()
    entries.forEach(({ item, report }) => {
      if (seen.has(item.amount) && cat === 'transport') {
        anomalies.push({
          severity: 'Critical',
          title: 'Duplicate Flight Transaction',
          detail: `${item.description || report.title} — ${currency(item.amount)} appears twice`,
          amount: item.amount,
        })
      }
      seen.set(item.amount, item)
    })
  })

  return anomalies.slice(0, 6)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  meals:      '#059669',
  transport:  '#0EA5E9',
  lodging:    '#8B5CF6',
  conference: '#4F46E5',
  tech:       '#F59E0B',
  other:      '#6B7280',
}
function getCatColor(name: string, idx: number) {
  const key = name.toLowerCase()
  return CATEGORY_COLORS[key] ?? ['#4F46E5','#818CF8','#60a5fa','#34d399','#fbbf24','#f87171','#c084fc'][idx % 7]
}
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-1 border border-edge rounded-xl shadow-lg px-3 py-2 text-[12px]">
      {label && <p className="text-ink-3 mb-1 font-medium">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold text-ink">
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ── Period toggle ─────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d'
function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const opts: Period[] = ['7d', '30d', '90d']
  return (
    <div className="flex items-center gap-0.5 bg-surface-0 rounded-lg p-0.5 border border-edge">
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
            value === o
              ? 'bg-surface-1 text-ink shadow-sm border border-edge/50'
              : 'text-ink-3 hover:text-ink-2'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color = '#4F46E5', delta }: {
  label: string; value: string; color?: string; delta?: number
}) {
  return (
    <div className="card p-5">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}18` }}
      >
        <TrendingUp size={14} style={{ color }} />
      </div>
      <p className="text-[22px] font-bold text-ink tabular-nums leading-none">{value}</p>
      <p className="text-[12px] text-ink-3 mt-1.5">{label}</p>
      {delta !== undefined && (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold mt-2 px-1.5 py-0.5 rounded-full ${
          delta >= 0 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-400'
        }`}>
          {delta >= 0 ? '+' : ''}{delta}%
        </span>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const chart = useChartTheme()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('30d')

  const { data: summary, isLoading: sl } = useQuery({ queryKey: ['analytics', 'summary'], queryFn: getSummary })
  const { data: byEmployee = [], isLoading: el } = useQuery({ queryKey: ['analytics', 'by-employee'], queryFn: getByEmployee })
  const { data: byDept = [], isLoading: dl } = useQuery({ queryKey: ['analytics', 'by-department'], queryFn: getByDepartment })
  const { data: trend = [], isLoading: tl } = useQuery({ queryKey: ['analytics', 'trend'], queryFn: getMonthlyTrend })
  const { data: violations = [], isLoading: vl } = useQuery({ queryKey: ['analytics', 'violations'], queryFn: getViolations })
  const { data: allExpenses = [], isLoading: xl } = useQuery({ queryKey: ['expenses'], queryFn: () => listExpenses() })

  const isLoading = sl || el || dl || tl || vl || xl
  if (isLoading) return <Spinner className="h-96" />

  const categoryData = Object.entries(summary?.by_category ?? {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number,
  }))

  const periodMonths = period === '7d' ? 1 : period === '30d' ? 3 : 6
  const trendData = (trend as any[])
    .slice(-Math.max(periodMonths, 2))
    .map((t) => ({
      month: `${MONTH_NAMES[t.month - 1]}`,
      total: t.total,
    }))

  const anomalies = detectAnomalies(allExpenses as ExpenseReport[])

  return (
    <div className="p-8">
      <PageHeader
        title="Analytics"
        subtitle="Spending insights and compliance overview"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Spend"       value={currency(summary?.total_spend ?? 0)}       color="#4F46E5" delta={8.4} />
        <KpiCard label="Total Reports"     value={String(summary?.report_count ?? 0)}         color="#059669" delta={12.1} />
        <KpiCard label="Policy Violations" value={String(summary?.violation_count ?? 0)}      color="#DC2626" delta={5.0} />
        <KpiCard label="Approved Reports"  value={String(summary?.by_status?.approved ?? 0)} color="#0EA5E9" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly trend — gradient area */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-ink">Monthly Spend Trend</h3>
              <p className="text-[11px] text-ink-3 mt-0.5">Total expense volume per month</p>
            </div>
            <PeriodToggle value={period} onChange={setPeriod} />
          </div>
          {trendData.length === 0 ? (
            <p className="text-ink-3 text-sm text-center py-12">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={chart.grid} strokeWidth={0.5} />
                <XAxis dataKey="month" tick={chart.tick} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={chart.tick}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  content={(props) => (
                    <ChartTooltip {...props} formatter={(v: number) => currency(v)} />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  fill="url(#trendAreaGrad)"
                  dot={{ fill: '#4F46E5', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#4F46E5' }}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By category — donut */}
        <div className="card">
          <h3 className="text-base font-semibold text-ink mb-5">Spend by Category</h3>
          {categoryData.length === 0 ? (
            <p className="text-ink-3 text-sm text-center py-12">No data yet</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    isAnimationActive
                    animationDuration={800}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={getCatColor(entry.name, i)} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={(props) => (
                      <ChartTooltip {...props} formatter={(v: number) => currency(v)} />
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: getCatColor(entry.name, i) }}
                    />
                    <span className="text-[12px] text-ink-2 flex-1 truncate">{entry.name}</span>
                    <span className="text-[12px] font-semibold text-ink tabular-nums">{currency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* By department — horizontal bar */}
        <div className="card">
          <h3 className="text-base font-semibold text-ink mb-5">Spend by Department</h3>
          {byDept.length === 0 ? (
            <p className="text-ink-3 text-sm text-center py-12">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDept} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="deptBarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="100%" stopColor="#818CF8" />
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} stroke={chart.grid} strokeWidth={0.5} />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={chart.tick} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="department" tick={chart.tick} width={80} axisLine={false} tickLine={false} />
                <Tooltip
                  content={(props) => (
                    <ChartTooltip {...props} formatter={(v: number) => currency(v)} />
                  )}
                />
                <Bar dataKey="total" fill="url(#deptBarGrad)" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Policy violations — vertical bar */}
        <div className="card">
          <h3 className="text-base font-semibold text-ink mb-5">Policy Violations by Category</h3>
          {violations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-emerald-600">No violations detected</p>
              <p className="text-[11px] text-ink-3 mt-1">Spend looks clean</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={violations} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={chart.grid} strokeWidth={0.5} />
                <XAxis dataKey="category" tick={chart.tick} axisLine={false} tickLine={false} />
                <YAxis tick={chart.tick} axisLine={false} tickLine={false} />
                <Tooltip content={(props) => <ChartTooltip {...props} />} />
                <Bar dataKey="count" fill="#DC2626" radius={[4, 4, 0, 0]} name="Violations" isAnimationActive animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Risk Anomalies */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-400/10 flex items-center justify-center">
              <Zap size={16} className="text-red-400" />
            </div>
            <div>
              <Link
                to="/expenses?filter=flagged"
                className="group inline-flex items-center gap-1 text-base font-semibold text-ink hover:text-indigo-500 transition-colors"
              >
                Risk Anomalies
                <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <p className="text-[11px] text-ink-3">AI-detected policy and spend irregularities</p>
            </div>
          </div>
          {anomalies.length > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-red-400/10 text-red-400 px-2 py-0.5 rounded-full">
              {anomalies.filter((a) => a.severity === 'Critical').length} Critical
            </span>
          )}
        </div>
        {anomalies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-emerald-500 text-sm font-medium">No anomalies detected — spend looks clean.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {anomalies.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                    a.severity === 'Critical'
                      ? 'bg-red-400/5 border-red-400/20 hover:border-red-400'
                      : 'bg-amber-400/5 border-amber-400/20 hover:border-amber-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    a.severity === 'Critical' ? 'bg-red-400/10' : 'bg-amber-400/10'
                  }`}>
                    <AlertTriangle size={14} className={a.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-ink">{a.title}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        a.severity === 'Critical'
                          ? 'bg-red-400/15 text-red-400'
                          : 'bg-amber-400/15 text-amber-400'
                      }`}>{a.severity}</span>
                    </div>
                    <p className="text-xs text-ink-3 truncate">{a.detail}</p>
                  </div>
                  <p className="text-sm font-bold text-ink tabular-nums flex-shrink-0">{currency(a.amount)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-edge flex justify-end">
              <Link
                to="/expenses?filter=flagged"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                View Flagged Expenses
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Top spenders table */}
      <div className="card">
        <h3 className="text-base font-semibold text-ink mb-4">Top Spenders</h3>
        {byEmployee.length === 0 ? (
          <p className="text-ink-3 text-sm text-center py-8">No data yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-ink-3">#</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-ink-3">Employee</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-ink-3">Department</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-ink-3">Reports</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-ink-3">Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {(byEmployee as any[]).map((emp, i) => (
                <tr
                  key={emp.id}
                  className="hover:bg-surface-hover transition-colors cursor-pointer group"
                  onClick={() => navigate(`/expenses?employee=${encodeURIComponent(emp.name)}`)}
                >
                  <td className="px-3 py-3 text-ink-3 font-medium tabular-nums">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: ['#4F46E5','#059669','#0EA5E9','#D97706','#DC2626'][i % 5] }}
                      >
                        {emp.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-ink">{emp.name}</span>
                      <ArrowUpRight size={13} className="text-ink-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-ink-3">{emp.department ?? '—'}</td>
                  <td className="px-3 py-3 text-right text-ink-2">{emp.report_count}</td>
                  <td className="px-3 py-3 text-right font-semibold text-ink tabular-nums">{currency(emp.total_spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
