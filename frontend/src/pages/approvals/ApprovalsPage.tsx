import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, CheckCircle, XCircle, Plane, Receipt,
  RotateCcw, CreditCard, Calendar, Tag, User, FileText,
} from 'lucide-react'
import { listExpenses, getExpense, reviewExpense } from '../../api/expenses'
import { listTravel, getTravel, reviewTravel } from '../../api/travel'
import { currency, date } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import MotivationBar from '../../components/MotivationBar'
import type { ExpenseReport, TravelRequest } from '../../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function initials(name?: string) {
  return name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'
}

const AVATAR_COLORS = [
  'bg-brand-600', 'bg-blue-500', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-500',
]
function avatarColor(name?: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
}

const CATEGORY_LABELS: Record<string, string> = {
  meals: 'Meals', transport: 'Transport', lodging: 'Lodging',
  conference: 'Conference', other: 'Other',
}

// ── Inbox row ─────────────────────────────────────────────────────────────────

function ExpenseRow({
  report, selected, onClick,
}: { report: ExpenseReport; selected: boolean; onClick: () => void }) {
  const name = report.employee?.full_name ?? 'Unknown'
  const primaryCat = report.items?.[0]?.category
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left p-4 border-b border-edge transition-colors ${
        selected ? 'bg-surface-hover' : 'hover:bg-surface-hover'
      }`}
    >
      {/* Selected indicator bar */}
      {selected && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-600 rounded-r" />
      )}
      <div className="flex gap-3 pl-1">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor(name)}`}>
          {initials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-0.5">
            <p className="text-sm font-semibold text-ink truncate">{name}</p>
            <span className="text-sm font-semibold text-ink tabular-nums ml-2 flex-shrink-0">
              {currency(report.total_amount)}
            </span>
          </div>
          <p className="text-xs text-ink-3 truncate mb-2">{report.title}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {report.has_violations && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px] font-semibold">
                <AlertTriangle size={9} /> Policy issue
              </span>
            )}
            {primaryCat && (
              <span className="px-1.5 py-0.5 bg-brand-600/10 text-brand-400 rounded text-[10px] font-semibold capitalize">
                {CATEGORY_LABELS[primaryCat] ?? primaryCat}
              </span>
            )}
            <span className="ml-auto text-[10px] text-ink-3 flex-shrink-0">
              {timeAgo(report.created_at)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function TravelRow({
  tr, selected, onClick,
}: { tr: TravelRequest; selected: boolean; onClick: () => void }) {
  const name = tr.employee?.full_name ?? 'Unknown'
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left p-4 border-b border-edge transition-colors ${
        selected ? 'bg-surface-hover' : 'hover:bg-surface-hover'
      }`}
    >
      {selected && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-600 rounded-r" />
      )}
      <div className="flex gap-3 pl-1">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor(name)}`}>
          {initials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-0.5">
            <p className="text-sm font-semibold text-ink truncate">{name}</p>
            <span className="text-sm font-semibold text-ink tabular-nums ml-2 flex-shrink-0">
              {currency(tr.estimated_budget)}
            </span>
          </div>
          <p className="text-xs text-ink-3 truncate mb-2">
            <Plane size={10} className="inline mr-1" />{tr.destination}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-blue-400/10 text-blue-300 rounded text-[10px] font-semibold">
              Travel
            </span>
            <span className="ml-auto text-[10px] text-ink-3">{timeAgo(tr.created_at)}</span>
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Expense Detail ─────────────────────────────────────────────────────────────

function ExpenseDetail({ id, position, total, onReviewed }: {
  id: string
  position: number
  total: number
  onReviewed?: () => void
}) {
  const qc = useQueryClient()
  const [reviewNote, setReviewNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [lastAction, setLastAction] = useState<'approve' | 'reject' | 'changes' | null>(null)

  const { data: report, isLoading } = useQuery<ExpenseReport>({
    queryKey: ['expense', id],
    queryFn: () => getExpense(id),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ action, prefix = '' }: { action: 'approve' | 'reject'; prefix?: string }) =>
      reviewExpense(id, action, prefix + (reviewNote || '') || undefined),
    onSuccess: (_, vars) => {
      const act = vars.action === 'approve' ? 'approve' : vars.prefix ? 'changes' : 'reject'
      setLastAction(act)
      setTimeout(() => setLastAction(null), 1500)
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expense', id] })
      setReviewNote('')
      setShowNote(false)
      onReviewed?.()
    },
  })

  if (isLoading) return <Spinner className="h-full" />
  if (!report) return null

  const canReview = report.status === 'submitted' || report.status === 'under_review'
  const name = report.employee?.full_name ?? 'Unknown'
  const dept = report.employee?.department ?? ''
  const violatingItems = report.items?.filter((i) => i.policy_violation) ?? []
  const receiptItem = report.items?.find((i) => i.receipt_url)

  // Category breakdown for budget widget
  const byCategory = report.items?.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount
    return acc
  }, {}) ?? {}
  const maxCatAmt = Math.max(...Object.values(byCategory), 1)

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-edge">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${avatarColor(name)}`}>
                {initials(name)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-ink tracking-tight">{name}</h2>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3 mt-0.5">
                  {dept}{dept && report.employee?.role ? ' • ' : ''}{report.employee?.role ?? ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-ink tabular-nums leading-none mb-2">
                {currency(report.total_amount)}
              </p>
              <StatusBadge status={report.status} />
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-2 font-medium">{report.title}</p>
        </div>

        <div className="p-8 space-y-6">
          {/* Policy violation callout */}
          {report.has_violations && violatingItems.length > 0 && (
            <div className="border-l-4 border-red-500 bg-red-500/5 p-4 rounded-r-lg">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle size={14} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Policy Violation Detected</span>
              </div>
              <div className="space-y-1">
                {violatingItems.map((item) => (
                  <p key={item.id} className="text-sm text-ink-2 leading-relaxed">
                    <span className="font-semibold text-ink">{item.description}</span>
                    {item.violation_detail && ` — ${item.violation_detail}`}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Reviewer note (post-review) */}
          {report.review_note && (
            <div className={`p-4 rounded-lg border ${
              report.status === 'approved'
                ? 'bg-green-500/5 border-green-500/20 text-green-400'
                : 'bg-red-500/5 border-red-500/20 text-red-400'
            }`}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1">
                Reviewer note — {report.reviewer?.full_name}
              </p>
              <p className="text-sm text-ink-2">{report.review_note}</p>
            </div>
          )}

          {/* Receipt + Metadata grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Receipt preview */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-3">
                Receipt Attachment
              </p>
              <div className="aspect-[3/4] bg-surface-2 border border-edge rounded-lg overflow-hidden flex items-center justify-center">
                {receiptItem?.receipt_url ? (
                  <img
                    src={receiptItem.receipt_url}
                    alt="Receipt"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-6 h-full w-full flex flex-col justify-between font-mono text-[8px] uppercase text-ink-3/40 leading-tight">
                    <div>
                      <p className="text-brand-600/60 font-bold text-[10px] mb-2">{report.title.toUpperCase()}</p>
                      <p>{report.employee?.full_name}</p>
                      <p>{date(report.created_at)}</p>
                    </div>
                    <div className="space-y-1">
                      {report.items?.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between border-t border-edge/30 pt-1">
                          <span className="truncate pr-2">{item.description}</span>
                          <span>{currency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-edge pt-1 font-bold text-ink-3/60">
                        <span>Total</span>
                        <span>{currency(report.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-5">
              {/* Details list */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-3">Details</p>
                <div className="divide-y divide-edge">
                  {[
                    { icon: Calendar, label: 'Submitted', value: date(report.submitted_at ?? report.created_at) },
                    { icon: Tag, label: 'Items', value: `${report.items?.length ?? 0} line items` },
                    { icon: User, label: 'Department', value: dept || '—' },
                    { icon: FileText, label: 'Currency', value: report.currency },
                    { icon: CreditCard, label: 'Report ID', value: report.id.slice(0, 8).toUpperCase() },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-ink-3">
                        <Icon size={13} />
                        <span className="text-xs">{label}</span>
                      </div>
                      <span className="text-xs font-semibold text-ink">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spend breakdown mini-widget */}
              {Object.keys(byCategory).length > 0 && (
                <div className="bg-surface-2 border border-edge rounded-lg p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-3">
                    Spend Breakdown
                  </p>
                  <div className="space-y-2">
                    {Object.entries(byCategory).map(([cat, amt]) => (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-ink-2 capitalize">{CATEGORY_LABELS[cat] ?? cat}</span>
                          <span className="text-[11px] font-semibold text-ink tabular-nums">{currency(amt)}</span>
                        </div>
                        <div className="h-1 bg-surface-0 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-600 rounded-full transition-all duration-500"
                            style={{ width: `${(amt / maxCatAmt) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Line items table */}
          {report.items && report.items.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-3">
                Line Items
              </p>
              <div className="border border-edge rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-0 border-b border-edge">
                      <th className="text-left px-3 py-2 text-ink-3 font-semibold uppercase tracking-wider">Description</th>
                      <th className="text-left px-3 py-2 text-ink-3 font-semibold uppercase tracking-wider">Category</th>
                      <th className="text-left px-3 py-2 text-ink-3 font-semibold uppercase tracking-wider">Date</th>
                      <th className="text-right px-3 py-2 text-ink-3 font-semibold uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge">
                    {report.items.map((item) => (
                      <tr key={item.id} className={item.policy_violation ? 'bg-red-500/5' : ''}>
                        <td className="px-3 py-2.5 text-ink">
                          {item.description}
                          {item.policy_violation && (
                            <AlertTriangle size={10} className="inline ml-1 text-red-400" />
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-ink-3 capitalize">
                          {CATEGORY_LABELS[item.category] ?? item.category}
                        </td>
                        <td className="px-3 py-2.5 text-ink-3">{date(item.date)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-ink tabular-nums">
                          {currency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky action bar */}
      {canReview && (
        <div className="border-t border-edge bg-surface-1/80 backdrop-blur-sm flex-shrink-0">
          {lastAction ? (
            /* Post-action flash */
            <div className={`flex items-center justify-center gap-2 py-5 text-sm font-semibold transition-all ${
              lastAction === 'approve' ? 'text-emerald-500' :
              lastAction === 'reject'  ? 'text-red-400' : 'text-ink-3'
            }`}>
              {lastAction === 'approve' && <><CheckCircle size={16} /> Approved</>}
              {lastAction === 'reject'  && <><XCircle size={16} /> Rejected</>}
              {lastAction === 'changes' && <><RotateCcw size={16} /> Changes Requested</>}
            </div>
          ) : (
            <>
              {/* Context bar */}
              <div className="px-5 py-2.5 border-b border-edge flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-ink-3">
                    Reviewing {position} of {total}
                  </span>
                  {violatingItems.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold">
                      <AlertTriangle size={10} /> {violatingItems.length} violation{violatingItems.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {!showNote ? (
                  <button
                    onClick={() => setShowNote(true)}
                    className="text-[11px] text-brand-500 hover:text-brand-600 transition-colors font-medium"
                  >
                    + Add note
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowNote(false); setReviewNote('') }}
                    className="text-[11px] text-ink-3 hover:text-ink transition-colors"
                  >
                    Remove note
                  </button>
                )}
              </div>

              {/* Expandable note */}
              {showNote && (
                <div className="px-5 pt-3">
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Note to the employee (optional)…"
                    autoFocus
                    className="w-full bg-surface-0 border border-edge rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-3 focus:outline-none focus:border-brand-600 resize-none"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => reviewMutation.mutate({ action: 'reject' })}
                    disabled={reviewMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 text-red-400 border border-red-400/30 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-semibold disabled:opacity-40"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    onClick={() => reviewMutation.mutate({ action: 'reject', prefix: '[Changes Requested] ' })}
                    disabled={reviewMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 text-ink-3 border border-edge rounded-lg hover:bg-surface-hover transition-colors text-sm font-semibold disabled:opacity-40"
                  >
                    <RotateCcw size={14} /> Request Changes
                  </button>
                </div>
                <button
                  onClick={() => reviewMutation.mutate({ action: 'approve' })}
                  disabled={reviewMutation.isPending}
                  className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 ${
                    violatingItems.length > 0
                      ? 'bg-brand-600 hover:bg-brand-700'
                      : 'bg-emerald-600 hover:bg-emerald-700 approve-ready'
                  }`}
                >
                  <CheckCircle size={15} />
                  {reviewMutation.isPending ? 'Saving…' : violatingItems.length > 0 ? 'Approve Anyway' : 'Approve'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Travel Detail ──────────────────────────────────────────────────────────────

function TravelDetail({ id, position, total, onReviewed }: {
  id: string
  position: number
  total: number
  onReviewed?: () => void
}) {
  const qc = useQueryClient()
  const [reviewNote, setReviewNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [lastAction, setLastAction] = useState<'approve' | 'reject' | null>(null)

  const { data: tr, isLoading } = useQuery<TravelRequest>({
    queryKey: ['travel', id],
    queryFn: () => getTravel(id),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ action, prefix = '' }: { action: 'approve' | 'reject'; prefix?: string }) =>
      reviewTravel(id, action, prefix + (reviewNote || '') || undefined),
    onSuccess: (_, vars) => {
      setLastAction(vars.action)
      setTimeout(() => setLastAction(null), 1500)
      qc.invalidateQueries({ queryKey: ['travel'] })
      qc.invalidateQueries({ queryKey: ['travel', id] })
      setReviewNote('')
      setShowNote(false)
      onReviewed?.()
    },
  })

  if (isLoading) return <Spinner className="h-full" />
  if (!tr) return null

  const canReview = tr.status === 'submitted' || tr.status === 'under_review'
  const name = tr.employee?.full_name ?? 'Unknown'
  const dept = tr.employee?.department ?? ''

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-edge">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Plane size={22} className="text-blue-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-ink tracking-tight">{tr.destination}</h2>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3 mt-0.5">
                  Requested by {name}{dept ? ` • ${dept}` : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-ink tabular-nums leading-none mb-2">
                {currency(tr.estimated_budget)}
              </p>
              <StatusBadge status={tr.status} />
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-2">{tr.purpose}</p>
        </div>

        <div className="p-8 space-y-6">
          {tr.review_note && (
            <div className={`p-4 rounded-lg border ${
              tr.status === 'approved'
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3 mb-1">
                Reviewer note — {tr.reviewer?.full_name}
              </p>
              <p className="text-sm text-ink-2">{tr.review_note}</p>
            </div>
          )}

          {/* Details */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-3">Details</p>
            <div className="border border-edge rounded-lg divide-y divide-edge">
              {[
                { label: 'Departure', value: date(tr.departure_date) },
                { label: 'Return', value: date(tr.return_date) },
                { label: 'Employee', value: name },
                { label: 'Department', value: dept || '—' },
                { label: 'Submitted', value: date(tr.submitted_at ?? tr.created_at) },
                { label: 'Est. Budget', value: currency(tr.estimated_budget) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-ink-3">{label}</span>
                  <span className="text-xs font-semibold text-ink">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Linked expense reports */}
          {tr.expense_reports && tr.expense_reports.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mb-3">
                Expense Reports ({tr.expense_reports.length})
              </p>
              <div className="border border-edge rounded-lg divide-y divide-edge">
                {tr.expense_reports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Receipt size={13} className="text-ink-3" />
                      <span className="text-xs text-ink">{r.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-ink tabular-nums">
                        {currency(r.total_amount)}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky action bar */}
      {canReview && (
        <div className="border-t border-edge bg-surface-1/80 backdrop-blur-sm flex-shrink-0">
          {lastAction ? (
            <div className={`flex items-center justify-center gap-2 py-5 text-sm font-semibold ${
              lastAction === 'approve' ? 'text-emerald-500' : 'text-red-400'
            }`}>
              {lastAction === 'approve'
                ? <><CheckCircle size={16} /> Approved</>
                : <><XCircle size={16} /> Rejected</>}
            </div>
          ) : (
            <>
              <div className="px-5 py-2.5 border-b border-edge flex items-center justify-between">
                <span className="text-[11px] font-semibold text-ink-3">
                  Reviewing {position} of {total}
                </span>
                {!showNote ? (
                  <button
                    onClick={() => setShowNote(true)}
                    className="text-[11px] text-brand-500 hover:text-brand-600 transition-colors font-medium"
                  >
                    + Add note
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowNote(false); setReviewNote('') }}
                    className="text-[11px] text-ink-3 hover:text-ink transition-colors"
                  >
                    Remove note
                  </button>
                )}
              </div>

              {showNote && (
                <div className="px-5 pt-3">
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Note to the employee (optional)…"
                    autoFocus
                    className="w-full bg-surface-0 border border-edge rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-3 focus:outline-none focus:border-brand-600 resize-none"
                  />
                </div>
              )}

              <div className="px-5 py-4 flex items-center justify-between">
                <button
                  onClick={() => reviewMutation.mutate({ action: 'reject' })}
                  disabled={reviewMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 text-red-400 border border-red-400/30 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-semibold disabled:opacity-40"
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  onClick={() => reviewMutation.mutate({ action: 'approve' })}
                  disabled={reviewMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 approve-ready text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
                >
                  <CheckCircle size={15} />
                  {reviewMutation.isPending ? 'Saving…' : 'Approve'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Empty / celebration states ────────────────────────────────────────────────

function EmptyDetail({ message }: { message: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
      <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mb-4">
        <CheckCircle size={24} className="text-ink-3" />
      </div>
      <p className="text-sm font-semibold text-ink-2">{message}</p>
      <p className="text-xs text-ink-3 mt-1">Select an item from the left to review</p>
    </div>
  )
}

function QueueCelebration({ reviewed, tab }: { reviewed: number; tab: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5">
        <CheckCircle size={30} className="text-emerald-500" />
      </div>
      <h3 className="text-xl font-bold text-ink mb-2">Queue cleared!</h3>
      <p className="text-sm text-ink-3 mb-8">
        You reviewed {reviewed} {tab} request{reviewed !== 1 ? 's' : ''} this session.
      </p>
      <MotivationBar progress={1} message="All caught up — great work!" className="w-56" />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'expenses' | 'travel'

function queueMotivationMsg(reviewed: number, pending: number): string {
  const total = reviewed + pending
  if (total === 0) return 'Nothing pending — inbox clear'
  if (reviewed === 0) return `${total} item${total === 1 ? '' : 's'} need your review`
  if (pending === 0) return 'Queue cleared — great work!'
  if (reviewed / total < 0.5) return `${pending} remaining — keep going!`
  if (reviewed / total < 0.75) return 'More than halfway there!'
  return `Almost done — just ${pending} more!`
}

export default function ApprovalsPage() {
  const [tab, setTab] = useState<Tab>('expenses')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sessionExpReviewed, setSessionExpReviewed] = useState(0)
  const [sessionTrvReviewed, setSessionTrvReviewed] = useState(0)

  const { data: expenses = [], isLoading: el } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => listExpenses(),
  })
  const { data: travels = [], isLoading: tl } = useQuery({
    queryKey: ['travel'],
    queryFn: () => listTravel(),
  })

  const pendingExpenses = (expenses as ExpenseReport[]).filter(
    (e) => e.status === 'submitted' || e.status === 'under_review'
  )
  const pendingTravel = (travels as TravelRequest[]).filter(
    (t) => t.status === 'submitted'
  )

  const activeList = tab === 'expenses' ? pendingExpenses : pendingTravel

  const tabReviewed = tab === 'expenses' ? sessionExpReviewed : sessionTrvReviewed
  const tabPending  = activeList.length
  const totalSeen   = tabReviewed + tabPending
  const queueProgress = totalSeen > 0 ? tabReviewed / totalSeen : 0

  // Auto-select first item when list loads or tab switches
  useEffect(() => {
    setSelectedId(activeList[0]?.id ?? null)
  }, [tab, pendingExpenses.length, pendingTravel.length])

  return (
    // Full height minus the 56px (3.5rem) header
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left: Inbox list (360px) ── */}
      <div className="w-[360px] flex-shrink-0 border-r border-edge flex flex-col bg-surface-0">

        {/* Tab segmented control */}
        <div className="p-3 border-b border-edge">
          <div className="flex bg-surface-1 border border-edge p-0.5 rounded-lg">
            <button
              onClick={() => setTab('expenses')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-colors ${
                tab === 'expenses'
                  ? 'bg-surface-2 text-ink'
                  : 'text-ink-3 hover:text-ink-2'
              }`}
            >
              Expenses {pendingExpenses.length > 0 && (
                <span className="ml-1 bg-brand-600 text-white rounded px-1 text-[9px]">
                  {pendingExpenses.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('travel')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-colors ${
                tab === 'travel'
                  ? 'bg-surface-2 text-ink'
                  : 'text-ink-3 hover:text-ink-2'
              }`}
            >
              Travel {pendingTravel.length > 0 && (
                <span className="ml-1 bg-brand-600 text-white rounded px-1 text-[9px]">
                  {pendingTravel.length}
                </span>
              )}
            </button>
          </div>
          <div className="mt-3 px-1">
            <MotivationBar
              progress={queueProgress}
              message={queueMotivationMsg(tabReviewed, tabPending)}
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto">
          {(el || tl) ? (
            <Spinner className="h-32" />
          ) : activeList.length === 0 ? (
            <EmptyState
              variant="approvals"
              title="All caught up!"
              description={`No pending ${tab} to review.`}
            />
          ) : tab === 'expenses' ? (
            pendingExpenses.map((r) => (
              <ExpenseRow
                key={r.id}
                report={r}
                selected={selectedId === r.id}
                onClick={() => setSelectedId(r.id)}
              />
            ))
          ) : (
            pendingTravel.map((tr) => (
              <TravelRow
                key={tr.id}
                tr={tr}
                selected={selectedId === tr.id}
                onClick={() => setSelectedId(tr.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right: Detail panel ── */}
      <div className="flex-1 bg-surface-1 overflow-hidden flex flex-col">
        {selectedId && tab === 'expenses' ? (
          <ExpenseDetail
            key={selectedId}
            id={selectedId}
            position={sessionExpReviewed + pendingExpenses.findIndex((e) => e.id === selectedId) + 1}
            total={totalSeen}
            onReviewed={() => setSessionExpReviewed((n) => n + 1)}
          />
        ) : selectedId && tab === 'travel' ? (
          <TravelDetail
            key={selectedId}
            id={selectedId}
            position={sessionTrvReviewed + pendingTravel.findIndex((t) => t.id === selectedId) + 1}
            total={totalSeen}
            onReviewed={() => setSessionTrvReviewed((n) => n + 1)}
          />
        ) : tabReviewed > 0 ? (
          <QueueCelebration reviewed={tabReviewed} tab={tab === 'expenses' ? 'expense' : 'travel'} />
        ) : (
          <EmptyDetail
            message={tab === 'expenses' ? 'No expense reports pending' : 'No travel requests pending'}
          />
        )}
      </div>

    </div>
  )
}
