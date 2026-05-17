import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, FileText, ScanLine, ChevronRight, Clock, Search } from 'lucide-react'
import { listExpenses } from '../../api/expenses'
import { currency, date } from '../../utils/format'
import Spinner from '../../components/Spinner'
import MotivationBar from '../../components/MotivationBar'
import Select from '../../components/Select'
import type { ExpenseReport, ExpenseItem } from '../../types'

function codingMsg(coded: number, pending: number): string {
  const total = coded + pending
  if (total === 0) return 'No transactions pending'
  if (coded === 0) return `${pending} transaction${pending !== 1 ? 's' : ''} need GL codes`
  if (pending === 0) return 'Queue complete — great work!'
  if (coded / total < 0.5) return `${pending} remaining — keep going!`
  if (coded / total < 0.75) return 'More than halfway there!'
  return `Almost done — just ${pending} more!`
}

const GL_SUGGESTIONS: Record<string, string> = {
  meals: '6200 – Meals & Entertainment',
  transport: '6100 – Travel & Transportation',
  lodging: '6100 – Travel Lodging & Accommodation',
  conference: '6300 – Conferences & Events',
  tech: '6400 – Software & Technology',
  other: '6500 – General & Administrative',
}

const DEPARTMENTS = ['Sales & Marketing', 'Engineering', 'Finance', 'Operations', 'HR', 'Legal']
const LOCATIONS = ['New York, NY', 'San Francisco, CA', 'London, UK', 'Austin, TX', 'Chicago, IL', 'Remote']

type QueueItem = { report: ExpenseReport; item: ExpenseItem }

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-brand-600/20 text-brand-600 not-italic rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function maskCard() {
  const last4 = Math.floor(1000 + Math.random() * 9000)
  return `VISA ···· ${last4}`
}

const CARD_NUMBERS: Record<string, string> = {}
function getCard(id: string) {
  if (!CARD_NUMBERS[id]) CARD_NUMBERS[id] = maskCard()
  return CARD_NUMBERS[id]
}

