import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Search, X, ChevronUp, ChevronDown, ChevronsUpDown, Plane, XCircle } from 'lucide-react'
import { listTravel, deleteTravel } from '../../api/travel'
import { currency, date } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import type { TravelRequest } from '../../types'

const TAB_MAP: Record<string, string | string[]> = {
  all: '',
  'Pending': ['submitted', 'under_review'],
  'Approved': 'approved',
  'Drafts': 'draft',
  'Rejected': 'rejected',
}
const TABS = Object.keys(TAB_MAP)

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

type SortKey = 'destination' | 'employee' | 'departure' | 'status' | 'budget'

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc' }) {
  if (col !== sortKey) return <ChevronsUpDown size={12} className="text-ink-3/50 ml-1" />
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-brand-600 ml-1" />
    : <ChevronDown size={12} className="text-brand-600 ml-1" />
}

const AVATAR_COLORS = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500']
function avatarColor(name?: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
}
function initials(name?: string) {
  return name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'
}

export default function TravelList() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('departure')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const qc = useQueryClient()

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['travel'],
    queryFn: () => listTravel(),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTravel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['travel'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })

  const all = allRequests as TravelRequest[]

  const filtered = useMemo(() => {
    let list = all
    const statusVal = TAB_MAP[activeTab]
    if (statusVal) {
      const statuses = Array.isArray(statusVal) ? statusVal : [statusVal]
      list = list.filter((r) => statuses.includes(r.status))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((tr) =>
        tr.destination.toLowerCase().includes(q) ||
        (tr.employee?.full_name ?? '').toLowerCase().includes(q) ||
        (tr.purpose ?? '').toLowerCase().includes(q)
      )
    }
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'destination') cmp = a.destination.localeCompare(b.destination)
      if (sortKey === 'employee')    cmp = (a.employee?.full_name ?? '').localeCompare(b.employee?.full_name ?? '')
      if (sortKey === 'departure')   cmp = new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime()
      if (sortKey === 'status')      cmp = a.status.localeCompare(b.status)
      if (sortKey === 'budget')      cmp = a.estimated_budget - b.estimated_budget
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [all, activeTab, searchQuery, sortKey, sortDir])

  // KPI stats
  const totalBudget   = all.reduce((s, r) => s + r.estimated_budget, 0)
  const pendingCount  = all.filter((r) => r.status === 'submitted' || r.status === 'under_review').length
  const approvedCount = all.filter((r) => r.status === 'approved').length
  const approvedBudget = all.filter((r) => r.status === 'approved').reduce((s, r) => s + r.estimated_budget, 0)
  const rejectedCount = all.filter((r) => r.status === 'rejected').length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">Travel Requests</h1>
          <p className="text-sm text-ink-3 mt-0.5">Request pre-approval for business travel.</p>
        </div>
        <Link to="/travel/new" className="btn-primary">
          <Plus size={16} /> New Request
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-brand-600 tabular-nums">{currency(totalBudget)}</p>
          <p className="text-xs text-ink-3 mt-1">{all.length} total requests</p>
        </div>
        <button
          onClick={() => setActiveTab(activeTab === 'Pending' ? 'all' : 'Pending')}
          className={`card p-5 text-left transition-all hover:border-amber-400/40 hover:shadow-md ${activeTab === 'Pending' ? 'ring-2 ring-amber-400/40 border-amber-400/30' : ''}`}
        >
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-400 tabular-nums">{String(pendingCount).padStart(2, '0')}</p>
          <p className="text-xs text-ink-3 mt-1">{activeTab === 'Pending' ? 'Click to clear filter' : 'Click to filter'}</p>
        </button>
        <button
          onClick={() => setActiveTab(activeTab === 'Approved' ? 'all' : 'Approved')}
          className={`card p-5 text-left transition-all hover:border-emerald-400/40 hover:shadow-md ${activeTab === 'Approved' ? 'ring-2 ring-emerald-400/40 border-emerald-400/30' : ''}`}
        >
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Approved</p>
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">{currency(approvedBudget)}</p>
          <p className="text-xs text-ink-3 mt-1">{activeTab === 'Approved' ? 'Click to clear filter' : `${approvedCount} requests`}</p>
        </button>
        <button
          onClick={() => setActiveTab(activeTab === 'Rejected' ? 'all' : 'Rejected')}
          className={`card p-5 text-left transition-all hover:border-red-400/40 hover:shadow-md ${activeTab === 'Rejected' ? 'ring-2 ring-red-400/40 border-red-400/30' : ''}`}
        >
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-400 tabular-nums">{String(rejectedCount).padStart(2, '0')}</p>
          <p className="text-xs text-ink-3 mt-1">{activeTab === 'Rejected' ? 'Click to clear filter' : 'Declined requests'}</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by destination or employee…"
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

      {/* Tab strip — labeled group so it reads as a distinct "Status" filter dimension (Hick's Law) */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider select-none">Status:</span>
        <div className="flex border border-edge rounded-lg overflow-hidden bg-surface-1 w-fit">
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
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner className="h-64" />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            variant="travel"
            title="No travel requests found"
            description="Try adjusting your filters or submit a new request"
            action={<Link to="/travel/new" className="btn-primary gap-2"><Plus size={15} /> New Request</Link>}
          />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-0 border-b border-edge">
              <tr>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort('destination')} className="flex items-center font-semibold text-ink-2 hover:text-ink transition-colors">
                    Destination <SortIcon col="destination" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort('employee')} className="flex items-center font-semibold text-ink-2 hover:text-ink transition-colors">
                    Employee <SortIcon col="employee" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort('departure')} className="flex items-center font-semibold text-ink-2 hover:text-ink transition-colors">
                    Dates <SortIcon col="departure" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort('status')} className="flex items-center font-semibold text-ink-2 hover:text-ink transition-colors">
                    Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-right px-4 py-3">
                  <button onClick={() => handleSort('budget')} className="flex items-center ml-auto font-semibold text-ink-2 hover:text-ink transition-colors">
                    Budget <SortIcon col="budget" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {filtered.map((tr: TravelRequest) => (
                <tr key={tr.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/travel/${tr.id}`} className="flex items-center gap-2 font-medium text-ink hover:text-brand-600 transition-colors">
                      <Plane size={13} className="text-ink-3 flex-shrink-0" />
                      <Highlight text={tr.destination} query={searchQuery} />
                    </Link>
                    <p className="text-xs text-ink-3 mt-0.5 truncate max-w-xs pl-5" title={tr.purpose ?? undefined}>
                      <Highlight text={tr.purpose ?? ''} query={searchQuery} />
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${avatarColor(tr.employee?.full_name)}`}>
                        {initials(tr.employee?.full_name)}
                      </div>
                      <span className="text-ink-2 text-xs truncate max-w-[120px]">
                        <Highlight text={tr.employee?.full_name ?? '—'} query={searchQuery} />
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-3 whitespace-nowrap">
                    {date(tr.departure_date)} → {date(tr.return_date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={tr.status} />
                      {tr.status === 'rejected' && (
                        <span title={tr.review_note ? `Rejected: ${tr.review_note}` : 'Rejected'}>
                          <XCircle size={14} className="text-red-500 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">{currency(tr.estimated_budget)}</td>
                  <td className="px-4 py-3 text-right">
                    {tr.status === 'draft' && (
                      <button
                        onClick={() => { if (confirm('Delete this request?')) deleteMutation.mutate(tr.id) }}
                        className="text-ink-3 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-4 py-3 bg-surface-0 border-t border-edge flex items-center gap-6 text-xs text-ink-3">
            <span>Showing <strong className="text-ink">{filtered.length}</strong> of <strong className="text-ink">{all.length}</strong> requests</span>
            <span className="ml-auto">
              Total: <strong className="text-ink tabular-nums">{currency(filtered.reduce((s, r) => s + r.estimated_budget, 0))}</strong>
            </span>
            {filtered.filter((r) => r.status === 'submitted' || r.status === 'under_review').length > 0 && (
              <span className="text-amber-400 font-medium">
                {filtered.filter((r) => r.status === 'submitted' || r.status === 'under_review').length} pending approval
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
