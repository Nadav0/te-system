import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { listExpenses, deleteExpense } from '../../api/expenses'
import { currency, date } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'
import type { ExpenseReport } from '../../types'

const STATUSES = ['', 'draft', 'submitted', 'under_review', 'approved', 'rejected']

export default function ExpenseList() {
  const [filter, setFilter] = useState('')
  const qc = useQueryClient()

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['expenses', filter],
    queryFn: () => listExpenses(filter || undefined),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })

  return (
    <div className="p-8">
      <PageHeader
        title="Expense Reports"
        subtitle="Submit and track your expense reports"
        actions={
          <Link to="/expenses/new" className="btn-primary">
            <Plus size={16} /> New Report
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
            }`}
          >
            {s ? s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner className="h-64" />
      ) : reports.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 mb-4">No expense reports found.</p>
          <Link to="/expenses/new" className="btn-primary">
            <Plus size={16} /> Create your first report
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Employee</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((r: ExpenseReport) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/expenses/${r.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {r.title}
                    </Link>
                    {r.has_violations && (
                      <span className="ml-2 inline-flex items-center gap-1 text-amber-600 text-xs">
                        <AlertTriangle size={12} /> violations
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.employee?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{date(r.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{currency(r.total_amount)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'draft' && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this draft?')) deleteMutation.mutate(r.id)
                        }}
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
