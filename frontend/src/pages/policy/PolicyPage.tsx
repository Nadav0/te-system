import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, ShieldCheck, AlertOctagon, Zap, Eye, Users } from 'lucide-react'
import { listUsers } from '../../api/users'
import { listPolicies, createPolicy, updatePolicy, deletePolicy } from '../../api/policy'
import { currency } from '../../utils/format'
import Spinner from '../../components/Spinner'
import type { PolicyRule } from '../../types'

const CATEGORIES = ['meals', 'transport', 'lodging', 'conference', 'tech', 'other', 'any']

const ENFORCEMENT_MODES: Record<string, { label: string; color: string }> = {
  meals: { label: 'Enforcing', color: 'bg-emerald-400/10 text-emerald-400' },
  transport: { label: 'Strict', color: 'bg-blue-400/10 text-blue-400' },
  lodging: { label: 'Auto-Reject', color: 'bg-red-400/10 text-red-400' },
  conference: { label: 'Observation', color: 'bg-ink-3/10 text-ink-3' },
  tech: { label: 'Enforcing', color: 'bg-emerald-400/10 text-emerald-400' },
  other: { label: 'Enforcing', color: 'bg-emerald-400/10 text-emerald-400' },
  any: { label: 'Strict', color: 'bg-blue-400/10 text-blue-400' },
}

const CATEGORY_TAGS: Record<string, string> = {
  meals: 'MEALS', transport: 'TRAVEL', lodging: 'LODGING',
  conference: 'CONF', tech: 'TECH', other: 'OTHER', any: 'ANY',
}

type Clause = { field: string; op: string; value: string }

function defaultClauses(): Clause[] {
  return [{ field: 'Expense Type', op: 'EQUALS', value: '' }]
}

function parseClauses(description: string): Clause[] {
  if (!description) return defaultClauses()
  try {
    const match = description.match(/\[clauses:(.*?)\]/)
    if (match) return JSON.parse(match[1])
  } catch {}
  return defaultClauses()
}

function buildDescription(base: string, clauses: Clause[]): string {
  const stripped = base.replace(/\s*\[clauses:.*?\]/, '')
  return `${stripped} [clauses:${JSON.stringify(clauses)}]`
}

const APPROVAL_CHAIN = [
  { initials: 'JD', label: 'John D.' },
  { initials: 'MK', label: 'Mary K.' },
  { initials: '+1', label: 'Finance Team Level 1' },
]

