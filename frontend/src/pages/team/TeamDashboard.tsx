import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { UserCheck, Info, X } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { getSummary, getRecentActivity } from '../../api/analytics'
import { listExpenses } from '../../api/expenses'
import { currency } from '../../utils/format'
import Spinner from '../../components/Spinner'

function timeAgo(iso: string): string {
 const diff = Date.now() - new Date(iso).getTime()
 const mins = Math.floor(diff / 60000)
 if (mins < 1) return 'Just now'
 if (mins < 60) return `${mins} min ago`
 const hrs = Math.floor(mins / 60)
 if (hrs < 24) return `${hrs}h ago`
 const days = Math.floor(hrs / 24)
 if (days === 1) return 'Yesterday'
 return `${days} days ago`
}

function DelegateModal({ onClose }: { onClose: () => void }) {
 const [delegateTo, setDelegateTo] = useState('')
 const [until, setUntil] = useState('')
 const [saved, setSaved] = useState(false)

 const handleSave = () => {
  if (!delegateTo.trim()) return
  setSaved(true)
  setTimeout(onClose, 1200)
 }

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
   <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />
   <div className="relative bg-surface-1 border border-edge-hi rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
     <h2 className="text-base font-bold text-ink">Delegate Approvals</h2>
     <button onClick={onClose} className="text-ink-3 hover:text-ink p-1 rounded-lg hover:bg-surface-hover transition-colors">
      <X size={16} />
     </button>
    </div>
    {saved ? (
     <div className="px-6 py-10 text-center">
      <UserCheck size={36} className="mx-auto mb-3 text-green-500" />
      <p className="text-base font-bold text-ink">Delegation saved</p>
      <p className="text-sm text-ink-3 mt-1">Approvals delegated to {delegateTo}</p>
     </div>
    ) : (
     <div className="p-6 space-y-4">
      <p className="text-sm text-ink-3">Temporarily transfer your approval authority to another manager while you are unavailable.</p>
      <div>
       <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Delegate to (email or name)</label>
       <input
        type="text"
        value={delegateTo}
        onChange={(e) => setDelegateTo(e.target.value)}
        placeholder="e.g. sarah.finance@company.com"
        className="w-full px-3 py-2.5 border border-edge-hi rounded text-sm focus:outline-none focus:border-brand-600"
       />
      </div>
      <div>
       <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Delegate until</label>
       <input
        type="date"
        value={until}
        onChange={(e) => setUntil(e.target.value)}
        className="w-full px-3 py-2.5 border border-edge-hi rounded text-sm focus:outline-none focus:border-brand-600"
       />
      </div>
      <div className="flex gap-3 pt-2">
       <button onClick={onClose} className="flex-1 py-2.5 border border-edge text-sm font-semibold text-ink-2 rounded hover:bg-surface-hover transition-colors">Cancel</button>
       <button
        onClick={handleSave}
        disabled={!delegateTo.trim()}
        className="flex-1 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded hover:bg-brand-700 transition-colors disabled:opacity-40"
       >
        Save Delegation
       </button>
      </div>
     </div>
    )}
   </div>
  </div>
 )
}

