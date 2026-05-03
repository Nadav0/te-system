import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, FileDown, Printer, Search, AlertTriangle } from 'lucide-react'
import { listExpenses } from '../../api/expenses'
import { listTravel } from '../../api/travel'
import { useAuthStore } from '../../store/auth'
import { currency, date, statusLabel } from '../../utils/format'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import type { ExpenseReport, TravelRequest } from '../../types'

// ─── Types ───────────────────────────────────────────────────────────────────

type ReportType = 'expenses' | 'travel' | 'both'
type ExportFormat = 'csv' | 'pdf'

interface Filters {
  reportType: ReportType
  dateFrom: string
  dateTo: string
  status: string
  employeeSearch: string
}

const EXPENSE_STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'rejected']
const TRAVEL_STATUSES = ['draft', 'submitted', 'approved', 'rejected']

function statusOptions(reportType: ReportType) {
  const statuses = reportType === 'travel' ? TRAVEL_STATUSES : EXPENSE_STATUSES
  return statuses
}

// ─── CSV Helpers ──────────────────────────────────────────────────────────────

function csvEscape(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

function downloadCSV(
  expenses: ExpenseReport[],
  travel: TravelRequest[],
  reportType: ReportType,
) {
  const rows: string[] = []

  if (reportType !== 'travel' && expenses.length > 0) {
    rows.push('EXPENSE REPORTS')
    rows.push(
      ['Title', 'Employee', 'Department', 'Status', 'Total Amount', 'Currency',
        'Created', 'Submitted', 'Has Violations']
        .map(csvEscape).join(','),
    )
    for (const r of expenses) {
      rows.push(
        [
          r.title,
          r.employee?.full_name ?? '',
          r.employee?.department ?? '',
          statusLabel(r.status),
          String(r.total_amount),
          r.currency,
          date(r.created_at),
          r.submitted_at ? date(r.submitted_at) : '',
          r.has_violations ? 'Yes' : 'No',
        ].map(csvEscape).join(','),
      )
    }
    rows.push('')
  }

  if (reportType !== 'expenses' && travel.length > 0) {
    rows.push('TRAVEL REQUESTS')
    rows.push(
      ['Destination', 'Employee', 'Department', 'Purpose', 'Departure', 'Return',
        'Budget', 'Status', 'Created']
        .map(csvEscape).join(','),
    )
    for (const t of travel) {
      rows.push(
        [
          t.destination,
          t.employee?.full_name ?? '',
          t.employee?.department ?? '',
          t.purpose,
          date(t.departure_date),
          date(t.return_date),
          String(t.estimated_budget),
          statusLabel(t.status),
          date(t.created_at),
        ].map(csvEscape).join(','),
      )
    }
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `travelex-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── StepIndicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Configure' },
    { n: 2, label: 'Preview' },
    { n: 3, label: 'Export' },
  ]
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const done = s.n < current
        const active = s.n === current
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                  done
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : active
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {done ? <Check size={15} /> : s.n}
              </div>
              <span
                className={`text-xs mt-1.5 font-semibold ${
                  active ? 'text-brand-600' : done ? 'text-gray-500' : 'text-gray-300'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-24 mx-2 mb-5 rounded transition-all ${
                  current > s.n ? 'bg-brand-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── ReportPrintView ─────────────────────────────────────────────────────────

function ReportPrintView({
  filters,
  expenses,
  travel,
}: {
  filters: Filters
  expenses: ExpenseReport[]
  travel: TravelRequest[]
}) {
  return (
    <div className="hidden print:block p-8 font-sans text-gray-900">
      <div className="mb-6 border-b border-gray-300 pb-4">
        <h1 className="text-2xl font-bold">Travelex — Expense &amp; Travel Report</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generated {new Date().toLocaleDateString()}
          {filters.dateFrom && ` · From: ${date(filters.dateFrom)}`}
          {filters.dateTo && ` · To: ${date(filters.dateTo)}`}
          {filters.status && ` · Status: ${statusLabel(filters.status)}`}
          {filters.employeeSearch && ` · Employee: ${filters.employeeSearch}`}
        </p>
      </div>

      {expenses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            Expense Reports ({expenses.length})
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-400">
                <th className="text-left py-2 pr-4">Title</th>
                <th className="text-left py-2 pr-4">Employee</th>
                <th className="text-left py-2 pr-4">Dept</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-right py-2 pr-4">Amount</th>
                <th className="text-left py-2">Violations</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((r) => (
                <tr key={r.id} className="border-b border-gray-200">
                  <td className="py-1.5 pr-4">{r.title}</td>
                  <td className="py-1.5 pr-4">{r.employee?.full_name ?? '—'}</td>
                  <td className="py-1.5 pr-4">{r.employee?.department ?? '—'}</td>
                  <td className="py-1.5 pr-4">{statusLabel(r.status)}</td>
                  <td className="py-1.5 pr-4 text-right">{currency(r.total_amount, r.currency)}</td>
                  <td className="py-1.5">{r.has_violations ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {travel.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Travel Requests ({travel.length})
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-400">
                <th className="text-left py-2 pr-4">Destination</th>
                <th className="text-left py-2 pr-4">Employee</th>
                <th className="text-left py-2 pr-4">Dept</th>
                <th className="text-left py-2 pr-4">Dates</th>
                <th className="text-right py-2 pr-4">Budget</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {travel.map((t) => (
                <tr key={t.id} className="border-b border-gray-200">
                  <td className="py-1.5 pr-4">{t.destination}</td>
                  <td className="py-1.5 pr-4">{t.employee?.full_name ?? '—'}</td>
                  <td className="py-1.5 pr-4">{t.employee?.department ?? '—'}</td>
                  <td className="py-1.5 pr-4">
                    {date(t.departure_date)} → {date(t.return_date)}
                  </td>
                  <td className="py-1.5 pr-4 text-right">{currency(t.estimated_budget)}</td>
                  <td className="py-1.5">{statusLabel(t.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user)
  const canSeeAllEmployees = user?.role === 'manager' || user?.role === 'finance'

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [filters, setFilters] = useState<Filters>({
    reportType: 'both',
    dateFrom: '',
    dateTo: '',
    status: '',
    employeeSearch: '',
  })
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')

  // ── Data fetching (Step 2) ──────────────────────────────────────────────

  const { data: allExpenses = [], isLoading: expLoading } = useQuery({
    queryKey: ['report-wizard', 'expenses', filters.status],
    queryFn: () => listExpenses(filters.status || undefined),
    enabled: filters.reportType !== 'travel',
  })

  const { data: allTravel = [], isLoading: travelLoading } = useQuery({
    queryKey: ['report-wizard', 'travel', filters.status],
    queryFn: () => listTravel(filters.status || undefined),
    enabled: filters.reportType !== 'expenses',
  })

  // ── Client-side filtering ───────────────────────────────────────────────

  const filteredExpenses = useMemo<ExpenseReport[]>(() => {
    if (filters.reportType === 'travel') return []
    return (allExpenses as ExpenseReport[]).filter((r) => {
      const d = r.created_at.slice(0, 10)
      if (filters.dateFrom && d < filters.dateFrom) return false
      if (filters.dateTo && d > filters.dateTo) return false
      if (filters.employeeSearch) {
        const name = r.employee?.full_name?.toLowerCase() ?? ''
        if (!name.includes(filters.employeeSearch.toLowerCase())) return false
      }
      return true
    })
  }, [allExpenses, filters])

  const filteredTravel = useMemo<TravelRequest[]>(() => {
    if (filters.reportType === 'expenses') return []
    return (allTravel as TravelRequest[]).filter((t) => {
      const d = t.created_at.slice(0, 10)
      if (filters.dateFrom && d < filters.dateFrom) return false
      if (filters.dateTo && d > filters.dateTo) return false
      if (filters.employeeSearch) {
        const name = t.employee?.full_name?.toLowerCase() ?? ''
        if (!name.includes(filters.employeeSearch.toLowerCase())) return false
      }
      return true
    })
  }, [allTravel, filters])

  const totalResults = filteredExpenses.length + filteredTravel.length
  const isLoading = expLoading || travelLoading

  // ── Helpers ─────────────────────────────────────────────────────────────

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function handleTypeChange(t: ReportType) {
    setFilters((prev) => ({ ...prev, reportType: t, status: '' }))
  }

  // ── Step 1: Configure ───────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="p-8 max-w-2xl print:hidden">
        <StepIndicator current={1} />
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Export Report</h1>
        <p className="text-sm text-gray-500 mb-6">Configure your report filters, then preview and download.</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          {/* Report Type */}
          <div>
            <label className="label">Report Type</label>
            <div className="flex gap-2 mt-1">
              {(['expenses', 'travel', 'both'] as ReportType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    filters.reportType === t
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {t === 'expenses' ? 'Expenses' : t === 'travel' ? 'Travel Requests' : 'Both'}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilter('dateFrom', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">To</label>
              <input
                type="date"
                value={filters.dateTo}
                min={filters.dateFrom || undefined}
                onChange={(e) => setFilter('dateTo', e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilter('status', e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              {statusOptions(filters.reportType).map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </div>

          {/* Employee Search (manager/finance only) */}
          {canSeeAllEmployees && (
            <div>
              <label className="label">Employee Name</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.employeeSearch}
                  onChange={(e) => setFilter('employeeSearch', e.target.value)}
                  className="input pl-8"
                  placeholder="Filter by employee name…"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button className="btn-primary" onClick={() => setStep(2)}>
            Preview Results →
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Preview ─────────────────────────────────────────────────────

  if (step === 2) {
    return (
      <div className="p-8 max-w-5xl print:hidden">
        <StepIndicator current={2} />
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Preview</h1>
        <p className="text-sm text-gray-500 mb-6">Review the records that match your filters.</p>

        {isLoading ? (
          <Spinner className="h-64" />
        ) : (
          <>
            {/* Summary bar */}
            <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-brand-50 border border-brand-100 rounded-xl text-sm text-brand-700 font-medium">
              <span>{filteredExpenses.length} expense report{filteredExpenses.length !== 1 ? 's' : ''}</span>
              {filters.reportType === 'both' && <span className="text-brand-300">·</span>}
              {filters.reportType !== 'expenses' && (
                <span>{filteredTravel.length} travel request{filteredTravel.length !== 1 ? 's' : ''}</span>
              )}
              <span className="ml-auto text-brand-500">{totalResults} total records</span>
            </div>

            {totalResults === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl text-center py-16">
                <p className="text-gray-400 font-semibold">No records match your filters</p>
                <p className="text-sm text-gray-400 mt-1">Go back and adjust your filters.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Expenses table */}
                {filteredExpenses.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Expense Reports</h3>
                      <span className="text-xs text-gray-400">{filteredExpenses.length} records</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredExpenses.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3 font-medium text-gray-900">
                              {r.title}
                              {r.has_violations && (
                                <span className="ml-2 inline-flex items-center gap-1 text-amber-500 text-xs">
                                  <AlertTriangle size={11} /> violations
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-gray-600">
                              <p>{r.employee?.full_name ?? '—'}</p>
                              {r.employee?.department && (
                                <p className="text-xs text-gray-400">{r.employee.department}</p>
                              )}
                            </td>
                            <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-800">
                              {currency(r.total_amount, r.currency)}
                            </td>
                            <td className="px-5 py-3 text-gray-500">{date(r.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Travel table */}
                {filteredTravel.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Travel Requests</h3>
                      <span className="text-xs text-gray-400">{filteredTravel.length} records</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Destination</th>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredTravel.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3 font-medium text-gray-900">{t.destination}</td>
                            <td className="px-5 py-3 text-gray-600">
                              <p>{t.employee?.full_name ?? '—'}</p>
                              {t.employee?.department && (
                                <p className="text-xs text-gray-400">{t.employee.department}</p>
                              )}
                            </td>
                            <td className="px-5 py-3 text-gray-500">
                              {date(t.departure_date)} → {date(t.return_date)}
                            </td>
                            <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-800">
                              {currency(t.estimated_budget)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 justify-between mt-6">
          <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
          <button
            className="btn-primary"
            disabled={totalResults === 0 || isLoading}
            onClick={() => setStep(3)}
          >
            Proceed to Export →
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Export ──────────────────────────────────────────────────────

  return (
    <>
      <div className="p-8 max-w-2xl print:hidden">
        <StepIndicator current={3} />
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Export</h1>
        <p className="text-sm text-gray-500 mb-6">
          Choose your export format — {totalResults} record{totalResults !== 1 ? 's' : ''} ready.
        </p>

        {/* Format cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {([
            {
              format: 'csv' as ExportFormat,
              icon: FileDown,
              title: 'CSV Spreadsheet',
              desc: 'Download as .csv — open in Excel, Google Sheets, or any spreadsheet app.',
            },
            {
              format: 'pdf' as ExportFormat,
              icon: Printer,
              title: 'PDF / Print',
              desc: 'Opens the browser print dialog with a clean, formatted layout.',
            },
          ]).map(({ format, icon: Icon, title, desc }) => (
            <button
              key={format}
              onClick={() => setExportFormat(format)}
              className={`text-left p-5 rounded-2xl border-2 transition-all ${
                exportFormat === format
                  ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600 ring-offset-1'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon
                size={28}
                className={`mb-3 ${exportFormat === format ? 'text-brand-600' : 'text-gray-400'}`}
              />
              <p className={`font-semibold text-sm mb-1 ${exportFormat === format ? 'text-brand-700' : 'text-gray-800'}`}>
                {title}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </button>
          ))}
        </div>

        <button
          className="btn-primary w-full py-3 text-base"
          onClick={() => {
            if (exportFormat === 'csv') {
              downloadCSV(filteredExpenses, filteredTravel, filters.reportType)
            } else {
              window.print()
            }
          }}
        >
          {exportFormat === 'csv' ? 'Download CSV' : 'Open Print Dialog'}
        </button>

        <div className="text-center mt-4">
          <button
            className="text-sm text-brand-600 hover:underline"
            onClick={() => setStep(2)}
          >
            ← Back to Preview
          </button>
        </div>
      </div>

      {/* Print view — hidden in browser, visible when printing */}
      <ReportPrintView
        filters={filters}
        expenses={filteredExpenses}
        travel={filteredTravel}
      />
    </>
  )
}