export default function PolicyPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('meals')
  const [editMaxAmount, setEditMaxAmount] = useState('')
  const [editClauses, setEditClauses] = useState<Clause[]>(defaultClauses())
  const [editAction, setEditAction] = useState<'flag' | 'reject'>('flag')
  const [isNew, setIsNew] = useState(false)
  const [targetPickerOpen, setTargetPickerOpen] = useState(false)
  const [editTargets, setEditTargets] = useState<string[]>(['JD', 'MK', '+1'])

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['policy'],
    queryFn: listPolicies,
  })

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      selectedId !== null && selectedId !== '__new__' && !isNew
        ? updatePolicy(selectedId, data)
        : createPolicy(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policy'] })
      setSelectedId(null)
      setIsNew(false)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updatePolicy(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policy'] }),
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => deletePolicy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policy'] })
      setSelectedId(null)
    },
  })

  const openRule = (rule: PolicyRule) => {
    setSelectedId(rule.id)
    setIsNew(false)
    setEditName(rule.description?.replace(/\s*\[clauses:.*?\]/, '') ?? '')
    setEditCategory(rule.category)
    setEditMaxAmount(String(rule.max_amount_per_day ?? rule.max_amount_per_item ?? ''))
    setEditClauses(parseClauses(rule.description ?? ''))
    setEditAction('flag')
  }

  const openNew = () => {
    setSelectedId('__new__')
    setIsNew(true)
    setEditName('')
    setEditCategory('meals')
    setEditMaxAmount('')
    setEditClauses(defaultClauses())
    setEditAction('flag')
  }

  const handleSave = () => {
    const amt = editMaxAmount ? parseFloat(editMaxAmount) : null
    saveMutation.mutate({
      category: editCategory,
      description: buildDescription(editName, editClauses),
      max_amount_per_day: amt ?? undefined,
      active: true,
    })
  }

  const addClause = () =>
    setEditClauses((prev) => [...prev, { field: 'Receipt', op: 'IS', value: '' }])

  const updateClause = (i: number, patch: Partial<Clause>) =>
    setEditClauses((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))

  const { data: allUsers = [] } = useQuery({ queryKey: ['users'], queryFn: listUsers })

  const selectedRule = (rules as PolicyRule[]).find((r) => r.id === selectedId) ?? null
  const editorOpen = selectedId !== null

  if (isLoading) return <Spinner className="h-96" />

  const ruleList = rules as PolicyRule[]
  const activeCount = ruleList.filter((r) => r.active).length
  const totalCount = ruleList.length
  const healthScore = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0
  const autoRejectCount = ruleList.filter((r) => r.active && (r.max_amount_per_item != null || r.max_amount_per_day != null)).length

  return (
    <div className="p-8 flex gap-6">
      {/* Left: main content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">Policy Management</h1>
            <p className="text-sm text-ink-3 mt-0.5">Configure automated enforcement and compliance thresholds for global expenses.</p>
          </div>
          <button
            onClick={openNew}
            className="btn-primary flex items-center gap-1.5"
          >
            <Plus size={15} /> Create New Rule
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Health Score */}
          <div className="card p-5 col-span-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Policy Health Score</p>
                <p className="text-4xl font-bold text-ink">{healthScore}<span className="text-xl text-ink-3">%</span></p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                <ShieldCheck size={20} className="text-emerald-400" />
              </div>
            </div>
            <div className="h-1.5 bg-surface-0 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${healthScore}%`, background: 'linear-gradient(90deg, #34d399, #059669)' }}
              />
            </div>
            <p className="text-xs text-emerald-400 mt-2 font-medium">+2.4% vs last month</p>
          </div>

          {/* Auto-rejected */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Auto-Rejected (30d)</p>
                <p className="text-3xl font-bold text-ink">{autoRejectCount}</p>
                <p className="text-xs text-amber-400 mt-1 font-medium">High activity alert</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
                <AlertOctagon size={20} className="text-amber-400" />
              </div>
            </div>
          </div>

          {/* Active rules */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Active Rules</p>
                <p className="text-3xl font-bold text-ink">{activeCount}</p>
                <p className="text-xs text-ink-3 mt-1">{totalCount} global policies</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-600/10 flex items-center justify-center">
                <Zap size={20} className="text-brand-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Policies label */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Active Policies</p>
          <span className="text-xs text-ink-3">{activeCount} of {totalCount} enforcing</span>
        </div>

        {/* Policy cards grid */}
        <div className="grid grid-cols-2 gap-4">
          {ruleList.map((rule) => {
            const isSelected = rule.id === selectedId
            const enforcement = ENFORCEMENT_MODES[rule.category] ?? ENFORCEMENT_MODES.other
            return (
              <button
                key={rule.id}
                onClick={() => openRule(rule)}
                className={`text-left border rounded-xl p-5 transition-all ${
                  isSelected
                    ? 'border-brand-600 bg-brand-600/5'
                    : 'border-edge bg-surface-1 hover:border-edge-hi'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 border border-edge-hi text-[10px] font-bold text-ink-2 rounded uppercase tracking-wider">
                      {CATEGORY_TAGS[rule.category] ?? rule.category.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${enforcement.color}`}>
                      {enforcement.label}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleActiveMutation.mutate({ id: rule.id, active: !rule.active })
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                      rule.active ? 'bg-brand-600' : 'bg-edge-hi'
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      rule.active ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <p className="text-base font-bold text-ink mb-3 leading-snug">
                  {rule.description?.replace(/\s*\[clauses:.*?\]/, '') || rule.category}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-ink-3 uppercase tracking-wider mb-0.5">Max Amount</p>
                    <p className="font-bold text-ink">
                      {rule.max_amount_per_day
                        ? `${currency(rule.max_amount_per_day)}/day`
                        : rule.max_amount_per_item
                        ? currency(rule.max_amount_per_item)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-3 uppercase tracking-wider mb-0.5">Status</p>
                    <p className={`font-bold ${rule.active ? 'text-emerald-400' : 'text-ink-3'}`}>
                      {rule.active ? 'Active' : 'Paused'}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}

          {/* Create new */}
          <button
            onClick={openNew}
            className="border-2 border-dashed border-edge rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-ink-3 hover:border-brand-600/50 hover:text-ink-2 transition-all min-h-[160px]"
          >
            <Plus size={24} />
            <span className="text-xs font-semibold uppercase tracking-wider">Create New Policy</span>
          </button>
        </div>
      </div>

      {/* Right: Rule Editor slide-out */}
      {editorOpen && (
        <div className="w-80 flex-shrink-0 bg-surface-1 border border-edge rounded-xl p-5 self-start sticky top-20">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-ink">Rule Editor</h2>
            <button onClick={() => setSelectedId(null)} className="text-ink-3 hover:text-ink-2 p-0.5">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Policy Name */}
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Policy Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-edge rounded-lg text-sm bg-surface-0 text-ink focus:outline-none focus:border-edge-hi"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 border border-edge rounded-lg text-sm bg-surface-0 text-ink focus:outline-none focus:border-edge-hi"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Threshold Conditions
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={editMaxAmount}
                  onChange={(e) => setEditMaxAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-edge rounded-lg text-sm bg-surface-0 text-ink focus:outline-none focus:border-edge-hi"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Automated Action */}
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">
                Automated Action
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEditAction('flag')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    editAction === 'flag'
                      ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                      : 'border-edge text-ink-3 hover:bg-surface-hover'
                  }`}
                >
                  <Eye size={12} /> Flag Review
                </button>
                <button
                  onClick={() => setEditAction('reject')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    editAction === 'reject'
                      ? 'bg-red-400/10 border-red-400/30 text-red-400'
                      : 'border-edge text-ink-3 hover:bg-surface-hover'
                  }`}
                >
                  <AlertOctagon size={12} /> Auto-Reject
                </button>
              </div>
            </div>

            {/* Conditions Builder */}
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">
                Conditions Builder
              </label>
              <div className="space-y-2">
                {editClauses.map((clause, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="text-ink-3 font-semibold w-7 flex-shrink-0">{i === 0 ? 'IF' : 'AND'}</span>
                    <input
                      value={clause.field}
                      onChange={(e) => updateClause(i, { field: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-edge rounded bg-surface-0 text-ink text-xs focus:outline-none focus:border-edge-hi min-w-0"
                    />
                    <input
                      value={clause.op}
                      onChange={(e) => updateClause(i, { op: e.target.value })}
                      className="w-14 px-2 py-1.5 border border-edge rounded bg-surface-0 text-ink text-xs focus:outline-none focus:border-edge-hi"
                    />
                    <input
                      value={clause.value}
                      onChange={(e) => updateClause(i, { value: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-edge rounded bg-surface-0 text-ink text-xs focus:outline-none focus:border-edge-hi min-w-0"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={addClause}
                className="mt-2 w-full py-1.5 border border-dashed border-edge text-[10px] text-ink-3 rounded hover:border-edge-hi hover:text-ink-2 transition-colors uppercase tracking-wider"
              >
                + Add Clause
              </button>
            </div>

            {/* Recipients */}
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">
                Recipients & Applicability
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {editTargets.map((t, i) => (
                  <div
                    key={i}
                    title={t}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-surface-1 bg-brand-600 text-white"
                  >
                    {t}
                  </div>
                ))}
                <div className="relative ml-1">
                  <button
                    onClick={() => setTargetPickerOpen(!targetPickerOpen)}
                    className="text-[10px] text-brand-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <Users size={10} /> + Add Target
                  </button>
                  {targetPickerOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setTargetPickerOpen(false)} />
                      <div className="absolute left-0 top-full mt-1 bg-surface-2 border border-edge-hi rounded-xl z-20 py-1 min-w-[180px]">
                        <p className="px-3 py-1.5 text-xs text-ink-3 uppercase tracking-wider font-semibold">Add approver</p>
                        {(allUsers as any[]).slice(0, 6).map((u: any) => {
                          const ini = u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
                          const already = editTargets.includes(ini)
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                if (!already) setEditTargets((prev) => [...prev, ini])
                                setTargetPickerOpen(false)
                              }}
                              disabled={already}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-hover transition-colors flex items-center gap-2 ${already ? 'text-ink-3' : 'text-ink-2'}`}
                            >
                              <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">{ini}</span>
                              {u.full_name} {already && '✓'}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 mt-5">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition-colors uppercase tracking-wider disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving…' : isNew ? 'Create Policy' : 'Update Policy'}
            </button>
            {selectedRule && (
              <button
                onClick={() => { if (confirm('Delete this policy rule? This cannot be undone.')) archiveMutation.mutate(selectedRule.id) }}
                className="py-2.5 border border-red-400/30 text-xs font-semibold text-red-400 rounded-lg hover:bg-red-500/10 transition-colors uppercase tracking-wider"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
