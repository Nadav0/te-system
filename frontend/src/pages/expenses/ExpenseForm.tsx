import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { createExpense } from '../../api/expenses'
import PageHeader from '../../components/PageHeader'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  currency: z.string().min(1),
})
type Form = z.infer<typeof schema>

export default function ExpenseForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { currency: 'USD' },
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
    <div className="p-8 max-w-2xl">
      <PageHeader title="New Expense Report" subtitle="Create a new expense report to add items to" />

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Report Title *</label>
            <input {...register('title')} className="input" placeholder="e.g. Q2 Conference — Chicago" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label">Currency</label>
            <select {...register('currency')} className="input">
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="ILS">ILS — Israeli Shekel</option>
            </select>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create Report'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
