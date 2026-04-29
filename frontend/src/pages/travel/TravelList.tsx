import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { listTravel, deleteTravel } from '../../api/travel'
import { currency, date } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'
import type { TravelRequest } from '../../types'

const STATUSES = ['', 'draft', 'submitted', 'approved', 'rejected']

export default function TravelList() {
  const [filter, setFilter] = useState('')
  const qc = useQueryClient()

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['travel', filter],
    queryFn: () => listTravel(filter || undefined),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTravel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['travel'] }),
  })

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

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
            }`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner className="h-64" />
      ) : requests.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 mb-4">No travel requests found.</p>
          <Link to="/travel/new" className="btn-primary"><Plus size={16} /> Create a request</Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Destination</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Employee</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Dates</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Budget</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((tr: TravelRequest) => (
                <tr key={tr.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/travel/${tr.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {tr.destination}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{tr.purpose}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tr.employee?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {date(tr.departure_date)} → {date(tr.return_date)}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={tr.status} /></td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{currency(tr.estimated_budget)}</td>
                  <td className="px-4 py-3 text-right">
                    {tr.status === 'draft' && (
                      <button
                        onClick={() => { if (confirm('Delete this request?')) deleteMutation.mutate(tr.id) }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
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
