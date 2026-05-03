import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Upload, AlertTriangle, ChevronLeft, CheckCircle, XCircle } from 'lucide-react'
import {
  getExpense, addItem, deleteItem, deleteExpense, submitExpense, reviewExpense, uploadReceipt,
} from '../../api/expenses'
import { useAuthStore } from '../../store/auth'
import { currency, date, categoryLabel } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'
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
  const user = useAuthStore((s) => s.user)!
  const qc = useQueryClient()

  const [showItemForm, setShowItemForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewError, setReviewError] = useState('')

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
    onSuccess: invalidate,
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
    await uploadReceipt(id!, itemId, file)
    invalidate()
  }

  if (isLoading) return <Spinner className="h-96" />
  if (!report) return <div className="p-8 text-gray-500">Report not found</div>

  const canEdit = report.status === 'draft' && report.employee_id === user.id
  const canReview = (user.role === 'manager' || user.role === 'finance') &&
    (report.status === 'submitted' || report.status === 'under_review')

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ChevronLeft size={16} /> Back to Expenses
      </button>

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
                  <span className="text-xs text-gray-500">Delete this report?</span>
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
                <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
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
          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">{currency(report.total_amount, report.currency)}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-gray-500 mb-1">Items</p>
          <p className="text-2xl font-bold text-gray-900">{report.items.length}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-gray-500 mb-1">Policy Violations</p>
          <p className={`text-2xl font-bold ${report.has_violations ? 'text-amber-600' : 'text-green-600'}`}>
            {report.items.filter((i: ExpenseItem) => i.policy_violation).length}
          </p>
        </div>
      </div>

      {/* Review note */}
      {report.review_note && (
        <div className={`mb-6 p-4 rounded-lg border ${report.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm font-medium text-gray-700 mb-1">Reviewer note ({report.reviewer?.full_name}):</p>
          <p className="text-sm text-gray-600">{report.review_note}</p>
        </div>
      )}

      {/* Add item form */}
      {showItemForm && (
        <div className="card mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Add Expense Item</h3>
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

      {/* Items table */}
      <div className="card p-0 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Expense Items</h3>
          {report.has_violations && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle size={13} /> Contains policy violations
            </span>
          )}
        </div>
        {report.items.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">No items yet. Add your first expense item.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Date</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Category</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Description</th>
                <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Amount</th>
                <th className="px-4 py-2.5 text-gray-500 font-medium text-center">Receipt</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.items.map((item: ExpenseItem) => (
                <tr key={item.id} className={item.policy_violation ? 'bg-amber-50' : ''}>
                  <td className="px-4 py-3 text-gray-600">{date(item.date)}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-gray-700">{item.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800">{item.description}</p>
                    {item.policy_violation && (
                      <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                        <AlertTriangle size={11} /> {item.violation_detail}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{currency(item.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    {item.receipt_url ? (
                      <a href={item.receipt_url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 text-xs hover:underline">View</a>
                    ) : canEdit ? (
                      <label className="cursor-pointer text-gray-400 hover:text-blue-600 transition-colors">
                        <Upload size={14} />
                        <input type="file" className="hidden" accept="image/*,.pdf"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleReceiptUpload(item.id, f)
                          }} />
                      </label>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <button
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-gray-700 text-right">Total</td>
                <td className="px-4 py-2.5 text-right font-bold text-gray-900">{currency(report.total_amount, report.currency)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Review panel */}
      {canReview && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Review This Report</h3>
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
