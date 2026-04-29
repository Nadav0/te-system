import { useState } from 'react'
import { useAuthStore } from '../../store/auth'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)!
  const [notifications, setNotifications] = useState(true)
  const [emailDigest, setEmailDigest] = useState(false)
  const [approvalAlerts, setApprovalAlerts] = useState(true)

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account preferences and notifications.</p>
      </div>

      {/* Profile */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-lg">
            {user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.full_name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5 capitalize">{user.role}{user.department ? ` · ${user.department}` : ''}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              defaultValue={user.full_name}
              className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              defaultValue={user.email}
              className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
        </div>
        <button className="mt-4 px-4 py-2 bg-black text-white text-sm font-semibold rounded hover:bg-gray-800 transition-colors uppercase">
          Save Changes
        </button>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Notifications</h2>
        <div className="space-y-4">
          {[
            { label: 'Push Notifications', sub: 'Receive alerts for approvals and submissions', value: notifications, set: setNotifications },
            { label: 'Email Digest', sub: 'Daily summary of pending items', value: emailDigest, set: setEmailDigest },
            { label: 'Approval Alerts', sub: 'Immediate alerts when your reports are reviewed', value: approvalAlerts, set: setApprovalAlerts },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
              <button
                onClick={() => item.set(!item.value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.value ? 'bg-black' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.value ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Account</h2>
        <button
          onClick={useAuthStore.getState().logout}
          className="px-4 py-2 border border-gray-300 text-sm font-semibold text-gray-700 rounded hover:bg-gray-50 transition-colors uppercase"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
