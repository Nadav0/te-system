import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, CheckCircle, XCircle, MapPin, Calendar, DollarSign, FileText } from 'lucide-react'
import { getTravel, submitTravel, reviewTravel } from '../../api/travel'
import { useAuthStore } from '../../store/auth'
import { currency, date } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'

export default function TravelDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)!
  const qc = useQueryClient()
  const [reviewNote, setReviewNote] = useState('')
  const [error, setError] = useState('')

  const { data: tr, isLoading } = useQuery({
    queryKey: ['travel', id],
    queryFn: () => getTravel(id!),
    enabled: !!id,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['travel', id] })
    qc.invalidateQueries({ queryKey: ['travel'] })
  }

  const submitMutation = useMutation({ mutationFn: () => submitTravel(id!), onSuccess: invalidate })
  const reviewMutation = useMutation({
    mutationFn: ({ action }: { action: 'approve' | 'reject' }) =>
      reviewTravel(id!, action, reviewNote || undefined),
    onSuccess: invalidate,
    onError: (e: any) => setError(e.response?.data?.detail ?? 'Failed'),
  })

  if (isLoading) return <Spinner className="h-96" />
  if (!tr) return <div className="p-8 text-gray-500">Travel request not found</div>

  const canSubmit = tr.status === 'draft' && tr.employee_id === user.id
  const canReview = (user.role === 'manager' || user.role === 'finance') &&
    (tr.status === 'submitted' || tr.status === 'under_review')

  return (
    <div className="p-8 max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ChevronLeft size={16} /> Back
      </button>

      <PageHeader
        title={tr.destination}
        subtitle={`${tr.employee?.full_name ?? 'You'} · Submitted ${tr.submitted_at ? date(tr.submitted_at) : 'Not yet'}`}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={tr.status} />
            {canSubmit && (
              <button className="btn-primary" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'Submitting…' : 'Submit for Approval'}
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card flex items-center gap-3 py-4">
          <MapPin className="text-blue-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-xs text-gray-500">Destination</p>
            <p className="font-semibold text-gray-900">{tr.destination}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 py-4">
          <DollarSign className="text-green-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-xs text-gray-500">Estimated Budget</p>
            <p className="font-semibold text-gray-900">{currency(tr.estimated_budget)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 py-4">
          <Calendar className="text-indigo-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-xs text-gray-500">Travel Dates</p>
            <p className="font-semibold text-gray-900">{date(tr.departure_date)} → {date(tr.return_date)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 py-4">
          <Calendar className="text-purple-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="font-semibold text-gray-900">
              {Math.round((new Date(tr.return_date).getTime() - new Date(tr.departure_date).getTime()) / 86400000) + 1} days
            </p>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={16} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900">Business Purpose</h3>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{tr.purpose}</p>
      </div>

      {tr.review_note && (
        <div className={`mb-6 p-4 rounded-lg border ${tr.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm font-medium text-gray-700 mb-1">Reviewer note ({tr.reviewer?.full_name}):</p>
          <p className="text-sm text-gray-600">{tr.review_note}</p>
        </div>
      )}

      {(tr.expense_reports?.length ?? 0) > 0 && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Linked Expense Reports</h3>
          <div className="space-y-2">
            {tr.expense_reports.map((r: any) => (
              <Link key={r.id} to={`/expenses/${r.id}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                <span className="text-sm text-gray-700">{r.title}</span>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {canReview && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Review This Request</h3>
          <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            className="input mb-4 resize-none"
            rows={3}
            placeholder="Optional note…"
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <div className="flex gap-3">
            <button className="btn-success" onClick={() => reviewMutation.mutate({ action: 'approve' })} disabled={reviewMutation.isPending}>
              <CheckCircle size={15} /> Approve
            </button>
            <button className="btn-danger" onClick={() => reviewMutation.mutate({ action: 'reject' })} disabled={reviewMutation.isPending}>
              <XCircle size={15} /> Reject
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
