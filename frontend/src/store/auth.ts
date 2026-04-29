import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

const MOCK_USERS: Record<string, User> = {
  manager: { id: 'u-manager-01', email: 'manager@company.com', full_name: 'Mike Manager', role: 'manager', department: 'Engineering' },
  employee: { id: 'u-emp-01', email: 'employee@company.com', full_name: 'Alice Employee', role: 'employee', department: 'Engineering' },
  finance: { id: 'u-finance-01', email: 'finance@company.com', full_name: 'Sarah Finance', role: 'finance', department: 'Finance' },
}

const storedUser = localStorage.getItem('te_user')
const storedToken = localStorage.getItem('te_token')

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : MOCK_USERS.manager,
  token: storedToken ?? 'demo',
  setAuth: (user, token) => {
    localStorage.setItem('te_user', JSON.stringify(user))
    localStorage.setItem('te_token', token)
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('te_user')
    localStorage.removeItem('te_token')
    set({ user: MOCK_USERS.manager, token: 'demo' })
  },
}))

export { MOCK_USERS }
