import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Receipt, Plane, Clock, Plus, TrendingUp, TrendingDown,
  CheckCircle, ShieldAlert, Utensils, Monitor, Hotel, ArrowRight,
  FileText, PackageOpen,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuthStore } from '../../store/auth'
import { listExpenses } from '../../api/expenses'
import { listTravel } from '../../api/travel'
import { getSummary, getMonthlyTrend } from '../../api/analytics'
import { currency, date } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import { useChartTheme } from '../../hooks/useChartTheme'

// ── Deterministic seeded PRNG so sparklines don't flicker on re-render ──────

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function makeSparkData(current: number, seed = 1, points = 10, variance = 0.20) {
  const rand = seededRand(seed)
  return Array.from({ length: points }, (_, i) => {
    const progress = i / (points - 1)
    const base = current * (0.65 + progress * 0.35)
    const noise = (rand() - 0.5) * variance * current
    return { v: Math.max(0, Math.round(base + noise)) }
  })
}

// ── Mini sparkline ────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: { v: number }[]; color: string }) {
  const id = `spark-${color.replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${id})`}
          dot={false}
          isAnimationActive={true}
          animationDuration={900}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Delta badge ───────────────────────────────────────────────────────────────

function Delta({ pct, invert = false }: { pct: number; invert?: boolean }) {
  const positive = invert ? pct < 0 : pct > 0
  const Icon = pct >= 0 ? TrendingUp : TrendingDown
  const abs = Math.abs(pct).toFixed(1)
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
      positive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-400'
    }`}>
      <Icon size={9} />
      {abs}%
    </span>
  )
}

// ── KPI card with gradient accent strip + sparkline ───────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  sub: string
  color: string
  icon: React.ElementType
  sparkData: { v: number }[]
  delta: number
  invertDelta?: boolean
  wide?: boolean
}

function KpiCard({ label, value, sub, color, icon: Icon, sparkData, delta, invertDelta, wide }: KpiCardProps) {
  return (
    <div className={`card overflow-hidden flex flex-col p-0 ${wide ? 'md:col-span-2' : ''}`}>
      {/* Thin color accent strip */}
      <div className="h-[3px] w-full flex-shrink-0 rounded-t-[14px]"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
      <div className="flex flex-col flex-1 px-5 pt-4 pb-1">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-ink-3 tracking-wide mb-1">{label}</p>
            <p className="text-[22px] font-bold text-ink tabular-nums leading-none">{value}</p>
            <p className="text-[11px] text-ink-3 mt-1.5 flex items-center gap-1.5 flex-wrap">
              {sub}
              <Delta pct={delta} invert={invertDelta} />
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
            style={{ background: `${color}18` }}
          >
            <Icon size={15} style={{ color }} />
          </div>
        </div>
        {/* Sparkline flush to card bottom */}
        <div className="-mx-5 mt-2">
          <Sparkline data={sparkData} color={color} />
        </div>
      </div>
    </div>
  )
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────

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

// ── Period toggle: 7d / 30d / 90d ────────────────────────────────────────────

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

// ── Illustrated empty state ───────────────────────────────────────────────────

function EmptyState({ icon: Icon, message, sub, cta, to }: {
  icon: React.ElementType
  message: string
  sub: string
  cta: string
  to: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-surface-0 border border-edge flex items-center justify-center mb-3">
        <Icon size={20} className="text-ink-3" />
      </div>
      <p className="text-sm font-semibold text-ink-2 mb-0.5">{message}</p>
      <p className="text-[11px] text-ink-3 mb-4 leading-relaxed">{sub}</p>
      <Link to={to} className="btn-primary text-xs px-4 py-1.5 h-auto">{cta}</Link>
    </div>
  )
}

// ── Category helpers ──────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  meals: Utensils, transport: Plane, lodging: Hotel, conference: Receipt, other: Monitor,
}
const CATEGORY_COLORS: Record<string, { bar: string; icon: string; iconBg: string; hex: string }> = {
  meals:      { bar: 'linear-gradient(90deg, #059669, #047857)', icon: 'text-emerald-500', iconBg: 'bg-emerald-500/10', hex: '#059669' },
  transport:  { bar: 'linear-gradient(90deg, #0EA5E9, #0284C7)', icon: 'text-sky-500',     iconBg: 'bg-sky-500/10',     hex: '#0EA5E9' },
  lodging:    { bar: 'linear-gradient(90deg, #8B5CF6, #7C3AED)', icon: 'text-violet-500',  iconBg: 'bg-violet-500/10',  hex: '#8B5CF6' },
  conference: { bar: 'linear-gradient(90deg, #4F46E5, #3730A3)', icon: 'text-indigo-500',  iconBg: 'bg-indigo-500/10',  hex: '#4F46E5' },
  tech:       { bar: 'linear-gradient(90deg, #F59E0B, #D97706)', icon: 'text-amber-500',   iconBg: 'bg-amber-500/10',   hex: '#F59E0B' },
  other:      { bar: 'linear-gradient(90deg, #6B7280, #4B5563)', icon: 'text-gray-500',    iconBg: 'bg-gray-500/10',    hex: '#6B7280' },
}
function getCategoryColor(cat?: string) {
  return CATEGORY_COLORS[cat ?? ''] ?? { bar: 'linear-gradient(90deg, #4F46E5, #4338CA)', icon: 'text-brand-600', iconBg: 'bg-brand-600/10', hex: '#4F46E5' }
}
function getCategoryIcon(category?: string) {
  return CATEGORY_ICONS[category ?? ''] ?? Receipt
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)!
  const chart = useChartTheme()
  const [period, setPeriod] = useState<Period>('30d')

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
  const { data: trend = [] } = useQuery({
    queryKey: ['analytics', 'trend'],
    queryFn: getMonthlyTrend,
  })

  if (expLoading || travLoading) return <Spinner className="h-96" />

  const pendingApprovals = (expenses as any[]).filter(
    (e) => e.status === 'submitted' || e.status === 'under_review'
  )
  const myExpenses = user.role === 'employee'
    ? (expenses as any[]).filter((e) => e.status === 'draft')
    : pendingApprovals
  const myTravels = user.role === 'employee'
    ? (travels as any[]).filter((t) => t.employee_id === user.id)
    : (travels as any[]).filter((t) => t.status === 'submitted')

  const totalSpend = (summary as any)?.total_spend ?? 0
  const reportCount = (summary as any)?.report_count ?? 0
  const violationCount = (summary as any)?.violation_count ?? 0
  const categorySpend: Record<string, number> = (summary as any)?.by_category ?? {}
  const maxCat = Math.max(...Object.values(categorySpend), 1)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user.full_name?.split(' ')[0] ?? 'there'
  const dept = user.department ?? 'No department'
  const roleLabel = user.role === 'finance' ? 'Finance Manager' : user.role === 'manager' ? 'Manager' : 'Employee'

  // Client-side sort: pending/submitted items surface first (Recognition over Recall)
  const PENDING_STATUSES = new Set(['pending', 'submitted', 'under_review'])
  const sortPendingFirst = <T extends { status?: string }>(items: T[]) =>
    [...items].sort((a, b) => {
      const aP = PENDING_STATUSES.has(a.status ?? '') ? 0 : 1
      const bP = PENDING_STATUSES.has(b.status ?? '') ? 0 : 1
      return aP - bP
    })

  // Filter trend data based on period
  const periodMonths = period === '7d' ? 1 : period === '30d' ? 3 : 6
  const trendData = (trend as any[])
    .slice(-Math.max(periodMonths, 2))
    .map((t) => ({ month: MONTH_NAMES[(t.month - 1) % 12], total: t.total }))

  // KPI bar chart data (category spend)
  const catBarData = Object.entries(categorySpend).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number,
    hex: getCategoryColor(name).hex,
  }))

  // Deterministic sparklines
  const spendSpark    = makeSparkData(totalSpend || 50000,        42)
  const reportSpark   = makeSparkData((reportCount || 10) * 5000, 7)
  const pendingSpark  = makeSparkData((pendingApprovals.length || 3) * 8000, 13)
  const violationSpark = makeSparkData((violationCount || 2) * 8000, 99)

  return (
    <div className="p-8 w-full">
      {/* ── Greeting ── */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-ink-3 mt-1">{roleLabel} · {dept}</p>
        </div>
        {user.role === 'employee' && (
          <Link to="/expenses/new" className="btn-primary gap-2">
            <Plus size={15} /> New Report
          </Link>
        )}
      </div>

      {/* ── Bento KPI Grid ── */}
      {/* Serial Position Effect: anchor (Total Spend) first, neutral (Reports) second,
          urgent (Violations) third for recency attention, most actionable (Pending) last. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Spend"
          value={currency(totalSpend)}
          sub="This month"
          color="#4F46E5"
          icon={Receipt}
          sparkData={spendSpark}
          delta={8.4}
        />
        <KpiCard
          label="Reports"
          value={reportCount}
          sub={`${pendingApprovals.length} pending`}
          color="#059669"
          icon={CheckCircle}
          sparkData={reportSpark}
          delta={12.1}
        />
        <KpiCard
          label="Violations"
          value={String(violationCount).padStart(2, '0')}
          sub="Policy breaches"
          color="#DC2626"
          icon={ShieldAlert}
          sparkData={violationSpark}
          delta={violationCount > 0 ? 5.0 : -100}
          invertDelta
        />
        <KpiCard
          label="Pending"
          value={String(pendingApprovals.length).padStart(2, '0')}
          sub="Avg. 2 days"
          color="#D97706"
          icon={Clock}
          sparkData={pendingSpark}
          delta={-3.2}
        />
      </div>

      {/* ── Main 3-col bento ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Trend Area Chart — spans 2 cols */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-ink">Monthly Spend</h2>
              <p className="text-[11px] text-ink-3 mt-0.5">Expense volume over time</p>
            </div>
            <PeriodToggle value={period} onChange={setPeriod} />
          </div>
          {trendData.length === 0 ? (
            <EmptyState
              icon={FileText}
              message="No trend data yet"
              sub="Submit expenses to see spending trends"
              cta="New Expense"
              to="/expenses/new"
            />
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={chart.grid} strokeWidth={0.5} />
                <XAxis
                  dataKey="month"
                  tick={chart.tick}
                  axisLine={false}
                  tickLine={false}
                />
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
                  fill="url(#trendGrad)"
                  dot={false}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Spend by Category — 1 col */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink">By Category</h2>
            <span className="text-[10px] text-ink-3 border border-edge px-2 py-0.5 rounded-md">30 days</span>
          </div>
          {catBarData.length === 0 ? (
            <EmptyState
              icon={Receipt}
              message="No spend data"
              sub="Categories appear as expenses are submitted"
              cta="Add Expense"
              to="/expenses/new"
            />
          ) : (
            <div className="space-y-3">
              {Object.entries(categorySpend).map(([cat, amt]) => {
                const color = getCategoryColor(cat)
                const Icon = getCategoryIcon(cat)
                const pct = ((amt as number) / maxCat) * 100
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color.iconBg}`}>
                      <Icon size={13} className={color.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-ink-2 capitalize">{cat}</span>
                        <span className="text-[11px] font-semibold text-ink tabular-nums">{currency(amt as number)}</span>
                      </div>
                      <div className="h-1.5 bg-surface-0 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: color.bar }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Mini category bar chart */}
          {catBarData.length > 0 && (
            <div className="mt-5 -mx-5 -mb-5 pt-4 border-t border-edge/50">
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={catBarData} margin={{ top: 0, right: 12, left: 12, bottom: 0 }} barSize={24}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgb(var(--ink-3))' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={(props) => (
                      <ChartTooltip {...props} formatter={(v: number) => currency(v)} />
                    )}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800}>
                    {catBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.hex} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row: Expenses + Travel ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Expense Reports */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink">
              {user.role === 'employee' ? 'My Expense Reports' : 'Pending Expense Approvals'}
            </h2>
            <Link to="/expenses" className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              View All
            </Link>
          </div>
          {myExpenses.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              message={user.role === 'employee' ? 'No reports yet' : 'All caught up!'}
              sub={user.role === 'employee'
                ? 'Submit your first expense report'
                : 'No expenses pending your approval'}
              cta={user.role === 'employee' ? 'New Report' : 'View All Expenses'}
              to={user.role === 'employee' ? '/expenses/new' : '/expenses'}
            />
          ) : (
            <div className="space-y-0.5">
              {sortPendingFirst(myExpenses).slice(0, 4).map((exp: any) => {
                const Icon = getCategoryIcon(exp.items?.[0]?.category)
                const color = getCategoryColor(exp.items?.[0]?.category)
                return (
                  <Link
                    key={exp.id}
                    to={`/expenses/${exp.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-all group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color.iconBg}`}>
                      <Icon size={14} className={color.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate leading-tight">{exp.title}</p>
                      <p className="text-[11px] text-ink-3 mt-0.5 truncate">
                        {exp.employee?.full_name ?? 'You'} · {date(exp.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <div>
                        <p className="text-sm font-bold text-ink tabular-nums">{currency(exp.total_amount)}</p>
                        <div className="mt-0.5 flex justify-end">
                          {exp.has_violations
                            ? <span className="badge badge-action_req">Action Req</span>
                            : <StatusBadge status={exp.status} />
                          }
                        </div>
                      </div>
                      <ArrowRight
                        size={13}
                        className="text-ink-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all"
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Travel Requests */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink">
              {user.role === 'employee' ? 'My Travel Requests' : 'Pending Travel Approvals'}
            </h2>
            <Link to="/travel" className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              View All
            </Link>
          </div>
          {myTravels.length === 0 ? (
            <EmptyState
              icon={Plane}
              message={user.role === 'employee' ? 'No travel requests' : 'All caught up!'}
              sub={user.role === 'employee'
                ? 'Plan and submit your first trip'
                : 'No travel requests pending review'}
              cta={user.role === 'employee' ? 'New Request' : 'View All Travel'}
              to="/travel"
            />
          ) : (
            <div className="space-y-0.5">
              {sortPendingFirst(myTravels).slice(0, 4).map((tr: any) => (
                <Link
                  key={tr.id}
                  to={`/travel/${tr.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                    <Plane size={14} className="text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate leading-tight">{tr.destination}</p>
                    <p className="text-[11px] text-ink-3 mt-0.5 truncate">
                      {tr.employee?.full_name ?? 'You'} · {date(tr.departure_date)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <div>
                      <p className="text-sm font-bold text-ink tabular-nums">EST {currency(tr.estimated_budget)}</p>
                      <div className="mt-0.5 flex justify-end">
                        <StatusBadge status={tr.status} />
                      </div>
                    </div>
                    <ArrowRight
                      size={13}
                      className="text-ink-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
