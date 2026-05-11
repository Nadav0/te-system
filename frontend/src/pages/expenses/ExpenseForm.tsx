import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { createExpense } from '../../api/expenses'
import { useAuthStore } from '../../store/auth'

const schema = z.object({
  title:       z.string().min(1, 'Title is required'),
  currency:    z.string().min(1),
  department:  z.string().optional(),
  description: z.string().optional(),
})
type Form = z.infer<typeof schema>

// Uppercase field label matching Figma
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold text-ink-3 uppercase tracking-[0.1em] mb-2">
      {children}
    </label>
  )
}

const DEPARTMENTS = [
  'Engineering', 'Marketing', 'Finance', 'Sales', 'Operations',
  'Product', 'Design', 'Legal', 'HR', 'Other',
]

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'ILS', label: 'ILS — Israeli Shekel' },
]

export default function ExpenseForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      currency:   'USD',
      department: user?.department ?? 'Engineering',
    },
  })

  const onSubmit = async (data: Form) => {
    try {
      setError('')
      const report = await createExpense(data)
      await qc.invalidateQueries({ queryKey: ['expenses'] })
      navigate(`/expenses/${report.id}`)
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to create report')
    }
  }

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">New Expense Report</h1>
        <p className="text-[13px] text-ink-3 mt-1">Create a new expense report to add items to</p>
      </div>

      {/* Two-column layout: form + tips */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ── Left: Form card ── */}
        <div className="card p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Report Title */}
            <div>
              <FieldLabel>Report Title *</FieldLabel>
              <input
                {...register('title')}
                className="input"
                placeholder="e.g. Q2 Conference — Chicago"
                autoFocus
              />
              {errors.title && (
                <p className="text-red-400 text-xs mt-1.5">{errors.title.message}</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <FieldLabel>Currency</FieldLabel>
              <select {...register('currency')} className="input">
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <FieldLabel>Department</FieldLabel>
              <select {...register('department')} className="input">
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                {...register('description')}
                rows={4}
                className="input resize-none"
                placeholder="Brief description of the expense purpose…"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
              >
                {isSubmitting ? 'Creating…' : 'Create Report'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-ink border border-edge hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* ── Right: Tips card ── */}
        <div className="card p-0 overflow-hidden">
          {/* Purple top border accent */}
          <div className="h-[3px] w-full bg-brand-600 rounded-t-[14px]" />
          <div className="p-6">
            <h3 className="text-[15px] font-semibold text-brand-400 mb-5">Tips</h3>
            <ul className="space-y-4">
              {[
                'Give your report a clear, descriptive title.',
                'Add expense items after creating the report.',
                'Policy limits are checked automatically as you add items.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 flex-shrink-0 mt-[5px]" />
                  <p className="text-[12px] text-ink-3 leading-relaxed">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
