import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Upload, UserPlus } from 'lucide-react'
import { listUsers } from '../../api/users'
import Spinner from '../../components/Spinner'

const ROLES = ['Employee', 'Manager', 'Finance']
const DEPARTMENTS = ['Engineering', 'Product', 'Marketing', 'Operations', 'Accounting', 'Sales', 'Human Resources']

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function UserManagement() {
  const [showModal, setShowModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState(true)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'Employee',
    department: 'Engineering',
  })

  const { data: apiUsers = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  const users =
    (apiUsers as any[]).length > 0
      ? (apiUsers as any[])
      : [
          { id: 1, full_name: 'James D.', email: 'james@company.com', department: 'Product', role: 'manager' },
          { id: 2, full_name: 'Robert K.', email: 'robert@company.com', department: 'Operations', role: 'employee' },
          { id: 3, full_name: 'Sarah M.', email: 'sarah@company.com', department: 'Accounting', role: 'finance' },
        ]

  if (isLoading) return <Spinner className="h-96" />

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage enterprise access, roles, and departmental permissions.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-semibold text-gray-700 rounded hover:bg-gray-50 transition-colors">
            <Upload size={14} /> BULK IMPORT CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold rounded hover:bg-gray-800 transition-colors"
          >
            <UserPlus size={14} /> ADD USER
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <button className="px-4 py-2.5 text-sm font-semibold border-b-2 border-black text-black">
          ALL
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Dept
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0">
                      {getInitials(u.full_name ?? u.name ?? '?')}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{u.full_name ?? u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-600">{u.department ?? '—'}</td>
                <td className="px-4 py-4">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-black">
                    <span className="w-2 h-2 rounded-full bg-black" />
                    ACTIVE
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-3 text-gray-400">
                    <button className="hover:text-gray-700 transition-colors text-base">✎</button>
                    <button className="hover:text-gray-700 transition-colors text-base">⋮</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Showing 1–{users.length} of {users.length} results</span>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 border border-gray-200 rounded text-xs font-semibold bg-black text-white">
              1
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase">Add New User</h2>
                <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                  Configure Employee Access and Permissions
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Johnathan Smith"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="john.smith@enterprise.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    System Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Send Invitation Email
                    </label>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                      User will receive a secure login link
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInviteEmail(!inviteEmail)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      inviteEmail ? 'bg-black' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        inviteEmail ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="py-2.5 border-2 border-gray-200 text-sm font-semibold text-gray-700 rounded hover:bg-gray-50 transition-colors uppercase"
              >
                Cancel
              </button>
              <button className="py-2.5 bg-black text-white text-sm font-semibold rounded hover:bg-gray-800 transition-colors uppercase">
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
