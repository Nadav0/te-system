import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { createTravel } from '../../api/travel'

const schema = z.object({
  destination:      z.string().min(1, 'Destination required'),
  purpose:          z.string().min(10, 'Please provide more detail'),
  departure_date:   z.string().min(1, 'Departure date required'),
  return_date:      z.string().min(1, 'Return date required'),
  estimated_budget: z.number().min(1, 'Budget must be at least $1'),
}).refine((d) => d.return_date >= d.departure_date, {
  message: 'Return date must be on or after departure',
  path: ['return_date'],
})
type Form = z.infer<typeof schema>

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold text-ink-3 uppercase tracking-[0.1em] mb-2">
      {children}
    </label>
  )
}

export default function TravelForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { departure_date: today },
  })

  const onSubmit = async (data: Form) => {
    try {
      setError('')
      const tr = await createTravel(data)
      await qc.invalidateQueries({ queryKey: ['travel'] })
      navigate(`/travel/${tr.id}`)
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to create request')
    }
  }

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">New Travel Request</h1>
        <p className="text-[13px] text-ink-3 mt-1">Request pre-approval before booking your trip</p>
      </div>

      {/* Two-column layout: form + tips */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ── Left: Form card ── */}
        <div className="card p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Destination */}
            <div>
              <FieldLabel>Destination *</FieldLabel>
              <input
                {...register('destination')}
                className="input"
                placeholder="e.g. New York, NY"
                autoFocus
              />
              {errors.destination && (
                <p className="text-red-400 text-xs mt-1.5">{errors.destination.message}</p>
              )}
            </div>

            {/* Purpose */}
            <div>
              <FieldLabel>Purpose *</FieldLabel>
              <textarea
                {...register('purpose')}
                className="input resize-none"
                rows={3}
                placeholder="Describe the business purpose of this trip…"
              />
              {errors.purpose && (
                <p className="text-red-400 text-xs mt-1.5">{errors.purpose.message}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Departure Date *</FieldLabel>
                <input type="date" {...register('departure_date')} className="input" min={today} />
                {errors.departure_date && (
                  <p className="text-red-400 text-xs mt-1.5">{errors.departure_date.message}</p>
                )}
              </div>
              <div>
                <FieldLabel>Return Date *</FieldLabel>
                <input type="date" {...register('return_date')} className="input" min={today} />
                {errors.return_date && (
                  <p className="text-red-400 text-xs mt-1.5">{errors.return_date.message}</p>
                )}
              </div>
            </div>

            {/* Budget */}
            <div>
              <FieldLabel>Estimated Budget (USD) *</FieldLabel>
              <input
                type="number"
                step="0.01"
                {...register('estimated_budget', { valueAsNumber: true })}
                className="input"
                placeholder="0.00"
              />
              {errors.estimated_budget && (
                <p className="text-red-400 text-xs mt-1.5">{errors.estimated_budget.message}</p>
              )}
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
                {isSubmitting ? 'Creating…' : 'Create Request'}
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
          <div className="h-[3px] w-full bg-brand-600 rounded-t-[14px]" />
          <div className="p-6">
            <h3 className="text-[15px] font-semibold text-brand-400 mb-5">Tips</h3>
            <ul className="space-y-4">
              {[
                'Book at least 14 days in advance for best rates.',
                'Include all cost estimates — flights, hotel, and ground transport.',
                'Approval is required before making any bookings.',
                'Attach receipts to the linked expense report after your trip.',
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
