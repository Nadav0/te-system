import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Plus } from 'lucide-react'
import { listExpenses } from '../../api/expenses'
import { listTravel } from '../../api/travel'
import { currency, date } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import type { ExpenseReport, TravelRequest } from '../../types'

type Tab = 'expenses' | 'travel'

const EXPENSE_STATUSES = ['', 'submitted', 'under_review', 'approved', 'rejected']
const TRAVEL_STATUSES = ['', 'submitted', 'approved', 'rejected']

export default function ApprovalsPage() {
  const [tab, setTab] = useState<Tab>('expenses')
  const [expenseFilter, setExpenseFilter] = useState('')
  const [travelFilter, setTravelFilter] = useState('')

  const { data: expenses = [], isLoading: el } = useQuery({
    queryKey: ['expenses', expenseFilter],
    queryFn: () => listExpenses(expenseFilter || undefined),
  })

  const { data: travels = [], isLoading: tl } = useQuery({
    queryKey: ['travel', travelFilter],
    queryFn: () => listTravel(travelFilter || undefined),
  })

  const pendingExpenses = (expenses as ExpenseReport[]).filter(
    (e) => e.status === 'submitted' || e.status === 'under_review'
  ).length
  const pendingTravel = (travels as TravelRequest[]).filter(
    (t) => t.status === 'submitted'
  ).length

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and action pending expense reports and travel requests.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/expenses/new"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-semibold text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            <Plus size={14} /> New Expense
          </Link>
          <Link
            to="/travel/new"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold rounded hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} /> New Travel
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex">
          <button
            onClick={() => setTab('expenses')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'expenses'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            EXPENSE REPORTS
            {pendingExpenses > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-black text-white text-xs rounded-full">
                {pendingExpenses}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('travel')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'travel'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            TRAVEL REQUESTS
            {pendingTravel > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-black text-white text-xs rounded-full">
                {pendingTravel}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expense Reports tab */}
      {tab === 'expenses' && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {EXPENSE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setExpenseFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  expenseFilter === s
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                }`}
              >
                {s ? s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
              </button>
            ))}
          </div>

          {el ? (
            <Spinner className="h-48" />
          ) : (expenses as ExpenseReport[]).length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg text-center py-16">
              <p className="text-gray-400 text-sm">No expense reports found.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(expenses as ExpenseReport[]).map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/expenses/${r.id}`}
                          className="font-semibold text-gray-900 hover:underline"
                        >
                          {r.title}
                        </Link>
                        {r.has_violations && (
                          <span className="ml-2 inline-flex items-center gap-1 text-amber-600 text-xs">
                            <AlertTriangle size={11} /> violations
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {r.employee?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{date(r.created_at)}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-800">
                        {currency(r.total_amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          to={`/expenses/${r.id}`}
                          className="text-xs font-semibold px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Travel Requests tab */}
      {tab === 'travel' && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {TRAVEL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setTravelFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  travelFilter === s
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                }`}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              </button>
            ))}
          </div>

          {tl ? (
            <Spinner className="h-48" />
          ) : (travels as TravelRequest[]).length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg text-center py-16">
              <p className="text-gray-400 text-sm">No travel requests found.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(travels as TravelRequest[]).map((tr) => (
                    <tr key={tr.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/travel/${tr.id}`}
                          className="font-semibold text-gray-900 hover:underline"
                        >
                          {tr.destination}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                          {tr.purpose}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {tr.employee?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {date(tr.departure_date)} → {date(tr.return_date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={tr.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-800">
                        {currency(tr.estimated_budget)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          to={`/travel/${tr.id}`}
                          className="text-xs font-semibold px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
