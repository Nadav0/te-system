import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { listPolicies, createPolicy, updatePolicy, deletePolicy } from '../../api/policy'
import { currency } from '../../utils/format'
import Spinner from '../../components/Spinner'
import type { PolicyRule } from '../../types'

const CATEGORIES = ['meals', 'transport', 'lodging', 'conference', 'tech', 'other', 'any']

const CATEGORY_TAGS: Record<string, string> = {
  meals: 'MEALS',
  transport: 'TRAVEL',
  lodging: 'LODGING',
  conference: 'CONF',
  tech: 'TECH',
  other: 'OTHER',
  any: 'ANY',
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

function buildLogicPreview(rule: PolicyRule | null, clauses: Clause[]): string {
  if (!rule) return ''
  const conditions = clauses
    .filter((c) => c.field && c.value)
    .map((c, i) => `${i === 0 ? '' : 'and '}${c.field.toLowerCase()} ${c.op.toLowerCase()} ${c.value.toLowerCase()}`)
    .join(' ')
  const maxAmt = rule.max_amount_per_day ?? rule.max_amount_per_item
  return conditions
    ? `"If an expense is ${conditions}, flag for review. Otherwise, auto-approve up to ${maxAmt ? currency(maxAmt) : 'the set limit'} daily."`
    : `"Auto-approve expenses up to ${maxAmt ? currency(maxAmt) : 'the set limit'} daily."`
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
  const [isNew, setIsNew] = useState(false)

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
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updatePolicy(id, { active }),
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
  }

  const openNew = () => {
    setSelectedId('__new__')
    setIsNew(true)
    setEditName('')
    setEditCategory('meals')
    setEditMaxAmount('')
    setEditClauses(defaultClauses())
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

  const selectedRule = (rules as PolicyRule[]).find((r) => r.id === selectedId) ?? null
  const editorOpen = selectedId !== null

  if (isLoading) return <Spinner className="h-96" />

  return (
    <div className="p-8 flex gap-6">
      {/* Left: policies grid */}
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Policies</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage global spending limits and automated approval workflows.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {(rules as PolicyRule[]).map((rule) => {
            const isSelected = rule.id === selectedId
            const rulesCount = 4
            return (
              <button
                key={rule.id}
                onClick={() => openRule(rule)}
                className={`text-left border-2 rounded-lg p-5 transition-all ${
                  isSelected ? 'border-black shadow-md' : 'border-gray-200 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 border border-gray-300 text-xs font-bold text-gray-600 rounded">
                    {CATEGORY_TAGS[rule.category] ?? rule.category.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      {rule.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleActiveMutation.mutate({ id: rule.id, active: !rule.active })
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        rule.active ? 'bg-black' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          rule.active ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-3">
                  {rule.description?.replace(/\s*\[clauses:.*?\]/, '') || rule.category}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Max Amount</p>
                    <p className="text-sm font-bold text-gray-900">
                      {rule.max_amount_per_day
                        ? currency(rule.max_amount_per_day)
                        : rule.max_amount_per_item
                        ? currency(rule.max_amount_per_item)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Rules Count</p>
                    <p className="text-sm font-bold text-gray-900">{rulesCount} Active</p>
                  </div>
                </div>
              </button>
            )
          })}

          {/* Create new policy card */}
          <button
            onClick={openNew}
            className="border-2 border-dashed border-gray-300 rounded-lg p-5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-colors min-h-[160px]"
          >
            <Plus size={24} />
            <span className="text-sm font-semibold uppercase tracking-wider">Create New Policy</span>
          </button>
        </div>
      </div>

      {/* Right: Policy Editor */}
      {editorOpen && (
        <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-5 self-start sticky top-20">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Policy Editor</h2>
            <button
              onClick={() => setSelectedId(null)}
              className="text-gray-400 hover:text-gray-700 p-0.5"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Policy Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Policy Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Maximum Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Maximum Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={editMaxAmount}
                  onChange={(e) => setEditMaxAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Conditions Builder */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Conditions Builder
              </label>
              <div className="space-y-2">
                {editClauses.map((clause, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-500 font-semibold w-7 flex-shrink-0">
                      {i === 0 ? 'IF' : 'AND'}
                    </span>
                    <input
                      value={clause.field}
                      onChange={(e) => updateClause(i, { field: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500 min-w-0"
                    />
                    <input
                      value={clause.op}
                      onChange={(e) => updateClause(i, { op: e.target.value })}
                      className="w-16 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                    />
                    <input
                      value={clause.value}
                      onChange={(e) => updateClause(i, { value: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500 min-w-0"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={addClause}
                className="mt-2 w-full py-1.5 border border-dashed border-gray-300 text-xs text-gray-500 rounded hover:border-gray-500 hover:text-gray-700 transition-colors"
              >
                + ADD CLAUSE
              </button>
            </div>

            {/* Approval Chain */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Approval Chain
              </label>
              <div className="flex items-center gap-1.5">
                {APPROVAL_CHAIN.map((a, i) => (
                  <div
                    key={i}
                    title={a.label}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm cursor-default ${
                      i === 2 ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {a.initials}
                  </div>
                ))}
                <span className="text-xs text-gray-500 ml-1">Finance Team Level 1</span>
              </div>
            </div>

            {/* Logic Preview */}
            {selectedRule && (
              <div className="bg-gray-50 border-l-2 border-gray-800 pl-3 py-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">LOGIC PREVIEW</p>
                <p className="text-xs text-gray-600 italic">
                  {buildLogicPreview(selectedRule, editClauses)}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 mt-5">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="py-2.5 bg-black text-white text-xs font-semibold rounded hover:bg-gray-800 transition-colors uppercase disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            {selectedRule && (
              <button
                onClick={() => {
                  if (confirm('Archive this policy?')) archiveMutation.mutate(selectedRule.id)
                }}
                className="py-2.5 border border-gray-300 text-xs font-semibold text-gray-700 rounded hover:bg-gray-50 transition-colors uppercase"
              >
                Archive
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
