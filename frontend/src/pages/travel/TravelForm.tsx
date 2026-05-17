import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, MapPin, Calendar, DollarSign, FileText, CheckCircle, Pencil } from 'lucide-react'
import { createTravel, submitTravel } from '../../api/travel'
import { currency, date } from '../../utils/format'
import MotivationBar from '../../components/MotivationBar'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  destination:      z.string().min(1, 'Destination required'),
  purpose:          z.string().min(10, 'Please provide more detail (min 10 chars)'),
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
    <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">
      {children}
    </label>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TravelForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  // Show motivation bar only on first travel request per session
  const [showMotivation] = useState(() => !sessionStorage.getItem('travel_created'))

  const [phase, setPhase] = useState<'form' | 'review'>('form')
  const [formData, setFormData] = useState<Form | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm<Form>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    mode: 'onChange',
    defaultValues: { departure_date: today },
  })

  // ── Motivation ───────────────────────────────────────────────────────────

  const destVal    = watch('destination') ?? ''
  const purposeVal = watch('purpose') ?? ''
  const returnDate = watch('return_date') ?? ''
  const budget     = watch('estimated_budget')

  const conditions = [
    destVal.trim().length > 0,
    purposeVal.trim().length >= 10,
    returnDate.length > 0,
    (budget ?? 0) > 0,
    isValid,
  ]
  const progress = conditions.filter(Boolean).length / conditions.length
  const motivationMsg =
    progress === 0  ? 'Fill in your trip details to get started' :
    progress < 0.5  ? 'Good start — keep going' :
    progress < 0.75 ? 'Looking good!' :
    progress < 1    ? 'Almost ready to review' :
                      'All set — continue to review'

  // ── Phase 1: form submit (just stores data, no API call yet) ─────────────

  const onContinue = (data: Form) => {
    setFormData(data)
    setPhase('review')
  }

  // ── Phase 2: actual submission ───────────────────────────────────────────

  const onSubmit = async () => {
    if (!formData) return
    setSubmitting(true)
    setError('')
    try {
      const tr = await createTravel(formData)
      sessionStorage.setItem('travel_created', '1')
      await submitTravel(tr.id)
      await qc.invalidateQueries({ queryKey: ['travel'] })
      navigate(`/travel/${tr.id}`)
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to submit request')
      setSubmitting(false)
    }
  }

  // ── Trip duration helper ─────────────────────────────────────────────────

  const tripDays = formData
    ? Math.round(
        (new Date(formData.return_date).getTime() - new Date(formData.departure_date).getTime()) / 86400000
      ) + 1
    : 0

  // ── Phase 2: Review & Confirm ────────────────────────────────────────────

  if (phase === 'review' && formData) {
    return (
      <div className="p-8 max-w-[860px]">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Review Your Request</h1>
          <p className="text-sm text-ink-3 mt-1">Confirm the details below before submitting for approval</p>
        </div>

        {/* Motivation — always 100% on review screen */}
        {showMotivation && <MotivationBar progress={1} message="All set — submit when ready" className="mb-6" />}

        {/* Summary grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="card flex items-center gap-4 py-5">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <MapPin size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-0.5">Destination</p>
              <p className="font-semibold text-ink">{formData.destination}</p>
            </div>
          </div>

          <div className="card flex items-center gap-4 py-5">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <DollarSign size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-0.5">Estimated Budget</p>
              <p className="font-semibold text-ink">{currency(formData.estimated_budget)}</p>
            </div>
          </div>

          <div className="card flex items-center gap-4 py-5">
            <div className="w-10 h-10 rounded-full bg-brand-600/10 flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-brand-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-0.5">Travel Dates</p>
              <p className="font-semibold text-ink">
                {date(formData.departure_date)} → {date(formData.return_date)}
              </p>
            </div>
          </div>

          <div className="card flex items-center gap-4 py-5">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-0.5">Duration</p>
              <p className="font-semibold text-ink">{tripDays} day{tripDays !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={15} className="text-ink-3" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Business Purpose</p>
          </div>
          <p className="text-sm text-ink-2 leading-relaxed">{formData.purpose}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-5">
            {error}
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPhase('form')}
            className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors"
          >
            <Pencil size={13} /> Edit Details
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white motivation-ready transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
          >
            <CheckCircle size={15} />
            {submitting ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </div>
      </div>
    )
  }

  // ── Phase 1: Form ─────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-[1100px]">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">New Travel Request</h1>
        <p className="text-sm text-ink-3 mt-1">Request pre-approval before booking your trip</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* Form card */}
        <div className="card p-7">
          <form onSubmit={handleSubmit(onContinue)} className="space-y-6">

            {showMotivation && <MotivationBar progress={progress} message={motivationMsg} className="mb-2" />}

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
              <FieldLabel>Business Purpose *</FieldLabel>
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

            {/* Actions */}
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
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 ${progress === 1 ? 'motivation-ready' : ''}`}
                style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
              >
                Review & Submit <ArrowRight size={15} />
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
                'Book at least 14 days in advance for best rates.',
                'Include all cost estimates — flights, hotel, and ground transport.',
                'Approval is required before making any bookings.',
                'Attach receipts to a linked expense report after your trip.',
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
