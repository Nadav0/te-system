import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

const storedUser = localStorage.getItem('te_user')
const storedToken = localStorage.getItem('te_token')

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  setAuth: (user, token) => {
    localStorage.setItem('te_user', JSON.stringify(user))
    localStorage.setItem('te_token', token)
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('te_user')
    localStorage.removeItem('te_token')
    set({ user: null, token: null })
  },
}))
