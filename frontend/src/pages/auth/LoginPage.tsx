import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore, MOCK_USERS } from '../../store/auth'
import { login } from '../../api/auth'

const DEMO_ACCOUNTS = [
  {
    key: 'manager',
    name: 'Mike Manager',
    role: 'Manager',
    email: 'manager@company.com',
    color: 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/50',
    dot: 'bg-indigo-500',
    initials: 'MM',
    avatarBg: 'bg-indigo-500',
  },
  {
    key: 'employee',
    name: 'Alice Employee',
    role: 'Employee',
    email: 'employee@company.com',
    color: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50',
    dot: 'bg-emerald-500',
    initials: 'AE',
    avatarBg: 'bg-emerald-500',
  },
  {
    key: 'finance',
    name: 'Sarah Finance',
    role: 'Finance Manager',
    email: 'finance@company.com',
    color: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50',
    dot: 'bg-amber-500',
    initials: 'SF',
    avatarBg: 'bg-amber-500',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Email is required')
    if (!password.trim()) return setError('Password is required')
    setLoading(true)
    try {
      const res = await login(email.trim(), password)
      setAuth(res.user, res.access_token)
      navigate('/dashboard')
    } catch {
      // fallback to mock if backend unavailable
      const match = Object.values(MOCK_USERS).find((u) => u.email === email.trim())
      if (match && password === 'password') {
        setAuth(match, 'demo')
        navigate('/dashboard')
      } else {
        setError('Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async (key: string) => {
    setDemoLoading(key)
    setError('')
    const account = DEMO_ACCOUNTS.find((a) => a.key === key)!
    try {
      const res = await login(account.email, 'password')
      setAuth(res.user, res.access_token)
    } catch {
      setAuth(MOCK_USERS[key], 'demo')
    } finally {
      setDemoLoading(null)
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex w-[480px] flex-shrink-0 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #3730A3 0%, #4F46E5 50%, #6366F1 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-16 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <span className="text-[15px] font-bold text-white tracking-tight">TX</span>
          </div>
          <div>
            <p className="text-[18px] font-semibold text-white tracking-tight leading-none">Travelex</p>
            <p className="text-[11px] text-white/60 mt-0.5">Enterprise T&amp;E</p>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative">
          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight mb-4">
            Smarter expense<br />management.
          </h1>
          <p className="text-white/60 text-[15px] leading-relaxed max-w-xs">
            Submit, approve, and reimburse travel and expenses — all in one place.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-col gap-3">
            {[
              'Real-time approval workflows',
              'Policy-compliant reimbursements',
              'AI anomaly detection',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-[13px] text-white/80">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-[11px] text-white/30">
          © {new Date().getFullYear()} Travelex Inc. · Enterprise Edition
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-[13px] font-bold text-white">TX</span>
            </div>
            <p className="text-[16px] font-semibold text-ink">Travelex</p>
          </div>

          <h2 className="text-2xl font-semibold text-ink tracking-tight mb-1">Welcome back</h2>
          <p className="text-[13px] text-ink-3 mb-8">Sign in to your account to continue</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-ink-3 mb-1.5">Email address</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                className="w-full px-3.5 py-2.5 border border-edge rounded-lg text-sm text-ink bg-surface-1 placeholder:text-ink-3
                           focus:outline-none focus:border-brand-600/60 focus:ring-2 focus:ring-brand-600/15 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-ink-3">Password</label>
                <button type="button" className="text-xs text-brand-600 hover:text-brand-700 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="w-full px-3.5 py-2.5 pr-10 border border-edge rounded-lg text-sm text-ink bg-surface-1 placeholder:text-ink-3
                             focus:outline-none focus:border-brand-600/60 focus:ring-2 focus:ring-brand-600/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-500/8 border border-red-500/20 rounded-lg px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white
                         transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)' }}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-edge" />
            <span className="text-[11px] text-ink-3 uppercase tracking-wider">or try a demo account</span>
            <div className="flex-1 h-px bg-edge" />
          </div>

          {/* Demo accounts */}
          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.key}
                onClick={() => handleDemo(acc.key)}
                disabled={!!demoLoading}
                className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl text-left transition-all disabled:opacity-60 ${acc.color}`}
              >
                <div className={`w-8 h-8 rounded-full ${acc.avatarBg} flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0`}>
                  {demoLoading === acc.key ? <Loader2 size={13} className="animate-spin" /> : acc.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-ink leading-tight">{acc.name}</p>
                  <p className="text-[11px] text-ink-3">{acc.role} · {acc.email}</p>
                </div>
                <ArrowRight size={14} className="text-ink-3 flex-shrink-0" />
              </button>
            ))}
          </div>

          <p className="text-center text-[11px] text-ink-3 mt-8">
            Demo password for all accounts: <span className="font-mono font-semibold text-ink-2">password</span>
          </p>
        </div>
      </div>
    </div>
  )
}