export default function CodingQueuePage() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [coded, setCoded] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null)
  const [glCodes, setGlCodes] = useState<Record<string, string>>({})
  const [departments, setDepartments] = useState<Record<string, string>>({})
  const [locations, setLocations] = useState<Record<string, string>>({})

  const { data: allReports = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => listExpenses(),
  })

  const reports = allReports as ExpenseReport[]
  const queue: QueueItem[] = reports
    .filter((r) => r.status === 'approved' || r.status === 'submitted' || r.status === 'under_review')
    .flatMap((r) => (r.items ?? []).map((item) => ({ report: r, item })))
    .filter((q) => !coded.has(q.item.id))
    .filter((q) => {
      if (!searchQuery.trim()) return true
      const s = searchQuery.toLowerCase()
      return (
        (q.item.description ?? '').toLowerCase().includes(s) ||
        q.report.title.toLowerCase().includes(s) ||
        (q.report.employee?.full_name ?? '').toLowerCase().includes(s)
      )
    })

  useEffect(() => {
    setSelectedIdx(0)
  }, [queue.length])

  const selected = queue[selectedIdx] ?? null

  const submitCoding = async () => {
    if (!selected) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    const id = selected.item.id
    setCoded((prev) => new Set([...prev, id]))
    setLastSubmitted(id)
    setSubmitting(false)
    setTimeout(() => setLastSubmitted(null), 1500)
  }

  const getGL = (item: ExpenseItem) =>
    glCodes[item.id] ?? GL_SUGGESTIONS[item.category] ?? GL_SUGGESTIONS.other

  const setGL = (itemId: string, val: string) =>
    setGlCodes((prev) => ({ ...prev, [itemId]: val }))

  const getDept = (item: ExpenseItem, report: ExpenseReport) =>
    departments[item.id] ?? report.employee?.department ?? DEPARTMENTS[0]

  const setDept = (itemId: string, val: string) =>
    setDepartments((prev) => ({ ...prev, [itemId]: val }))

  const getLoc = (item: ExpenseItem) =>
    locations[item.id] ?? LOCATIONS[0]

  const setLoc = (itemId: string, val: string) =>
    setLocations((prev) => ({ ...prev, [itemId]: val }))

  if (isLoading) return <Spinner className="h-96" />

  const uncoded = queue.length

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left panel — queue */}
      <div className="w-[320px] flex-shrink-0 bg-surface-0 border-r border-edge flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-edge">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-ink">Coding Queue</h2>
          </div>
          <p className="text-xs text-ink-3 mb-3">Assign GL codes to approved transactions.</p>
          <MotivationBar
            progress={coded.size + queue.length > 0 ? coded.size / (coded.size + queue.length) : 0}
            message={codingMsg(coded.size, queue.length)}
            className="mb-3"
          />
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search transactions…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedIdx(0) }}
              className="w-full pl-7 pr-2 py-1.5 border border-edge rounded-lg text-xs bg-surface-0 text-ink placeholder:text-ink-3
                         focus:outline-none focus:border-brand-600/60 focus:ring-1 focus:ring-brand-600/15 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
              <CheckCircle size={32} className="text-emerald-400" />
              <p className="text-sm font-semibold text-ink">All coded!</p>
              <p className="text-xs text-ink-3">No transactions pending GL assignment.</p>
            </div>
          ) : (
            queue.map(({ report, item }, idx) => (
              <button
                key={item.id}
                onClick={() => setSelectedIdx(idx)}
                className={`w-full text-left px-4 py-3.5 border-b border-edge transition-colors flex items-start gap-3 ${
                  idx === selectedIdx ? 'bg-surface-1 border-l-[3px] border-l-brand-600' : 'hover:bg-surface-hover'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-brand-600/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText size={14} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink truncate"><Highlight text={item.description || report.title} query={searchQuery} /></p>
                  <p className="text-[10px] text-ink-3 mt-0.5">{getCard(item.id)}</p>
                  <p className="text-[10px] text-ink-3">{date(item.date)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-ink tabular-nums">{currency(item.amount)}</p>
                  <span className="text-[10px] uppercase tracking-wide font-semibold text-amber-400">Pending</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel — detail */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-surface-1">
          {/* Transaction header */}
          <div className="px-6 py-5 border-b border-edge flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                  TX {selected.item.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-[10px] text-ink-3">·</span>
                <span className="text-[10px] text-ink-3">{selected.report.employee?.full_name ?? 'Unknown'}</span>
              </div>
              <h3 className="text-xl font-bold text-ink">
                {selected.item.description || selected.report.title}
              </h3>
              <p className="text-sm text-ink-3 mt-0.5">{date(selected.item.date)} · {getCard(selected.item.id)}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-ink tabular-nums">{currency(selected.item.amount)}</p>
              <span className="text-xs font-semibold capitalize text-ink-3">{selected.item.category}</span>
            </div>
          </div>

          {/* Coding form + receipt */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6 p-6">
              {/* Coding fields */}
              <div className="space-y-5">
                {/* GL Account */}
                <div>
                  <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    GL Account
                  </label>
                  <input
                    type="text"
                    value={getGL(selected.item)}
                    onChange={(e) => setGL(selected.item.id, e.target.value)}
                    className="w-full px-3 py-2.5 border border-edge rounded-lg text-sm bg-surface-0 text-ink focus:outline-none focus:border-brand-600 transition-colors"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {Object.entries(GL_SUGGESTIONS).slice(0, 3).map(([cat, code]) => (
                      <button
                        key={cat}
                        onClick={() => setGL(selected.item.id, code)}
                        className="text-[10px] px-2 py-0.5 bg-surface-0 border border-edge rounded text-ink-3 hover:border-brand-600 hover:text-brand-600 transition-colors"
                      >
                        {code.split('–')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <Select
                    options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                    value={getDept(selected.item, selected.report)}
                    onChange={(v) => setDept(selected.item.id, v)}
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <Select
                    options={LOCATIONS.map((l) => ({ value: l, label: l }))}
                    value={getLoc(selected.item)}
                    onChange={(v) => setLoc(selected.item.id, v)}
                  />
                </div>

              </div>

              {/* Receipt preview + audit trail */}
              <div className="space-y-5">
                {/* Receipt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Receipt Preview</label>
                  </div>
                  <div className="h-44 bg-surface-0 border border-edge rounded-lg flex flex-col items-center justify-center gap-2 text-ink-3">
                    {selected.item.receipt_url ? (
                      <img src={selected.item.receipt_url} className="h-full w-full object-cover rounded-lg" alt="receipt" />
                    ) : (
                      <>
                        <FileText size={28} />
                        <p className="text-xs">No receipt uploaded</p>
                        <p className="text-[10px] text-ink-3/60">System suggested GL {getGL(selected.item).split('–')[0].trim()} based on merchant name.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Audit trail */}
                <div>
                  <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">
                    Audit Trail
                  </label>
                  <div className="space-y-2">
                    {[
                      { icon: Clock, label: 'Submitted', detail: date(selected.report.created_at), sub: selected.report.employee?.full_name },
                      { icon: CheckCircle, label: 'Approved', detail: selected.report.submitted_at ? date(selected.report.submitted_at) : '—', sub: 'Manager review' },
                      { icon: ScanLine, label: 'OCR extracted amount', detail: currency(selected.item.amount), sub: `System suggested GL ${getGL(selected.item).split('–')[0].trim()}` },
                    ].map((entry, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-surface-0 border border-edge flex items-center justify-center flex-shrink-0 mt-0.5">
                          <entry.icon size={11} className="text-ink-3" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-ink-2">{entry.label} <span className="text-ink-3">· {entry.detail}</span></p>
                          {entry.sub && <p className="text-[10px] text-ink-3">{entry.sub}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky action bar */}
          <div className="flex-shrink-0 border-t border-edge bg-surface-1/80 backdrop-blur-sm">
            {lastSubmitted ? (
              /* Post-action flash */
              <div className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-emerald-500">
                <CheckCircle size={16} /> Coded!
              </div>
            ) : (
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="text-xs text-ink-3">
                  Item <strong className="text-ink">{coded.size + selectedIdx + 1}</strong> of{' '}
                  <strong className="text-ink">{coded.size + queue.length}</strong> in queue
                </div>
                <div className="flex items-center gap-2">
                  {selectedIdx < queue.length - 1 && (
                    <button
                      onClick={() => setSelectedIdx((i) => i + 1)}
                      className="flex items-center gap-1.5 px-4 py-2 border border-edge rounded-lg text-sm font-medium text-ink-2 hover:bg-surface-hover transition-colors"
                    >
                      Skip <ChevronRight size={14} />
                    </button>
                  )}
                  <button
                    onClick={submitCoding}
                    disabled={submitting}
                    className="approve-ready flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                  >
                    {submitting ? (
                      <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                    ) : (
                      <><CheckCircle size={14} /> Submit Coding</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-surface-1 text-center px-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle size={30} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-ink mb-1">Queue Complete</p>
            <p className="text-sm text-ink-3">
              {coded.size > 0
                ? `You coded ${coded.size} transaction${coded.size !== 1 ? 's' : ''} this session.`
                : 'All transactions have been coded.'}
            </p>
          </div>
          <MotivationBar progress={1} message="All caught up — great work!" className="w-56" />
        </div>
      )}
    </div>
  )
}
