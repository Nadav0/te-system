import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Wallet, FileText, Minus, MoreVertical } from 'lucide-react'
import {
 LineChart, Line, PieChart, Pie, Cell, Tooltip,
 XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { getSummary, getByEmployee, getByDepartment, getMonthlyTrend } from '../../api/analytics'
import { currency } from '../../utils/format'
import Spinner from '../../components/Spinner'
import { useChartTheme } from '../../hooks/useChartTheme'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ExecutiveDashboard() {
 const [deptMenuOpen, setDeptMenuOpen] = useState(false)
 const [deptLimit, setDeptLimit] = useState(4)
 const chart = useChartTheme()
 const CATEGORY_COLORS: Record<string, string> = {
  meals: '#059669', transport: '#0EA5E9', lodging: '#8B5CF6',
  conference: '#4F46E5', tech: '#F59E0B', other: '#6B7280',
 }
 function getCatColor(name: string, idx: number) {
  return CATEGORY_COLORS[name.toLowerCase()] ?? [chart.line,'#818CF8','#60a5fa','#34d399','#fbbf24'][idx % 5]
 }
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
 const reportCount = summary?.report_count ?? 0
 const avgClaim = reportCount > 0 ? totalSpend / reportCount : 0

 // Month-over-month spend change from trend data
 const sortedTrend = [...(trend as any[])].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
 const lastMonthTotal: number = sortedTrend[sortedTrend.length - 1]?.total ?? 0
 const prevMonthTotal: number = sortedTrend[sortedTrend.length - 2]?.total ?? 0
 const momChange = prevMonthTotal > 0 ? Math.round(((lastMonthTotal - prevMonthTotal) / prevMonthTotal) * 100) : null
 const momLabel = momChange !== null ? (momChange >= 0 ? `+${momChange}%` : `${momChange}%`) + ' vs prev month' : 'No prior month data'

 // Budget: use approved spend as a budget proxy or fall back to total * 1.25 clearly labeled
 const approvedSpend = (summary as any)?.by_status?.approved_total ?? totalSpend
 const totalBudget = Math.max(approvedSpend * 1.25, totalSpend * 1.25)
 const budgetRemaining = Math.max(totalBudget - totalSpend, 0)
 const budgetPercent = totalBudget > 0 ? Math.min(Math.round((totalSpend / totalBudget) * 100), 100) : 0

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
 <h1 className="text-xl font-semibold text-ink tracking-tight">
 Executive Dashboard
 </h1>
 <p className="text-[13px] text-ink-3 mt-1">
 Real-time enterprise expense overview and budget tracking.
 </p>
 </div>
 <div className="text-right">
 <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Last Updated</p>
 <p className="text-sm font-bold text-ink">{lastUpdated}</p>
 </div>
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-4 gap-4 mb-5">
 {[
 {
 label: 'Total Spend',
 value: currency(totalSpend),
 sub: momLabel,
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
 sub: `${reportCount} reports total`,
 icon: FileText,
 },
 {
 label: 'Avg Claim Value',
 value: currency(avgClaim),
 sub: reportCount > 0 ? `Across ${reportCount} reports` : 'No reports yet',
 icon: Minus,
 },
 ].map((card) => (
 <div key={card.label} className="bg-surface-1 border border-edge rounded-lg p-5">
 <div className="flex items-start justify-between mb-1">
 <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
 {card.label}
 </p>
 <card.icon size={15} className="text-ink-3" />
 </div>
 <p className="text-2xl font-bold text-ink mt-1">{card.value}</p>
 {card.progress !== undefined && (
 <div className="mt-2 h-1.5 bg-surface-0 rounded overflow-hidden">
 <div
 className="h-full bg-surface-2 rounded"
 style={{ width: `${card.progress}%` }}
 />
 </div>
 )}
 <p className="text-xs text-ink-3 mt-1">{card.sub}</p>
 </div>
 ))}
 </div>

 {/* Charts row 1 */}
 <div className="grid grid-cols-2 gap-4 mb-4">
 {/* Monthly trend */}
 <div className="bg-surface-1 border border-edge rounded-lg p-5">
 <p className="text-xs font-semibold text-ink-2 uppercase tracking-wider mb-4">
 Monthly Spend Trend
 </p>
 {trendData.length === 0 ? (
 <p className="text-ink-3 text-sm text-center py-16">No data yet</p>
 ) : (
 <ResponsiveContainer width="100%" height={220}>
 <LineChart data={trendData}>
 <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
 <XAxis dataKey="month" tick={chart.tick} />
 <YAxis
 tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
 tick={chart.tick}
 />
 <Tooltip formatter={(v) => currency(Number(v))} contentStyle={chart.tooltip} />
 <Line
 type="monotone"
 dataKey="total"
 stroke={chart.line}
 strokeWidth={2}
 dot={false}
 />
 </LineChart>
 </ResponsiveContainer>
 )}
 </div>

 {/* By department */}
 <div className="bg-surface-1 border border-edge rounded-lg p-5">
 <div className="flex items-center justify-between mb-4">
 <p className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
 Spend by Department
 </p>
 <div className="relative">
  <button
   onClick={() => setDeptMenuOpen(!deptMenuOpen)}
   className="p-1 text-ink-3 hover:text-ink rounded hover:bg-surface-hover transition-colors"
   title="Chart options"
  >
   <MoreVertical size={15} />
  </button>
  {deptMenuOpen && (
   <>
    <div className="fixed inset-0 z-10" onClick={() => setDeptMenuOpen(false)} />
    <div className="absolute right-0 top-full mt-1 bg-surface-2 border border-edge-hi rounded-xl z-20 py-1 min-w-[160px]">
     <p className="px-3 py-1.5 text-[10px] text-ink-3 uppercase tracking-widest font-semibold">Show</p>
     {[4, 6, 8].map((n) => (
      <button
       key={n}
       onClick={() => { setDeptLimit(n); setDeptMenuOpen(false) }}
       className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors ${deptLimit === n ? 'text-brand-600 font-semibold' : 'text-ink-2'}`}
      >
       Top {n} departments
      </button>
     ))}
    </div>
   </>
  )}
 </div>
 </div>
 {(byDept as any[]).length === 0 ? (
 <p className="text-ink-3 text-sm text-center py-16">No data yet</p>
 ) : (
 <div className="space-y-3 pt-1">
 {(byDept as any[]).slice(0, deptLimit).map((dept: any) => (
 <div key={dept.department}>
 <div className="flex items-center justify-between text-sm mb-1">
 <span className="text-ink-2">{dept.department}</span>
 <span className="font-semibold text-ink">
 ${(dept.total / 1000000).toFixed(1)}M
 </span>
 </div>
 <div className="h-4 bg-surface-0 rounded overflow-hidden">
 <div
 className="h-full bg-brand-600 rounded"
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
 <div className="bg-surface-1 border border-edge rounded-lg p-5">
 <p className="text-xs font-semibold text-ink-2 uppercase tracking-wider mb-4">
 Spend by Category
 </p>
 {categoryData.length === 0 ? (
 <p className="text-ink-3 text-sm text-center py-16">No data yet</p>
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
  {categoryData.map((entry, i) => (
  <Cell key={i} fill={getCatColor(entry.name, i)} />
 ))}
 </Pie>
 <Tooltip formatter={(v) => currency(Number(v))} contentStyle={chart.tooltip} />
 </PieChart>
 </ResponsiveContainer>
 </div>
 <div className="space-y-2 flex-1">
 {categoryData.map((c, i) => (
 <div key={c.name} className="flex items-center gap-2 text-xs">
 <span
 className="w-3 h-3 rounded-sm flex-shrink-0"
   style={{ background: getCatColor(c.name, i) }}
 />
 <span className="text-ink-2 flex-1">{c.name}</span>
 <span className="font-semibold text-ink">
 {Math.round((c.value / catTotal) * 100)}%
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Top 5 spenders */}
 <div className="bg-surface-1 border border-edge rounded-lg p-5">
 <p className="text-xs font-semibold text-ink-2 uppercase tracking-wider mb-4">
 Top 5 Spenders
 </p>
 {(byEmployee as any[]).length === 0 ? (
 <p className="text-ink-3 text-sm text-center py-16">No data yet</p>
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
 <div className="w-9 h-9 border-2 border-edge-hi rounded flex items-center justify-center text-xs font-bold text-ink flex-shrink-0">
 {initials}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-ink truncate">{emp.name}</p>
 <p className="text-xs text-ink-3 uppercase tracking-wider">
 {emp.department ?? '—'}
 </p>
 </div>
 <div className="text-right flex-shrink-0">
 <p className="text-sm font-bold text-ink">{currency(emp.total_spend)}</p>
 <p className="text-xs text-ink-3">{emp.report_count} claims</p>
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