export default function TeamDashboard() {
 const user = useAuthStore((s) => s.user)!
 const navigate = useNavigate()
 const [delegateOpen, setDelegateOpen] = useState(false)
 const now = new Date()
 const quarter = Math.ceil((now.getMonth() + 1) / 3)
 const fiscalLabel = `Q${quarter} ${now.getFullYear()}`

 const { data: summary, isLoading: sl } = useQuery({
 queryKey: ['analytics', 'summary'],
 queryFn: getSummary,
 })
 const { data: expenses = [], isLoading: el } = useQuery({
 queryKey: ['expenses'],
 queryFn: () => listExpenses(),
 })
 const { data: recentActivity = [], isLoading: al } = useQuery({
 queryKey: ['analytics', 'recent-activity'],
 queryFn: () => getRecentActivity(8),
 })

 if (sl || el || al) return <Spinner className="h-96" />

 const totalSpent = (summary as any)?.total_spend ?? 0
 const totalBudget = (summary as any)?.budget ?? 200000
 const budgetRemaining = Math.max(totalBudget - totalSpent, 0)
 const budgetPercent = Math.min(Math.round((totalSpent / totalBudget) * 100), 100)
 const pendingApprovals = (expenses as any[]).filter(
 (e) => e.status === 'submitted' || e.status === 'under_review'
 ).length

 const budgetBarColor =
 budgetPercent >= 100 ? 'bg-red-600' : budgetPercent >= 80 ? 'bg-amber-500' : 'bg-brand-600'

 const categorySpend: Record<string, number> = (summary as any)?.by_category ?? {}
 const maxCatSpend = Math.max(...Object.values(categorySpend as Record<string, number>), 1)

 return (
 <div className="p-8">
 {/* Header */}
 <div className="flex items-start justify-between mb-8">
 <div>
 <h1 className="text-xl font-semibold text-ink tracking-tight">Team Dashboard</h1>
 <p className="text-sm text-ink-3 mt-1">
 Monitoring expenditure and team compliance for {fiscalLabel}.
 </p>
 </div>
 <button
  onClick={() => setDelegateOpen(true)}
  className="flex items-center gap-2 px-4 py-2 border-2 border-edge-hi text-ink text-sm font-semibold rounded hover:bg-surface-hover transition-colors"
 >
  <UserCheck size={16} />
  Delegate Approvals
 </button>
 {delegateOpen && <DelegateModal onClose={() => setDelegateOpen(false)} />}
 </div>

 {/* Stat cards */}
 <div className="grid grid-cols-3 gap-4 mb-6">
 <div className="bg-surface-1 border border-edge rounded-lg p-5">
 <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">Total Spent</p>
 <p className="text-2xl font-bold text-ink">{currency(totalSpent)}</p>
 </div>
 <div className="bg-surface-1 border border-edge rounded-lg p-5">
 <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">Budget Remaining</p>
 <p className="text-2xl font-bold text-ink">{currency(budgetRemaining)}</p>
 </div>
 <div className="bg-brand-600 rounded-lg p-5">
 <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">Pending Approvals</p>
 <div className="flex items-center gap-2">
 <p className="text-2xl font-bold text-white">{pendingApprovals}</p>
 {pendingApprovals > 0 && <span className="w-2 h-2 rounded-full bg-surface-1" />}
 </div>
 </div>
 </div>

 {/* Department Budget Status */}
 <div className="bg-surface-1 border border-edge rounded-lg p-6 mb-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-xl font-bold text-ink">Department Budget Status</h2>
 <span className="text-sm text-ink-3 border border-edge px-3 py-1 rounded">
 {fiscalLabel} Fiscal Year
 </span>
 </div>
 <div className="flex items-center justify-between text-sm text-ink-2 mb-2">
 <span>{currency(totalSpent)} Spent</span>
 <span>{currency(totalBudget)} Total</span>
 </div>
 <div className="w-full h-9 bg-surface-0 rounded overflow-hidden">
 <div
 className={`h-full ${budgetBarColor} flex items-center justify-end pr-3 transition-all duration-500`}
 style={{ width: `${Math.max(budgetPercent, 3)}%` }}
 >
 <span className="text-white text-sm font-semibold">{budgetPercent}%</span>
 </div>
 </div>
 <p className="text-xs text-ink-3 mt-2 flex items-center gap-1">
 <Info size={12} />
 Budget bar changes visual state at 80% (warning) and 100% (danger)
 </p>
 </div>

 {/* Spend by Category + Recent Activity */}
 <div className="grid grid-cols-5 gap-4">
 <div className="col-span-3 bg-surface-1 border border-edge rounded-lg p-6">
 <h2 className="text-xl font-bold text-ink mb-5">Spend by Category</h2>
 {Object.keys(categorySpend).length === 0 ? (
 <p className="text-sm text-ink-3">No expense data yet.</p>
 ) : (
 <div className="space-y-4">
 {Object.entries(categorySpend).map(([cat, amt]) => (
 <div key={cat} className="flex items-center gap-4">
 <span className="w-32 text-sm text-ink-2 capitalize">{cat}</span>
 <div className="flex-1 h-8 bg-surface-0 rounded overflow-hidden">
 <div
 className="h-full bg-surface-2 rounded transition-all duration-500"
 style={{ width: `${((amt as number) / maxCatSpend) * 100}%` }}
 />
 </div>
 <span className="w-20 text-right text-sm font-semibold text-ink">
 {currency(amt as number)}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="col-span-2 bg-surface-0 border border-edge rounded-lg p-6 flex flex-col">
 <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-4">
 Recent Activity
 </p>
 {(recentActivity as any[]).length === 0 ? (
 <p className="text-sm text-ink-3">No recent activity.</p>
 ) : (
 <div className="space-y-4 flex-1 overflow-y-auto max-h-64">
 {(recentActivity as any[]).map((item: any) => (
 <div key={item.id} className="flex gap-3">
 <span
 className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
 item.status === 'submitted' ? 'bg-brand-600' : item.status === 'approved' ? 'bg-green-500' : item.status === 'rejected' ? 'bg-red-500' : 'bg-edge-hi'
 }`}
 />
 <div>
 <p className="text-sm font-semibold text-ink">{item.title}</p>
 <p className="text-xs text-ink-3">{item.sub}</p>
 <p className="text-xs text-ink-3 mt-0.5">{timeAgo(item.time)}</p>
 </div>
 </div>
 ))}
 </div>
 )}
 <button
  onClick={() => navigate('/reports')}
  className="mt-6 w-full text-sm text-ink-2 border border-edge bg-surface-1 py-2 rounded hover:bg-surface-hover transition-colors"
 >
  View Audit Log
 </button>
 </div>
 </div>
 </div>
 )
}
