import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react'
import { createExpense, addItem, deleteItem, submitExpense } from '../../api/expenses'
import { useAuthStore } from '../../store/auth'
import { currency, categoryLabel } from '../../utils/format'
import MotivationBar from '../../components/MotivationBar'
import Select from '../../components/Select'
import type { ExpenseItem } from '../../types'

// ── Schemas ──────────────────────────────────────────────────────────────────

const headerSchema = z.object({
  title:       z.string().min(1, 'Title is required'),
  currency:    z.string().min(1),
  department:  z.string().optional(),
  description: z.string().optional(),
})
type HeaderForm = z.infer<typeof headerSchema>

const itemSchema = z.object({
  date:        z.string().min(1, 'Date required'),
  category:    z.enum(['meals', 'transport', 'lodging', 'conference', 'other']),
  description: z.string().min(1, 'Description required'),
  amount:      z.number().positive('Must be > 0'),
})
type ItemForm = z.infer<typeof itemSchema>

const CATEGORIES = ['meals', 'transport', 'lodging', 'conference', 'other']
const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'ILS', label: 'ILS — Israeli Shekel' },
]
const DEPARTMENTS = [
  'Engineering', 'Marketing', 'Finance', 'Sales', 'Operations',
  'Product', 'Design', 'Legal', 'HR', 'Other',
]

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">
      {children}
    </label>
  )
}

const today = new Date().toISOString().split('T')[0]

// ── Main component ────────────────────────────────────────────────────────────

