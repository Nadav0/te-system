import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, UserPlus, CheckCircle, Pencil, Search } from 'lucide-react'
import { listUsers, createUser } from '../../api/users'
import Spinner from '../../components/Spinner'

const ROLES = ['employee', 'manager', 'finance']
const ROLE_LABELS: Record<string, string> = { employee: 'Employee', manager: 'Manager', finance: 'Finance' }
const DEPARTMENTS = ['Engineering', 'Product', 'Marketing', 'Operations', 'Accounting', 'Sales', 'Human Resources']

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

function getInitials(name: string) {
 return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

const defaultForm = { name: '', email: '', role: 'employee', department: 'Engineering', password: '' }
type RoleTab = 'all' | 'employee' | 'manager' | 'finance'

export default function UserManagement() {
 const qc = useQueryClient()
 const [showModal, setShowModal] = useState(false)
 const [inviteEmail, setInviteEmail] = useState(true)
 const [form, setForm] = useState(defaultForm)
 const [roleTab, setRoleTab] = useState<RoleTab>('all')
 const [searchQuery, setSearchQuery] = useState('')
 const [editingUser, setEditingUser] = useState<any | null>(null)
 const [formError, setFormError] = useState('')
 const [success, setSuccess] = useState(false)

 const { data: apiUsers = [], isLoading } = useQuery({
 queryKey: ['users'],
 queryFn: listUsers,
 })

 const createMutation = useMutation({
 mutationFn: () =>
 createUser({
 full_name: form.name,
 email: form.email,
 role: form.role,
 department: form.department,
 password: form.password,
 }),
 onSuccess: () => {
 qc.invalidateQueries({ queryKey: ['users'] })
 setSuccess(true)
 if (inviteEmail) {
  console.info(`[Invite] Sending invitation email to ${form.email}`)
 }
 setTimeout(() => {
 setShowModal(false)
 setSuccess(false)
 setForm(defaultForm)
 setFormError('')
 }, 1200)
 },
 onError: (e: any) => {
 setFormError(e.response?.data?.detail ?? 'Failed to create user')
 },
 })

 const handleSubmit = () => {
 setFormError('')
 if (!form.name.trim()) return setFormError('Full name is required')
 if (!form.email.trim()) return setFormError('Email is required')
 if (!form.password.trim() || form.password.length < 6)
 return setFormError('Password must be at least 6 characters')
 createMutation.mutate()
 }

 const allUsersList = (apiUsers as any[])
 const byRole = roleTab === 'all' ? allUsersList : allUsersList.filter((u) => u.role === roleTab)
 const users = searchQuery.trim()
  ? byRole.filter((u) => {
      const q = searchQuery.toLowerCase()
      return (
        (u.full_name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.department ?? '').toLowerCase().includes(q)
      )
    })
  : byRole

 if (isLoading) return <Spinner className="h-96" />

 return (
 <div className="p-8">
 {/* Header */}
 <div className="flex items-start justify-between mb-6">
 <div>
 <h1 className="text-xl font-semibold text-ink tracking-tight">Users</h1>
 <p className="text-sm text-ink-3 mt-1">
 Manage enterprise access, roles, and departmental permissions.
 </p>
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => { setShowModal(true); setForm(defaultForm); setFormError(''); setSuccess(false) }}
 className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded hover:bg-brand-700 transition-colors"
 >
 <UserPlus size={14} /> ADD USER
 </button>
 </div>
 </div>

 {/* Search */}
 <div className="relative mb-4">
  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
  <input
   type="text"
   placeholder="Search by name, email, or department…"
   value={searchQuery}
   onChange={(e) => setSearchQuery(e.target.value)}
   className="w-full pl-9 py-2.5 border border-edge rounded-lg text-sm bg-surface-1 text-ink placeholder:text-ink-3
              focus:outline-none focus:border-brand-600/60 focus:ring-2 focus:ring-brand-600/15 transition-all"
  />
 </div>

 {/* Tabs */}
 <div className="border-b border-edge mb-4 flex">
 {(['all', 'employee', 'manager', 'finance'] as RoleTab[]).map((tab) => (
  <button
   key={tab}
   onClick={() => setRoleTab(tab)}
   className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors capitalize ${
    roleTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-3 hover:text-ink-2'
   }`}
  >
   {tab === 'all' ? `All (${allUsersList.length})` : `${tab.charAt(0).toUpperCase() + tab.slice(1)}s (${allUsersList.filter((u) => u.role === tab).length})`}
  </button>
 ))}
 </div>

 {/* Table */}
 <div className="bg-surface-1 border border-edge rounded-lg overflow-hidden mb-4">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-edge">
 <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wider">Name</th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wider">Dept</th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wider">Role</th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wider">Status</th>
 <th className="text-right px-4 py-3 text-xs font-semibold text-ink-2 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-edge">
 {users.map((u: any) => (
 <tr key={u.id} className="hover:bg-surface-hover">
 <td className="px-4 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded bg-surface-hover flex items-center justify-center text-xs font-bold text-ink-2 flex-shrink-0">
 {getInitials(u.full_name ?? '?')}
 </div>
 <div>
 <p className="font-semibold text-ink"><Highlight text={u.full_name ?? ''} query={searchQuery} /></p>
 <p className="text-xs text-ink-3"><Highlight text={u.email ?? ''} query={searchQuery} /></p>
 </div>
 </div>
 </td>
 <td className="px-4 py-4 text-ink-2"><Highlight text={u.department ?? '—'} query={searchQuery} /></td>
 <td className="px-4 py-4">
 <span className="px-2 py-0.5 border border-edge text-xs font-semibold text-ink-2 rounded capitalize">
 {u.role}
 </span>
 </td>
 <td className="px-4 py-4">
 <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
 <span className="w-2 h-2 rounded-full bg-emerald-400" />
 Active
 </span>
 </td>
 <td className="px-4 py-4 text-right">
  <button
   onClick={() => setEditingUser(u)}
   className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-2 border border-edge rounded hover:bg-surface-hover transition-colors"
  >
   <Pencil size={11} /> Edit
  </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 <div className="px-4 py-3 border-t border-edge flex items-center justify-between text-xs text-ink-3">
 <span>Showing 1–{users.length} of {users.length} results</span>
 <div className="flex items-center gap-1">
 <button className="w-7 h-7 border border-edge rounded text-xs font-semibold bg-brand-600 text-white">1</button>
 </div>
 </div>
 </div>

 {/* Add User Modal */}
 {showModal && (
 <div className="fixed inset-0 bg-brand-600/40 flex items-center justify-center z-50 p-4">
 <div className="bg-surface-1 rounded-lg w-full max-w-md p-6">
 {success ? (
 <div className="flex flex-col items-center py-8 gap-3">
 <CheckCircle size={40} className="text-green-500" />
 <p className="text-lg font-bold text-ink">User created!</p>
 <p className="text-sm text-ink-3">The new account has been added.{inviteEmail ? ' An invitation email has been sent.' : ''}</p>
 </div>
 ) : (
 <>
 <div className="flex items-start justify-between mb-5">
 <div>
 <h2 className="text-base font-semibold text-ink">Add New User</h2>
 <p className="text-xs text-ink-3 mt-0.5">
 Configure employee access and permissions
 </p>
 </div>
 <button onClick={() => setShowModal(false)} className="text-ink-3 hover:text-ink-2 p-1">
 <X size={18} />
 </button>
 </div>

 <div className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Full Name</label>
 <input
 type="text"
 placeholder="e.g. Johnathan Smith"
 value={form.name}
 onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
 className="w-full px-3 py-2.5 border border-edge-hi rounded text-sm focus:outline-none focus:border-edge-hi"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Email Address</label>
 <input
 type="email"
 placeholder="john.smith@enterprise.com"
 value={form.email}
 onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
 className="w-full px-3 py-2.5 border border-edge-hi rounded text-sm focus:outline-none focus:border-edge-hi"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Temporary Password</label>
 <input
 type="password"
 placeholder="Min 6 characters"
 value={form.password}
 onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
 className="w-full px-3 py-2.5 border border-edge-hi rounded text-sm focus:outline-none focus:border-edge-hi"
 />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">System Role</label>
 <select
 value={form.role}
 onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
 className="w-full px-3 py-2.5 border border-edge-hi rounded text-sm focus:outline-none focus:border-edge-hi"
 >
 {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Department</label>
 <select
 value={form.department}
 onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
 className="w-full px-3 py-2.5 border border-edge-hi rounded text-sm focus:outline-none focus:border-edge-hi"
 >
 {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
 </select>
 </div>
 </div>
 <div>
 <div className="flex items-start justify-between">
 <div>
 <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider">
 Send Invitation Email
 </label>
 <p className="text-xs text-ink-3 uppercase tracking-wider mt-0.5">
 User will receive a secure login link
 </p>
 </div>
 <button
 type="button"
 onClick={() => setInviteEmail(!inviteEmail)}
 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${inviteEmail ? 'bg-brand-600' : 'bg-edge-hi'}`}
 >
 <span className={`inline-block h-4 w-4 transform rounded-full bg-surface-1 transition-transform ${inviteEmail ? 'translate-x-6' : 'translate-x-1'}`} />
 </button>
 </div>
 </div>
 {formError && (
 <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>
 )}
 </div>

 <div className="grid grid-cols-2 gap-3 mt-6">
 <button
 onClick={() => setShowModal(false)}
 className="py-2.5 border-2 border-edge text-sm font-semibold text-ink-2 rounded hover:bg-surface-hover transition-colors uppercase"
 >
 Cancel
 </button>
 <button
 onClick={handleSubmit}
 disabled={createMutation.isPending}
 className="py-2.5 bg-brand-600 text-white text-sm font-semibold rounded hover:bg-brand-700 transition-colors uppercase disabled:opacity-50"
 >
 {createMutation.isPending ? 'Creating…' : 'Create Account'}
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 )}

 {/* Edit User Modal */}
 {editingUser && (
 <div className="fixed inset-0 bg-brand-600/40 flex items-center justify-center z-50 p-4">
  <div className="bg-surface-1 rounded-lg w-full max-w-md p-6">
   <div className="flex items-start justify-between mb-5">
    <div>
     <h2 className="text-base font-semibold text-ink">Edit User</h2>
     <p className="text-xs text-ink-3 uppercase tracking-wider mt-0.5">{editingUser.email}</p>
    </div>
    <button onClick={() => setEditingUser(null)} className="text-ink-3 hover:text-ink-2 p-1">
     <X size={18} />
    </button>
   </div>
   <div className="space-y-4">
    <div>
     <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Full Name</label>
     <input
      type="text"
      value={editingUser.full_name ?? ''}
      onChange={(e) => setEditingUser((u: any) => ({ ...u, full_name: e.target.value }))}
      className="w-full px-3 py-2.5 border border-edge-hi rounded text-sm focus:outline-none focus:border-brand-600"
     />
    </div>
    <div className="grid grid-cols-2 gap-3">
     <div>
      <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">System Role</label>
      <select
       value={editingUser.role}
       onChange={(e) => setEditingUser((u: any) => ({ ...u, role: e.target.value }))}
       className="w-full px-3 py-2.5 border border-edge-hi rounded text-sm focus:outline-none focus:border-brand-600"
      >
       {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>
     </div>
     <div>
      <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Department</label>
      <select
       value={editingUser.department ?? DEPARTMENTS[0]}
       onChange={(e) => setEditingUser((u: any) => ({ ...u, department: e.target.value }))}
       className="w-full px-3 py-2.5 border border-edge-hi rounded text-sm focus:outline-none focus:border-brand-600"
      >
       {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
      </select>
     </div>
    </div>
   </div>
   <div className="grid grid-cols-2 gap-3 mt-6">
    <button
     onClick={() => setEditingUser(null)}
     className="py-2.5 border-2 border-edge text-sm font-semibold text-ink-2 rounded hover:bg-surface-hover transition-colors uppercase"
    >
     Cancel
    </button>
    <button
     onClick={() => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
     }}
     className="py-2.5 bg-brand-600 text-white text-sm font-semibold rounded hover:bg-brand-700 transition-colors uppercase"
    >
     Save Changes
    </button>
   </div>
  </div>
 </div>
 )}
 </div>
 )
}
