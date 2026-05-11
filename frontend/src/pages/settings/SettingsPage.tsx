import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { updateMe } from '../../api/users'
import { useNavigate } from 'react-router-dom'

const NOTIF_KEY = 'te_notif_prefs'

function loadNotifPrefs() {
 try {
  const raw = localStorage.getItem(NOTIF_KEY)
  if (raw) return JSON.parse(raw)
 } catch {}
 return { notifications: true, emailDigest: false, approvalAlerts: true }
}

export default function SettingsPage() {
 const user = useAuthStore((s) => s.user)!
 const setAuth = useAuthStore((s) => s.setAuth)
 const token = useAuthStore((s) => s.token)!
 const navigate = useNavigate()

 const [fullName, setFullName] = useState(user.full_name)
 const [email, setEmail] = useState(user.email)
 const [profileError, setProfileError] = useState('')
 const [profileSaved, setProfileSaved] = useState(false)

 const savedPrefs = loadNotifPrefs()
 const [notifications, setNotificationsRaw] = useState<boolean>(savedPrefs.notifications)
 const [emailDigest, setEmailDigestRaw] = useState<boolean>(savedPrefs.emailDigest)
 const [approvalAlerts, setApprovalAlertsRaw] = useState<boolean>(savedPrefs.approvalAlerts)

 function saveNotifPrefs(patch: Partial<{ notifications: boolean; emailDigest: boolean; approvalAlerts: boolean }>) {
  const next = { notifications, emailDigest, approvalAlerts, ...patch }
  localStorage.setItem(NOTIF_KEY, JSON.stringify(next))
 }

 const setNotifications = (v: boolean) => { setNotificationsRaw(v); saveNotifPrefs({ notifications: v }) }
 const setEmailDigest = (v: boolean) => { setEmailDigestRaw(v); saveNotifPrefs({ emailDigest: v }) }
 const setApprovalAlerts = (v: boolean) => { setApprovalAlertsRaw(v); saveNotifPrefs({ approvalAlerts: v }) }

 const updateMutation = useMutation({
 mutationFn: () => updateMe({ full_name: fullName, email }),
 onSuccess: (updated: any) => {
 setAuth({ ...user, full_name: updated.full_name, email: updated.email }, token)
 setProfileSaved(true)
 setProfileError('')
 setTimeout(() => setProfileSaved(false), 2000)
 },
 onError: (e: any) => {
 setProfileError(e.response?.data?.detail ?? 'Failed to save changes')
 },
 })

 const handleSave = () => {
 setProfileError('')
 if (!fullName.trim()) return setProfileError('Full name cannot be empty')
 if (!email.trim()) return setProfileError('Email cannot be empty')
 updateMutation.mutate()
 }

 return (
 <div className="p-8 max-w-2xl">
 <div className="mb-8">
 <h1 className="text-xl font-semibold text-ink tracking-tight">Settings</h1>
 <p className="text-sm text-ink-3 mt-1">Manage your account preferences and notifications.</p>
 </div>

 {/* Profile */}
 <div className="bg-surface-1 border border-edge rounded-lg p-6 mb-4">
 <h2 className="text-sm font-bold text-ink-2 uppercase tracking-wider mb-4">Profile</h2>
 <div className="flex items-center gap-4 mb-5">
 <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-white font-bold text-lg">
 {user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
 </div>
 <div>
 <p className="font-semibold text-ink">{user.full_name}</p>
 <p className="text-sm text-ink-3">{user.email}</p>
 <p className="text-xs text-ink-3 uppercase tracking-wider mt-0.5 capitalize">
 {user.role}{user.department ? ` · ${user.department}` : ''}
 </p>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Full Name</label>
 <input
 type="text"
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 className="w-full px-3 py-2.5 border border-edge-hi rounded text-sm focus:outline-none focus:border-edge-hi"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Email</label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full px-3 py-2.5 border border-edge-hi rounded text-sm focus:outline-none focus:border-edge-hi"
 />
 </div>
 </div>
 {profileError && (
 <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{profileError}</p>
 )}
 <div className="flex items-center gap-3 mt-4">
 <button
 onClick={handleSave}
 disabled={updateMutation.isPending}
 className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded hover:bg-brand-700 transition-colors uppercase disabled:opacity-50"
 >
 {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
 </button>
 {profileSaved && (
 <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
 <CheckCircle size={15} /> Saved
 </span>
 )}
 </div>
 </div>

 {/* Notifications */}
 <div className="bg-surface-1 border border-edge rounded-lg p-6 mb-4">
 <h2 className="text-sm font-bold text-ink-2 uppercase tracking-wider mb-4">Notifications</h2>
 <div className="space-y-4">
 {[
 { label: 'Push Notifications', sub: 'Receive alerts for approvals and submissions', value: notifications, set: setNotifications },
 { label: 'Email Digest', sub: 'Daily summary of pending items', value: emailDigest, set: setEmailDigest },
 { label: 'Approval Alerts', sub: 'Immediate alerts when your reports are reviewed', value: approvalAlerts, set: setApprovalAlerts },
 ].map((item) => (
 <div key={item.label} className="flex items-center justify-between">
 <div>
 <p className="text-sm font-semibold text-ink">{item.label}</p>
 <p className="text-xs text-ink-3">{item.sub}</p>
 </div>
 <button
 onClick={() => item.set(!item.value)}
 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.value ? 'bg-brand-600' : 'bg-edge-hi'}`}
 >
 <span className={`inline-block h-4 w-4 transform rounded-full bg-surface-1 transition-transform ${item.value ? 'translate-x-6' : 'translate-x-1'}`} />
 </button>
 </div>
 ))}
 </div>
 </div>

 {/* Account */}
 <div className="bg-surface-1 border border-edge rounded-lg p-6">
 <h2 className="text-sm font-bold text-ink-2 uppercase tracking-wider mb-4">Account</h2>
 <button
 onClick={() => { useAuthStore.getState().logout(); navigate('/login') }}
 className="px-4 py-2 border border-edge-hi text-sm font-semibold text-ink-2 rounded hover:bg-surface-hover transition-colors uppercase"
 >
 Sign Out
 </button>
 </div>
 </div>
 )
}
