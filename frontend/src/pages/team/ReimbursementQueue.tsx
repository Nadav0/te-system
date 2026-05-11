import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendingUp, AlertTriangle, Download, Info, CheckCircle } from 'lucide-react'
import { listReimbursementQueue, markPaid, listExpenses } from '../../api/expenses'
import { currency } from '../../utils/format'
import type { ExpenseReport } from '../../types'
import Spinner from '../../components/Spinner'

function exportSelectedCSV(reports: ExpenseReport[], selected: Set<string>) {
 const rows = [
 ['Employee', 'Email', 'Department', 'Report', 'Amount', 'Currency'],
 ...reports
 .filter((r) => selected.has(r.id))
 .map((r) => [
 r.employee?.full_name ?? '',
 r.employee?.email ?? '',
 r.employee?.department ?? '',
 r.title,
 String(r.total_amount),
 r.currency,
 ]),
 ]
 const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
 const blob = new Blob([csv], { type: 'text/csv' })
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url; a.download = 'reimbursements.csv'; a.click()
 URL.revokeObjectURL(url)
}

export default function ReimbursementQueue() {
 const qc = useQueryClient()
 const [activeTab, setActiveTab] = useState<'reimburse' | 'flagged'>('reimburse')
 const [selected, setSelected] = useState<Set<string>>(new Set())
 const [justPaid, setJustPaid] = useState<Set<string>>(new Set())

 const { data: queue = [], isLoading: qLoading } = useQuery<ExpenseReport[]>({
 queryKey: ['reimbursement-queue'],
 queryFn: listReimbursementQueue,
 })

 const { data: flaggedRaw = [], isLoading: fLoading } = useQuery<ExpenseReport[]>({
 queryKey: ['expenses', 'approved'],
 queryFn: () => listExpenses('approved'),
 })

 const flagged = (flaggedRaw as ExpenseReport[]).filter((r) => r.has_violations && !r.paid_at)

 const [markPaidError, setMarkPaidError] = useState('')
 const [processing, setProcessing] = useState(false)

 const markPaidMutation = useMutation({
 mutationFn: (id: string) => markPaid(id),
 onSuccess: (_, id) => {
 setJustPaid((prev) => new Set(prev).add(id))
 setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
 qc.invalidateQueries({ queryKey: ['reimbursement-queue'] })
 qc.invalidateQueries({ queryKey: ['expenses'] })
 qc.invalidateQueries({ queryKey: ['analytics'] })
 },
 onError: () => setMarkPaidError('Failed to mark as paid. Please try again.'),
 })

 const processSelected = async () => {
 setProcessing(true)
 setMarkPaidError('')
 try {
 for (const id of Array.from(selected)) {
 await markPaid(id)
 setJustPaid((prev) => new Set(prev).add(id))
 }
 setSelected(new Set())
 qc.invalidateQueries({ queryKey: ['reimbursement-queue'] })
 qc.invalidateQueries({ queryKey: ['expenses'] })
 qc.invalidateQueries({ queryKey: ['analytics'] })
 } catch {
 setMarkPaidError('Some payments failed to process. Please retry.')
 } finally {
 setProcessing(false)
 }
 }

 const isLoading = qLoading || fLoading
 if (isLoading) return <Spinner className="h-96" />

 const pendingTotal = (queue as ExpenseReport[]).reduce((sum, r) => sum + r.total_amount, 0)
 const selectedTotal = (queue as ExpenseReport[])
 .filter((r) => selected.has(r.id))
 .reduce((sum, r) => sum + r.total_amount, 0)

 const toggleSelect = (id: string) =>
 setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

 const items = activeTab === 'reimburse' ? (queue as ExpenseReport[]) : flagged

 return (
 <div className="p-8 pb-28">
 <div className="mb-6">
 <h1 className="text-xl font-semibold text-ink tracking-tight">Reimbursement Queue</h1>
 <p className="text-sm text-ink-3 mt-1">
 Review and process employee expense claims across the enterprise.
 </p>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-3 gap-4 mb-6">
 <div className="bg-surface-1 border border-edge rounded-lg p-5">
 <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">Pending Reimbursement</p>
 <p className="text-2xl font-bold text-ink">{currency(pendingTotal)}</p>
 <p className="text-xs text-ink-3 mt-1">{queue.length} reports approved &amp; unpaid</p>
 </div>
 <div className="bg-surface-1 border border-edge rounded-lg p-5">
 <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">Flagged Violations</p>
 <p className="text-2xl font-bold text-red-600">{flagged.length}</p>
 <p className="text-xs text-red-500 mt-1">{flagged.length > 0 ? 'Requires immediate audit' : 'All clear'}</p>
 </div>
 <div className="rounded-lg p-5 bg-brand-600">
 <p className="text-xs font-semibold text-brand-200 uppercase tracking-wider mb-2">Queue Velocity</p>
 <p className="text-2xl font-bold text-white">
 {queue.length === 0 ? '—' : `${queue.length} pending`}
 </p>
 <div className="mt-2 h-1.5 bg-brand-400 rounded overflow-hidden">
 <div className="h-full bg-surface-1 rounded" style={{ width: queue.length > 0 ? '65%' : '0%' }} />
 </div>
 </div>
 </div>

 {/* Tabs */}
 <div className="border-b border-edge mb-4">
 <div className="flex">
 <button
 onClick={() => setActiveTab('reimburse')}
 className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'reimburse' ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-3 hover:text-ink-2'}`}
 >
 TO REIMBURSE ({queue.length})
 </button>
 <button
 onClick={() => setActiveTab('flagged')}
 className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'flagged' ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-3 hover:text-ink-2'}`}
 >
 FLAGGED VIOLATIONS ({flagged.length})
 </button>
 </div>
 </div>

 {/* Table */}
 <div className="bg-surface-1 border border-edge rounded-lg overflow-hidden mb-4">
 {items.length === 0 ? (
 <div className="p-12 text-center text-ink-3">
 <CheckCircle size={36} className="mx-auto mb-3 text-ink-3" />
 <p className="font-semibold text-ink-3">
 {activeTab === 'reimburse' ? 'No pending reimbursements' : 'No flagged violations'}
 </p>
 <p className="text-sm mt-1">
 {activeTab === 'reimburse' ? 'All approved expenses have been paid.' : 'All approved reports are clean.'}
 </p>
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-edge">
 {activeTab === 'reimburse' && <th className="w-8 px-4 py-3" />}
 <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wider">Employee</th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wider">Report</th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wider">Amount</th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wider">Currency</th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wider">Dept</th>
 <th className="text-right px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-edge">
 {items.map((item) => {
 const paid = justPaid.has(item.id)
 return (
 <tr key={item.id} className={`hover:bg-surface-hover ${paid ? 'opacity-40' : ''}`}>
 {activeTab === 'reimburse' && (
 <td className="px-4 py-4">
 <input
 type="checkbox"
 checked={selected.has(item.id)}
 onChange={() => toggleSelect(item.id)}
 disabled={paid}
 className="w-4 h-4 rounded border-edge-hi accent-indigo-600"
 />
 </td>
 )}
 <td className="px-4 py-4">
 <div>
 <p className="font-semibold text-ink">{item.employee?.full_name ?? '—'}</p>
 <p className="text-xs text-ink-3">{item.employee?.email ?? ''}</p>
 </div>
 </td>
 <td className="px-4 py-4">
 <p className="text-ink">{item.title}</p>
 {item.has_violations && (
 <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
 <AlertTriangle size={10} /> HAS VIOLATIONS
 </p>
 )}
 </td>
 <td className="px-4 py-4 font-semibold text-ink">
 {currency(item.total_amount)}
 </td>
 <td className="px-4 py-4">
 <span className="px-2 py-0.5 border border-edge-hi text-xs font-semibold text-ink-2 rounded">
 {item.currency}
 </span>
 </td>
 <td className="px-4 py-4 text-ink-2">{item.employee?.department ?? '—'}</td>
 <td className="px-4 py-4 text-right">
 {paid ? (
 <span className="text-xs text-green-600 font-semibold flex items-center justify-end gap-1">
 <CheckCircle size={13} /> PAID
 </span>
 ) : (
 <button
 onClick={() => markPaidMutation.mutate(item.id)}
 disabled={markPaidMutation.isPending}
 className="bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-brand-700 transition-colors disabled:opacity-50"
 >
 MARK AS PAID
 </button>
 )}
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 )}
 </div>

 {markPaidError && (
 <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
 {markPaidError}
 </div>
 )}

 {/* Admin Note */}
 <div className="bg-surface-1 border border-edge rounded-lg p-4 flex gap-3">
 <Info size={16} className="text-ink-3 mt-0.5 flex-shrink-0" />
 <div>
 <p className="text-sm font-semibold text-ink">Administrative Note</p>
 <p className="text-sm text-ink-3 mt-0.5">
 A mandatory override reason is required for any flagged violations. All processed
 payments will be batched at 5:00 PM EST daily for bank transfer.
 </p>
 </div>
 </div>

 {/* Bottom selection bar */}
 {selected.size > 0 && (
 <div className="fixed bottom-0 left-[220px] right-0 bg-surface-1 border-t border-edge px-8 py-4 flex items-center justify-between z-20">
 <p className="text-sm font-semibold text-ink">
 {selected.size} items selected &nbsp;&nbsp; Total: {currency(selectedTotal)}
 </p>
 <div className="flex gap-3">
 <button
 onClick={() => exportSelectedCSV(queue as ExpenseReport[], selected)}
 className="flex items-center gap-2 px-4 py-2 border border-edge-hi text-sm font-semibold text-ink-2 rounded hover:bg-surface-hover transition-colors"
 >
 <Download size={14} /> EXPORT TO CSV
 </button>
 <button
 onClick={processSelected}
 disabled={processing}
 className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded hover:bg-brand-700 transition-colors disabled:opacity-50"
 >
 {processing ? 'PROCESSING…' : 'PROCESS SELECTED'}
 </button>
 </div>
 </div>
 )}
 </div>
 )
}
