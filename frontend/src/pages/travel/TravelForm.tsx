import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { createTravel } from '../../api/travel'
import PageHeader from '../../components/PageHeader'

const schema = z.object({
  destination: z.string().min(1, 'Destination required'),
  purpose: z.string().min(10, 'Please provide more detail'),
  departure_date: z.string().min(1, 'Departure date required'),
  return_date: z.string().min(1, 'Return date required'),
  estimated_budget: z.number().positive('Budget must be greater than 0'),
}).refine((d) => d.return_date >= d.departure_date, {
  message: 'Return date must be on or after departure',
  path: ['return_date'],
})
type Form = z.infer<typeof schema>

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
    <div className="p-8 max-w-2xl">
      <PageHeader title="New Travel Request" subtitle="Request pre-approval before booking travel" />
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Destination *</label>
            <input {...register('destination')} className="input" placeholder="e.g. New York, NY" />
            {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination.message}</p>}
          </div>
          <div>
            <label className="label">Purpose *</label>
            <textarea {...register('purpose')} className="input resize-none" rows={3} placeholder="Describe the business purpose of this trip…" />
            {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Departure Date *</label>
              <input type="date" {...register('departure_date')} className="input" min={today} />
              {errors.departure_date && <p className="text-red-500 text-xs mt-1">{errors.departure_date.message}</p>}
            </div>
            <div>
              <label className="label">Return Date *</label>
              <input type="date" {...register('return_date')} className="input" min={today} />
              {errors.return_date && <p className="text-red-500 text-xs mt-1">{errors.return_date.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Estimated Budget (USD) *</label>
            <input type="number" step="0.01" {...register('estimated_budget', { valueAsNumber: true })} className="input" placeholder="0.00" />
            {errors.estimated_budget && <p className="text-red-500 text-xs mt-1">{errors.estimated_budget.message}</p>}
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create Request'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
