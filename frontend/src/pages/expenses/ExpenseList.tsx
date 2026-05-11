import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, AlertTriangle, Download, Filter, ChevronDown, ChevronUp, ChevronsUpDown, Search, X, Receipt } from 'lucide-react'
import { listExpenses, deleteExpense } from '../../api/expenses'
import { currency, date } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import type { ExpenseReport } from '../../types'

const CATEGORY_COLORS: Record<string, string> = {
  meals: 'bg-orange-400/10 text-orange-400',
  transport: 'bg-blue-400/10 text-blue-400',
  lodging: 'bg-purple-400/10 text-purple-400',
  conference: 'bg-green-400/10 text-green-400',
  tech: 'bg-cyan-400/10 text-cyan-400',
  other: 'bg-ink-3/10 text-ink-3',
}

const TAB_MAP: Record<string, string> = {
  all: '',
  'In Review': 'under_review',
  Approved: 'approved',
  Reimbursed: 'paid',
  Drafts: 'draft',
  Rejected: 'rejected',
}

const TABS = Object.keys(TAB_MAP)
const TIME_FILTERS = ['All Time', 'This Month', 'This Week']

const AVATAR_COLORS = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500']

function avatarColor(name?: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
}

function initials(name?: string) {
  return name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-brand-600/20 text-brand-600 not-italic rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function filterByTime(reports: ExpenseReport[], t: string) {
  if (t === 'All Time') return reports
  const now = new Date()
  return reports.filter((r) => {
    const d = new Date(r.created_at)
    if (t === 'This Week') return now.getTime() - d.getTime() < 7 * 86400000
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
}

function exportCSV(reports: ExpenseReport[]) {
  const rows = [
    ['Title', 'Employee', 'Date', 'Status', 'Amount', 'Currency'],
    ...reports.map((r) => [r.title, r.employee?.full_name ?? '', date(r.created_at), r.status, String(r.total_amount), r.currency]),
  ]
  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'expenses.csv'; a.click()
  URL.revokeObjectURL(url)
}

type SortKey = 'date' | 'title' | 'employee' | 'status' | 'amount'

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc' }) {
  if (col !== sortKey) return <ChevronsUpDown size={12} className="text-ink-3/50 ml-1" />
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-brand-600 ml-1" />
    : <ChevronDown size={12} className="text-brand-600 ml-1" />
}

export default function ExpenseList() {
  const [activeTab, setActiveTab] = useState('all')
  const [timeFilter, setTimeFilter] = useState('All Time')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [catOpen, setCatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const qc = useQueryClient()

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const { data: allReports = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => listExpenses(),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })

  const all = allReports as ExpenseReport[]

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(all.flatMap((r) => r.items?.map((i) => i.category) ?? [])))],
    [all],
  )

  const reports = useMemo(() => {
    let list = all
    const statusVal = TAB_MAP[activeTab]
    if (statusVal) list = list.filter((r) => r.status === statusVal)
    list = filterByTime(list, timeFilter)
    if (categoryFilter !== 'all') list = list.filter((r) => r.items?.some((i) => i.category === categoryFilter))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        (r.employee?.full_name ?? '').toLowerCase().includes(q)
      )
    }
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date')     cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortKey === 'title')    cmp = a.title.localeCompare(b.title)
      if (sortKey === 'employee') cmp = (a.employee?.full_name ?? '').localeCompare(b.employee?.full_name ?? '')
      if (sortKey === 'status')   cmp = a.status.localeCompare(b.status)
      if (sortKey === 'amount')   cmp = a.total_amount - b.total_amount
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [all, activeTab, timeFilter, categoryFilter, searchQuery, sortKey, sortDir])

  const totalSpend = all.reduce((s, r) => s + r.total_amount, 0)
  const pendingCount = all.filter((r) => r.status === 'submitted' || r.status === 'under_review').length
  const approvedSpend = all.filter((r) => r.status === 'approved').reduce((s, r) => s + r.total_amount, 0)
  const violationsCount = all.filter((r) => r.has_violations).length

  const filteredTotal = reports.reduce((s, r) => s + r.total_amount, 0)
  const filteredPending = reports.filter((r) => r.status === 'submitted' || r.status === 'under_review').length
  const filteredFlagged = reports.filter((r) => r.has_violations).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">Expense Reports</h1>
          <p className="text-[13px] text-ink-3 mt-0.5">Real-time monitoring of organizational spend and approvals.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(reports)}
            className="flex items-center gap-1.5 px-3 py-2 border border-edge rounded-lg text-sm font-medium text-ink-2 hover:bg-surface-hover transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
          <Link to="/expenses/new" className="btn-primary">
            <Plus size={16} /> New Report
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Total Spend</p>
          <p className="text-2xl font-bold text-brand-600 tabular-nums">{currency(totalSpend)}</p>
          <p className="text-xs text-ink-3 mt-1">{all.length} total reports</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-400 tabular-nums">{String(pendingCount).padStart(2, '0')}</p>
          <p className="text-xs text-ink-3 mt-1">Awaiting review</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Approved</p>
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">{currency(approvedSpend)}</p>
          <p className="text-xs text-ink-3 mt-1">{all.filter((r) => r.status === 'approved').length} reports</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Flagged Policy</p>
          <p className="text-2xl font-bold text-red-400 tabular-nums">{String(violationsCount).padStart(2, '0')}</p>
          <p className="text-xs text-ink-3 mt-1">Policy breaches</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by title or employee…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 border border-edge rounded-lg text-sm bg-surface-1 text-ink placeholder:text-ink-3
                     focus:outline-none focus:border-brand-600/60 focus:ring-2 focus:ring-brand-600/15 transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Tab strip */}
        <div className="flex border border-edge rounded-lg overflow-hidden bg-surface-1 flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === tab ? 'bg-brand-600 text-white' : 'text-ink-2 hover:bg-surface-hover'
              }`}
            >
              {tab === 'all' ? `All (${all.length})` : tab}
            </button>
          ))}
        </div>

        {/* Time filter */}
        <div className="flex gap-1 ml-auto">
          {TIME_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeFilter === t ? 'bg-surface-2 text-ink border border-edge-hi' : 'text-ink-3 hover:bg-surface-hover'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Category dropdown */}
        <div className="relative">
          <button
            onClick={() => setCatOpen(!catOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-edge rounded-lg text-xs font-medium text-ink-2 hover:bg-surface-hover transition-colors"
          >
            <Filter size={12} />
            Category: {categoryFilter === 'all' ? 'All' : categoryFilter}
            <ChevronDown size={11} />
          </button>
          {catOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCatOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-surface-2 border border-edge-hi rounded-xl z-20 py-1 min-w-[140px]">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategoryFilter(cat); setCatOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-sm capitalize hover:bg-surface-hover transition-colors ${
                      categoryFilter === cat ? 'text-brand-600 font-semibold' : 'text-ink-2'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner className="h-64" />
      ) : reports.length === 0 ? (
        <div className="card">
          <EmptyState
            variant="expenses"
            title="No expense reports found"
            description="Try adjusting your filters or create a new report"
            action={<Link to="/expenses/new" className="btn-primary gap-2"><Plus size={15} /> New Report</Link>}
          />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-0 border-b border-edge">
              <tr>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort('date')} className="flex items-center font-semibold text-ink-2 hover:text-ink transition-colors">
                    Date <SortIcon col="date" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort('title')} className="flex items-center font-semibold text-ink-2 hover:text-ink transition-colors">
                    Title <SortIcon col="title" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort('employee')} className="flex items-center font-semibold text-ink-2 hover:text-ink transition-colors">
                    Employee <SortIcon col="employee" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-ink-2">Category</th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort('status')} className="flex items-center font-semibold text-ink-2 hover:text-ink transition-colors">
                    Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-right px-4 py-3">
                  <button onClick={() => handleSort('amount')} className="flex items-center ml-auto font-semibold text-ink-2 hover:text-ink transition-colors">
                    Amount <SortIcon col="amount" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {reports.map((r: ExpenseReport) => {
                const cat = r.items?.[0]?.category ?? 'other'
                const catStyle = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other
                return (
                  <tr key={r.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 text-ink-3 text-xs whitespace-nowrap">{date(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/expenses/${r.id}`} className="font-medium text-ink hover:text-brand-600 transition-colors">
                        <Highlight text={r.title} query={searchQuery} />
                      </Link>
                      {r.has_violations && (
                        <AlertTriangle size={11} className="inline ml-1.5 text-amber-400" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${avatarColor(r.employee?.full_name)}`}>
                          {initials(r.employee?.full_name)}
                        </div>
                        <span className="text-ink-2 text-xs truncate max-w-[120px]"><Highlight text={r.employee?.full_name ?? 'You'} query={searchQuery} /></span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${catStyle}`}>
                        {cat}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">{currency(r.total_amount)}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'draft' && (
                        <button
                          onClick={() => { if (confirm('Delete this draft?')) deleteMutation.mutate(r.id) }}
                          className="text-ink-3 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Footer summary bar */}
          <div className="px-4 py-3 bg-surface-0 border-t border-edge flex items-center gap-6 text-xs text-ink-3">
            <span>Showing <strong className="text-ink">{reports.length}</strong> of <strong className="text-ink">{all.length}</strong> reports</span>
            <span className="ml-auto">Total: <strong className="text-ink tabular-nums">{currency(filteredTotal)}</strong></span>
            {filteredPending > 0 && <span className="text-amber-400 font-medium">{filteredPending} pending approval</span>}
            {filteredFlagged > 0 && <span className="text-red-400 font-medium">{filteredFlagged} flagged</span>}
          </div>
        </div>
      )}
    </div>
  )
}
