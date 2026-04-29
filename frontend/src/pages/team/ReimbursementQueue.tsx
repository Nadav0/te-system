import { useState } from 'react'
import { TrendingUp, AlertTriangle, Download, Info } from 'lucide-react'
import { currency } from '../../utils/format'

const QUEUE_ITEMS = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    email: 'sarah.j@company.com',
    dept: 'Engineering',
    amount: 1240.0,
    category: 'TRAVEL',
    approvedBy: 'Marcus Aurelius',
    duplicate: false,
  },
  {
    id: 2,
    name: 'David Chen',
    email: 'd.chen@company.com',
    dept: 'Product',
    amount: 45.5,
    category: 'MEALS',
    approvedBy: 'Lena Meyer',
    duplicate: true,
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    email: 'e.rodriguez@company.com',
    dept: 'Marketing',
    amount: 3820.12,
    category: 'SOFTWARE',
    approvedBy: 'Marcus Aurelius',
    duplicate: false,
  },
]

export default function ReimbursementQueue() {
  const [activeTab, setActiveTab] = useState<'reimburse' | 'flagged'>('reimburse')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const totalSelected = QUEUE_ITEMS.filter((i) => selected.has(i.id)).reduce(
    (sum, i) => sum + i.amount,
    0
  )

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="p-8 pb-28">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reimbursement Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and process employee expense claims across the enterprise.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Pending Reimbursement
          </p>
          <p className="text-2xl font-bold text-gray-900">$142,502</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp size={11} /> 12% vs last month
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Flagged Violations
          </p>
          <p className="text-2xl font-bold text-red-600">24</p>
          <p className="text-xs text-red-500 mt-1">Requires immediate audit</p>
        </div>
        <div className="bg-black rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Queue Velocity
          </p>
          <p className="text-2xl font-bold text-white">4.2 Days Avg.</p>
          <div className="mt-2 h-1.5 bg-gray-700 rounded overflow-hidden">
            <div className="h-full bg-white rounded" style={{ width: '65%' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab('reimburse')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'reimburse'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            TO REIMBURSE (14)
          </button>
          <button
            onClick={() => setActiveTab('flagged')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'flagged'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            FLAGGED VIOLATIONS (24)
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Employee
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Dept
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Category
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Approved By
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {QUEUE_ITEMS.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 rounded border-gray-300 accent-black"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-600">{item.dept}</td>
                <td className="px-4 py-4 font-semibold text-gray-900">
                  ${item.amount.toFixed(2)}
                </td>
                <td className="px-4 py-4">
                  <span className="px-2 py-0.5 border border-gray-300 text-xs font-semibold text-gray-700 rounded">
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="text-gray-700">{item.approvedBy}</p>
                  {item.duplicate && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                      <AlertTriangle size={10} /> POSSIBLE DUPLICATE
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  <button className="bg-black text-white text-xs font-semibold px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                    MARK AS PAID
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admin Note */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex gap-3">
        <Info size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-900">Administrative Note</p>
          <p className="text-sm text-gray-500 mt-0.5">
            A mandatory override reason is required for any flagged violations. All processed
            payments will be batched at 5:00 PM EST daily for bank transfer.
          </p>
        </div>
      </div>

      {/* Bottom selection bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-60 right-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between z-20">
          <p className="text-sm font-semibold text-gray-900">
            {selected.size} items selected &nbsp;&nbsp; Total: {currency(totalSelected)}
          </p>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-semibold text-gray-700 rounded hover:bg-gray-50 transition-colors">
              <Download size={14} /> EXPORT TO CSV
            </button>
            <button className="px-4 py-2 bg-black text-white text-sm font-semibold rounded hover:bg-gray-800 transition-colors">
              PROCESS SELECTED
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