export default function ExpenseForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  // Show motivation bar only on first expense creation per session
  const [showMotivation] = useState(() => !sessionStorage.getItem('expense_created'))

  // Phase state
  const [reportId, setReportId]     = useState<string | null>(null)
  const [reportMeta, setReportMeta] = useState<{ title: string; currency: string; department: string }>()
  const [items, setItems]           = useState<ExpenseItem[]>([])
  const [runningTotal, setRunningTotal] = useState(0)
  const [headerError, setHeaderError]   = useState('')
  const [itemError, setItemError]       = useState('')
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const descRef = useRef<HTMLInputElement>(null)

  // ── Header form ──────────────────────────────────────────────────────────

  const {
    register: rh,
    handleSubmit: handleHeader,
    watch: watchHeader,
    setValue: setHeaderValue,
    formState: { errors: he, isSubmitting: headerSubmitting, isValid: headerValid },
  } = useForm<HeaderForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(headerSchema) as any,
    mode: 'onChange',
    defaultValues: { currency: 'USD', department: user?.department ?? 'Engineering' },
  })

  const titleVal = watchHeader('title') ?? ''
  const descVal  = watchHeader('description') ?? ''
  const headerConditions = [
    titleVal.trim().length > 0,
    titleVal.trim().length >= 5,
    descVal.trim().length > 0,
    headerValid,
  ]
  const headerProgress = headerConditions.filter(Boolean).length / headerConditions.length
  const headerMsg =
    headerProgress === 0  ? 'Give your report a clear title to get started' :
    headerProgress < 0.5  ? 'Good start — keep going' :
    headerProgress < 0.75 ? 'Looking good!' :
    headerProgress < 1    ? 'Almost ready — add a description' :
                            'All set — continue to add items'

  const onCreateReport = async (data: HeaderForm) => {
    try {
      setHeaderError('')
      const report = await createExpense(data)
      await qc.invalidateQueries({ queryKey: ['expenses'] })
      sessionStorage.setItem('expense_created', '1')
      setReportId(report.id)
      setReportMeta({ title: data.title, currency: data.currency ?? 'USD', department: data.department ?? '' })
      // Focus description in item form after transition
      setTimeout(() => descRef.current?.focus(), 100)
    } catch (e: any) {
      setHeaderError(e.response?.data?.detail ?? 'Failed to create report')
    }
  }

  // ── Item form ────────────────────────────────────────────────────────────

  const {
    register: ri,
    handleSubmit: handleItem,
    reset: resetItem,
    watch: watchItem,
    setValue: setItemValue,
    formState: { errors: ie, isSubmitting: itemSubmitting },
  } = useForm<ItemForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(itemSchema) as any,
    defaultValues: { category: 'meals', date: today },
  })

  const onAddItem = async (data: ItemForm) => {
    if (!reportId) return
    try {
      setItemError('')
      const item = await addItem(reportId, data)
      setItems((prev) => [...prev, item])
      setRunningTotal((prev) => prev + item.amount)
      resetItem({ category: 'meals', date: today })
      setTimeout(() => descRef.current?.focus(), 50)
    } catch (e: any) {
      setItemError(e.response?.data?.detail ?? 'Failed to add item')
    }
  }

  const onDeleteItem = async (item: ExpenseItem) => {
    if (!reportId) return
    setDeletingId(item.id)
    try {
      await deleteItem(reportId, item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      setRunningTotal((prev) => prev - item.amount)
    } finally {
      setDeletingId(null)
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  const onSubmitReport = async () => {
    if (!reportId) return
    setSubmitting(true)
    try {
      await submitExpense(reportId)
      await qc.invalidateQueries({ queryKey: ['expenses'] })
      navigate(`/expenses/${reportId}`)
    } catch (e: any) {
      setItemError(e.response?.data?.detail ?? 'Failed to submit')
      setSubmitting(false)
    }
  }

  // ── Item motivation bar ──────────────────────────────────────────────────

  const itemProgress = Math.min(items.length / 3, 1)
  const itemMsg =
    items.length === 0 ? 'Add your first expense item below' :
    items.length === 1 ? 'Good start — add more items if needed' :
    items.length === 2 ? 'Looking complete — submit when ready!' :
                         'Ready to submit!'

  // ── Phase 1: Header form ─────────────────────────────────────────────────

  if (!reportId) {
    return (
      <div className="p-8 max-w-[1100px]">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-ink tracking-tight">New Expense Report</h1>
          <p className="text-sm text-ink-3 mt-1">Fill in the report details, then add your expense items</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* Form card */}
          <div className="card p-7">
            <form onSubmit={handleHeader(onCreateReport)} className="space-y-6">

              {showMotivation && <MotivationBar progress={headerProgress} message={headerMsg} className="mb-2" />}

              {/* Title */}
              <div>
                <FieldLabel>Report Title *</FieldLabel>
                <input
                  {...rh('title')}
                  className="input"
                  placeholder="e.g. Q2 Conference — Chicago"
                  autoFocus
                />
                {he.title && <p className="text-red-400 text-xs mt-1.5">{he.title.message}</p>}
              </div>

              {/* Currency + Department */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Currency</FieldLabel>
                  <Select
                    options={CURRENCIES}
                    value={watchHeader('currency') ?? 'USD'}
                    onChange={(v) => setHeaderValue('currency', v, { shouldValidate: true })}
                  />
                </div>
                <div>
                  <FieldLabel>Department</FieldLabel>
                  <Select
                    options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                    value={watchHeader('department') ?? ''}
                    onChange={(v) => setHeaderValue('department', v, { shouldValidate: true })}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea
                  {...rh('description')}
                  rows={3}
                  className="input resize-none"
                  placeholder="Brief description of the expense purpose…"
                />
              </div>

              {headerError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">
                  {headerError}
                </div>
              )}

              {/* Actions — primary right, cancel left */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-3 hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={headerSubmitting}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 ${headerProgress === 1 ? 'motivation-ready' : ''}`}
                  style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                >
                  {headerSubmitting ? 'Creating…' : <>Continue to Items <ArrowRight size={15} /></>}
                </button>
              </div>
            </form>
          </div>

          {/* Tips card */}
          <div className="card p-0 overflow-hidden">
            <div className="h-[3px] w-full bg-brand-600 rounded-t-[14px]" />
            <div className="p-6">
              <h3 className="text-base font-semibold text-brand-400 mb-5">Tips</h3>
              <ul className="space-y-4">
                {[
                  'Give your report a clear, descriptive title.',
                  'You\'ll add individual expense items on the next step.',
                  'Policy limits are checked automatically as you add items.',
                  'Submit for approval once all items are added.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-600 flex-shrink-0 mt-[5px]" />
                    <p className="text-xs text-ink-3 leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Phase 2: Add items ────────────────────────────────────────────────────

  const hasViolations = items.some((i) => i.policy_violation)

  return (
    <div className="p-8 max-w-[860px]">

      {/* Report identity strip */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">{reportMeta?.title}</h1>
            <p className="text-sm text-ink-3 mt-0.5">
              {reportMeta?.currency} · {reportMeta?.department || 'No department'} · Draft
            </p>
          </div>
          {/* Running total */}
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-0.5">Total</p>
            <p className="text-3xl font-bold text-ink tabular-nums">
              {currency(runningTotal, reportMeta?.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Motivation bar */}
      {showMotivation && <MotivationBar progress={itemProgress} message={itemMsg} className="mb-6" />}

      {/* Add item form — always open */}
      <div className="card p-6 mb-5">
        <h3 className="text-sm font-semibold text-ink mb-5 flex items-center gap-2">
          <Plus size={15} className="text-brand-600" />
          Add Expense Item
        </h3>
        <form onSubmit={handleItem(onAddItem)} className="space-y-4">

          {/* Row 1: Date + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Date *</FieldLabel>
              <input type="date" {...ri('date')} className="input" />
              {ie.date && <p className="text-red-400 text-xs mt-1">{ie.date.message}</p>}
            </div>
            <div>
              <FieldLabel>Category *</FieldLabel>
              <Select
                options={CATEGORIES.map((c) => ({ value: c, label: categoryLabel(c) }))}
                value={watchItem('category') ?? 'meals'}
                onChange={(v) => setItemValue('category', v as ItemForm['category'], { shouldValidate: true })}
              />
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <FieldLabel>Description *</FieldLabel>
            <input
              {...ri('description')}
              ref={(el) => {
                ri('description').ref(el)
                ;(descRef as React.MutableRefObject<HTMLInputElement | null>).current = el
              }}
              className="input"
              placeholder="Brief description of the expense"
            />
            {ie.description && <p className="text-red-400 text-xs mt-1">{ie.description.message}</p>}
          </div>

          {/* Row 3: Amount + submit */}
          <div className="flex items-end gap-4">
            <div className="w-48">
              <FieldLabel>Amount *</FieldLabel>
              <input
                type="number"
                step="0.01"
                {...ri('amount', { valueAsNumber: true })}
                className="input"
                placeholder="0.00"
              />
              {ie.amount && <p className="text-red-400 text-xs mt-1">{ie.amount.message}</p>}
            </div>
            <button
              type="submit"
              disabled={itemSubmitting}
              className="mb-0 flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Plus size={15} />
              {itemSubmitting ? 'Adding…' : 'Add Item'}
            </button>
          </div>

          {itemError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">
              {itemError}
            </div>
          )}
        </form>
      </div>

      {/* Items list */}
      <div className="card p-0 overflow-hidden mb-6">
        <div className="px-5 py-3.5 border-b border-edge flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">
            Expense Items
            {items.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-brand-600/10 text-brand-600 rounded text-[11px] font-bold">
                {items.length}
              </span>
            )}
          </h3>
          {hasViolations && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <AlertTriangle size={13} /> Policy violations detected
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-3">
              <Plus size={18} className="text-ink-3" />
            </div>
            <p className="text-sm text-ink-3">No items yet — add your first one above</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-0">
              <tr>
                <th className="text-left px-5 py-2.5 text-ink-3 font-medium text-xs">Date</th>
                <th className="text-left px-5 py-2.5 text-ink-3 font-medium text-xs">Category</th>
                <th className="text-left px-5 py-2.5 text-ink-3 font-medium text-xs">Description</th>
                <th className="text-right px-5 py-2.5 text-ink-3 font-medium text-xs">Amount</th>
                <th className="px-5 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {items.map((item) => (
                <tr key={item.id} className={item.policy_violation ? 'bg-amber-500/5' : ''}>
                  <td className="px-5 py-3 text-ink-2 text-sm">{item.date}</td>
                  <td className="px-5 py-3 text-ink-2 capitalize text-sm">{categoryLabel(item.category)}</td>
                  <td className="px-5 py-3">
                    <p className="text-ink text-sm">{item.description}</p>
                    {item.policy_violation && (
                      <p className="text-xs text-amber-500 mt-0.5 flex items-center gap-1">
                        <AlertTriangle size={10} /> {item.violation_detail}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-ink tabular-nums">
                    {currency(item.amount, reportMeta?.currency)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => onDeleteItem(item)}
                      disabled={deletingId === item.id}
                      className="text-ink-3 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-edge bg-surface-0">
              <tr>
                <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-ink-2 text-right">Total</td>
                <td className="px-5 py-3 text-right font-bold text-ink tabular-nums">
                  {currency(runningTotal, reportMeta?.currency)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(`/expenses/${reportId}`)}
          className="text-sm text-ink-3 hover:text-ink transition-colors"
        >
          Save as Draft
        </button>
        <button
          onClick={onSubmitReport}
          disabled={items.length === 0 || submitting}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            items.length > 0 && !submitting ? 'motivation-ready' : ''
          }`}
          style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
        >
          <CheckCircle size={15} />
          {submitting ? 'Submitting…' : 'Submit for Approval'}
        </button>
      </div>

    </div>
  )
}
