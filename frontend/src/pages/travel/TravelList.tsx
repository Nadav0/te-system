import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Search, X, ChevronUp, ChevronDown, ChevronsUpDown, Plane } from 'lucide-react'
import { listTravel, deleteTravel } from '../../api/travel'
import { currency, date } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'
import type { TravelRequest } from '../../types'

const STATUSES = ['', 'draft', 'submitted', 'approved', 'rejected']

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

export default function TravelList() {
  const [filter, setFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('departure')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const qc = useQueryClient()

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['travel', filter],
    queryFn: () => listTravel(filter || undefined),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTravel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['travel'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })

  const filtered = useMemo(() => {
    let list = requests as TravelRequest[]
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
  }, [requests, searchQuery, sortKey, sortDir])

  return (
    <div className="p-8">
      <PageHeader
        title="Travel Requests"
        subtitle="Request pre-approval for business travel"
        actions={
          <Link to="/travel/new" className="btn-primary">
            <Plus size={16} /> New Request
          </Link>
        }
      />

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

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-brand-600 text-white'
                : 'bg-surface-1 text-ink-2 border border-edge hover:border-brand-300'
            }`}
          >
            {s ? s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner className="h-64" />
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-0 border border-edge flex items-center justify-center mb-4">
            <Plane size={22} className="text-ink-3" />
          </div>
          <p className="text-[14px] font-semibold text-ink-2 mb-1">No travel requests found</p>
          <p className="text-[12px] text-ink-3 mb-5">Try adjusting your filters or submit a new request</p>
          <Link to="/travel/new" className="btn-primary gap-2"><Plus size={15} /> New Request</Link>
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
                    <Link to={`/travel/${tr.id}`} className="font-medium text-ink hover:text-brand-600">
                      <Highlight text={tr.destination} query={searchQuery} />
                    </Link>
                    <p className="text-xs text-ink-3 mt-0.5 truncate max-w-xs"><Highlight text={tr.purpose ?? ''} query={searchQuery} /></p>
                  </td>
                  <td className="px-4 py-3 text-ink-2"><Highlight text={tr.employee?.full_name ?? '—'} query={searchQuery} /></td>
                  <td className="px-4 py-3 text-ink-3">
                    {date(tr.departure_date)} → {date(tr.return_date)}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={tr.status} /></td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{currency(tr.estimated_budget)}</td>
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
        </div>
      )}
    </div>
  )
}
