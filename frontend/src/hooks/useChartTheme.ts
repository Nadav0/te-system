import { useThemeStore } from '../store/theme'

export function useChartTheme() {
  const dark = useThemeStore((s) => s.dark)

  return {
    grid:    dark ? '#34343E' : '#E0E0EB',
    tick:    { fill: dark ? '#646474' : '#8E92AA', fontSize: 11 },
    tooltip: {
      backgroundColor: dark ? '#1C1C20' : '#FFFFFF',
      border: `1px solid ${dark ? '#484856' : '#C8C8DA'}`,
      borderRadius: 10,
      color: dark ? '#FFFFFF' : '#0D0F1A',
      fontSize: 12,
    },
    line:   '#4F46E5',
    bar:    '#4F46E5',
    barRed: dark ? '#f87171' : '#ef4444',
  }
}
