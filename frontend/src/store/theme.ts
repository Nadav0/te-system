import { create } from 'zustand'

interface ThemeState {
  dark: boolean
  toggle: () => void
}

// Default to light; respect stored preference
const stored = localStorage.getItem('te_theme')
const initialDark = stored !== null ? stored === 'dark' : false

// Apply before first render to avoid flash
document.documentElement.classList.toggle('dark', initialDark)

export const useThemeStore = create<ThemeState>((set) => ({
  dark: initialDark,
  toggle: () =>
    set((s) => {
      const next = !s.dark
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('te_theme', next ? 'dark' : 'light')
      return { dark: next }
    }),
}))
