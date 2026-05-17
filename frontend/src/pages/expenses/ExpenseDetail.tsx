import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Upload, AlertTriangle, ChevronLeft, CheckCircle, XCircle, PartyPopper } from 'lucide-react'
import {
 getExpense, addItem, deleteItem, deleteExpense, submitExpense, reviewExpense, uploadReceipt,
} from '../../api/expenses'
import { useAuthStore } from '../../store/auth'
import { currency, date, categoryLabel } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'
import { useToast } from '../../components/Toast'
import type { ExpenseItem } from '../../types'

const CATEGORIES = ['meals', 'transport', 'lodging', 'conference', 'other']

const itemSchema = z.object({
 date: z.string().min(1, 'Date required'),
 category: z.enum(['meals', 'transport', 'lodging', 'conference', 'other']),
 description: z.string().min(1, 'Description required'),
 amount: z.number().positive('Must be > 0'),
})
type ItemForm = z.infer<typeof itemSchema>

export default function ExpenseDetail() {
 const { id } = useParams<{ id: string }>()
 const navigate = useNavigate()
 const location = useLocation()
 const user = useAuthStore((s) => s.user)!
 const qc = useQueryClient()
 const toast = useToast()
 const justSubmitted = (location.state as any)?.submitted === true

 const [showItemForm, setShowItemForm] = useState(false)
 const [confirmDelete, setConfirmDelete] = useState(false)
 const [reviewNote, setReviewNote] = useState('')
 const [reviewError, setReviewError] = useState('')
 const [uploadingItemId, setUploadingItemId] = useState<string | null>(null)
 const [uploadError, setUploadError] = useState('')

 const { data: report, isLoading } = useQuery({
 queryKey: ['expense', id],
 queryFn: () => getExpense(id!),
 enabled: !!id,
 })

 const invalidate = () => {
 qc.invalidateQueries({ queryKey: ['expense', id] })
 qc.invalidateQueries({ queryKey: ['expenses'] })
 }

 const addItemMutation = useMutation({ mutationFn: (d: ItemForm) => addItem(id!, d), onSuccess: invalidate })
 const deleteItemMutation = useMutation({ mutationFn: (itemId: string) => deleteItem(id!, itemId), onSuccess: invalidate })
 const deleteReportMutation = useMutation({
 mutationFn: () => deleteExpense(id!),
 onSuccess: () => {
 qc.invalidateQueries({ queryKey: ['expenses'] })
 navigate('/expenses')
 },
 })
 const submitMutation = useMutation({ mutationFn: () => submitExpense(id!), onSuccess: invalidate })
 const reviewMutation = useMutation({
 mutationFn: ({ action }: { action: 'approve' | 'reject' }) =>
 reviewExpense(id!, action, reviewNote || undefined),
 onSuccess: (_, vars) => {
   invalidate()
   setReviewNote('')
   setReviewError('')
   const name = report?.employee?.full_name?.split(' ')[0] ?? 'Employee'
   if (vars.action === 'approve') toast(`Approved. ${name} will be notified.`, 'success')
   else toast(`Rejected. ${name} will be notified.`, 'info')
 },
 onError: (e: any) => setReviewError(e.response?.data?.detail ?? 'Failed'),
 })

 const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ItemForm>({
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 resolver: zodResolver(itemSchema) as any,
 defaultValues: { category: 'meals', date: new Date().toISOString().split('T')[0] },
 })

 const onAddItem = async (data: ItemForm) => {
 await addItemMutation.mutateAsync(data)
 reset({ category: 'meals', date: new Date().toISOString().split('T')[0] })
 setShowItemForm(false)
 }

 const handleReceiptUpload = async (itemId: string, file: File) => {
 setUploadingItemId(itemId)
 setUploadError('')
 try {
 await uploadReceipt(id!, itemId, file)
 invalidate()
 } catch {
 setUploadError('Upload failed. Please try again.')
 } finally {
 setUploadingItemId(null)
 }
 }

 if (isLoading) return <Spinner className="h-96" />
 if (!report) return <div className="p-8 text-ink-3">Report not found</div>

 const canEdit = report.status === 'draft' && report.employee_id === user.id
 const canReview = (user.role === 'manager' || user.role === 'finance') &&
 (report.status === 'submitted' || report.status === 'under_review')

 return (
 <div className="p-8 max-w-4xl">
 <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-ink-3 hover:text-ink mb-4">
 <ChevronLeft size={16} /> Back to Expenses
 </button>

 {/* Post-submit success banner */}
 {justSubmitted && (
   <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
     <PartyPopper size={18} className="text-emerald-500 flex-shrink-0" />
     <div>
       <p className="text-sm font-semibold text-ink">Report submitted for approval!</p>
       <p className="text-xs text-ink-3 mt-0.5">Your manager has been notified and will review it shortly.</p>
     </div>
   </div>
 )}

 <PageHeader
 title={report.title}
 subtitle={`${report.employee?.full_name ?? 'You'} · Created ${date(report.created_at)}`}
 actions={
 <div className="flex items-center gap-3">
 <StatusBadge status={report.status} />
 {canEdit && !showItemForm && (
 <button className="btn-secondary" onClick={() => setShowItemForm(true)}>
 <Plus size={15} /> Add Item
 </button>
 )}
 {canEdit && report.items.length > 0 && (
 <button
 className="btn-primary"
 onClick={() => submitMutation.mutate()}
 disabled={submitMutation.isPending}
 >
 {submitMutation.isPending ? 'Submitting…' : 'Submit for Approval'}
 </button>
 )}
 {canEdit && (
 confirmDelete ? (
 <div className="flex items-center gap-2">
 <span className="text-xs text-ink-3">Delete this report?</span>
 <button
 className="btn-danger"
 onClick={() => deleteReportMutation.mutate()}
 disabled={deleteReportMutation.isPending}
 >
 {deleteReportMutation.isPending ? 'Deleting…' : 'Yes, delete'}
 </button>
 <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
 </div>
 ) : (
 <button className="btn-danger" onClick={() => setConfirmDelete(true)} disabled={deleteReportMutation.isPending}>
 <Trash2 size={15} /> Delete
 </button>
 )
 )}
 </div>
 }
 />

 {/* Summary */}
 <div className="grid grid-cols-3 gap-4 mb-6">
 <div className="card py-4">
 <p className="text-xs text-ink-3 mb-1">Total Amount</p>
 <p className="text-2xl font-bold text-ink">{currency(report.total_amount, report.currency)}</p>
 </div>
 <div className="card py-4">
 <p className="text-xs text-ink-3 mb-1">Items</p>
 <p className="text-2xl font-bold text-ink">{report.items.length}</p>
 </div>
 <div className="card py-4">
 <p className="text-xs text-ink-3 mb-1">Policy Violations</p>
 <p className={`text-2xl font-bold ${report.has_violations ? 'text-amber-600' : 'text-green-600'}`}>
 {report.items.filter((i: ExpenseItem) => i.policy_violation).length}
 </p>
 </div>
 </div>

 {/* Review note */}
 {report.review_note && (
 <div className={`mb-6 p-4 rounded-lg border ${report.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
 <p className="text-sm font-medium text-ink-2 mb-1">Reviewer note ({report.reviewer?.full_name}):</p>
 <p className="text-sm text-ink-2">{report.review_note}</p>
 </div>
 )}

 {/* Add item form */}
 {showItemForm && (
 <div className="card mb-6">
 <h3 className="text-base font-semibold text-ink mb-4">Add Expense Item</h3>
 <form onSubmit={handleSubmit(onAddItem)} className="grid grid-cols-2 gap-4">
 <div>
 <label className="label">Date *</label>
 <input type="date" {...register('date')} className="input" />
 {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
 </div>
 <div>
 <label className="label">Category *</label>
 <select {...register('category')} className="input">
 {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
 </select>
 </div>
 <div className="col-span-2">
 <label className="label">Description *</label>
 <input {...register('description')} className="input" placeholder="Brief description of the expense" />
 {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
 </div>
 <div>
 <label className="label">Amount *</label>
 <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="input" placeholder="0.00" />
 {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
 </div>
 <div className="flex items-end gap-3">
 <button type="submit" className="btn-primary" disabled={isSubmitting}>
 {isSubmitting ? 'Adding…' : 'Add Item'}
 </button>
 <button type="button" className="btn-secondary" onClick={() => setShowItemForm(false)}>Cancel</button>
 </div>
 </form>
 </div>
 )}

 {uploadError && (
 <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
 {uploadError}
 </div>
 )}

 {/* Items table */}
 <div className="card p-0 overflow-hidden mb-6">
 <div className="px-4 py-3 border-b border-edge flex items-center justify-between">
 <h3 className="font-semibold text-ink">Expense Items</h3>
 {report.has_violations && (
 <span className="flex items-center gap-1 text-xs text-amber-600">
 <AlertTriangle size={13} /> Contains policy violations
 </span>
 )}
 </div>
 {report.items.length === 0 ? (
 <p className="text-ink-3 text-sm text-center py-10">No items yet. Add your first expense item.</p>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-surface-0">
 <tr>
 <th className="text-left px-4 py-2.5 text-ink-3 font-medium">Date</th>
 <th className="text-left px-4 py-2.5 text-ink-3 font-medium">Category</th>
 <th className="text-left px-4 py-2.5 text-ink-3 font-medium">Description</th>
 <th className="text-right px-4 py-2.5 text-ink-3 font-medium">Amount</th>
 <th className="px-4 py-2.5 text-ink-3 font-medium text-center">Receipt</th>
 <th className="px-4 py-2.5" />
 </tr>
 </thead>
 <tbody className="divide-y divide-edge">
 {report.items.map((item: ExpenseItem) => (
 <tr key={item.id} className={item.policy_violation ? 'bg-amber-50' : ''}>
 <td className="px-4 py-3 text-ink-2">{date(item.date)}</td>
 <td className="px-4 py-3">
 <span className="capitalize text-ink-2">{item.category}</span>
 </td>
 <td className="px-4 py-3">
 <p className="text-ink">{item.description}</p>
 {item.policy_violation && (
 <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
 <AlertTriangle size={11} /> {item.violation_detail}
 </p>
 )}
 </td>
 <td className="px-4 py-3 text-right font-semibold text-ink">{currency(item.amount)}</td>
 <td className="px-4 py-3 text-center">
 {item.receipt_url ? (
 <a href={item.receipt_url} target="_blank" rel="noopener noreferrer"
 className="text-brand-600 text-xs hover:underline">View</a>
 ) : canEdit ? (
 uploadingItemId === item.id ? (
 <span className="text-xs text-ink-3">Uploading…</span>
 ) : (
 <label className="cursor-pointer text-ink-3 hover:text-brand-600 transition-colors">
 <Upload size={14} />
 <input type="file" className="hidden" accept="image/*,.pdf"
 onChange={(e) => {
 const f = e.target.files?.[0]
 if (f) handleReceiptUpload(item.id, f)
 }} />
 </label>
 )
 ) : (
 <span className="text-ink-3 text-xs">—</span>
 )}
 </td>
 <td className="px-4 py-3">
 {canEdit && (
 <button
 onClick={() => deleteItemMutation.mutate(item.id)}
 className="text-ink-3 hover:text-red-500 transition-colors"
 >
 <Trash2 size={14} />
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 <tfoot className="bg-surface-0 border-t border-edge">
 <tr>
 <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-ink-2 text-right">Total</td>
 <td className="px-4 py-2.5 text-right font-bold text-ink">{currency(report.total_amount, report.currency)}</td>
 <td colSpan={2} />
 </tr>
 </tfoot>
 </table>
 )}
 </div>

 {/* Review panel */}
 {canReview && (
 <div className="card">
 <h3 className="font-semibold text-ink mb-4">Review This Report</h3>
 <textarea
 value={reviewNote}
 onChange={(e) => setReviewNote(e.target.value)}
 className="input mb-4 resize-none"
 rows={3}
 placeholder="Optional note to the employee…"
 />
 {reviewError && <p className="text-red-500 text-xs mb-3">{reviewError}</p>}
 <div className="flex gap-3">
 <button
 className="btn-success"
 onClick={() => reviewMutation.mutate({ action: 'approve' })}
 disabled={reviewMutation.isPending}
 >
 <CheckCircle size={15} /> Approve
 </button>
 <button
 className="btn-danger"
 onClick={() => reviewMutation.mutate({ action: 'reject' })}
 disabled={reviewMutation.isPending}
 >
 <XCircle size={15} /> Reject
 </button>
 </div>
 </div>
 )}
 </div>
 )
}
