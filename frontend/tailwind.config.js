/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Indigo accent — fixed across themes, CSS-variable backed for opacity support
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          900: '#312e81',
        },
        // Surfaces — switch between light / dark via CSS vars
        surface: {
          0:     'rgb(var(--surface-0)     / <alpha-value>)',
          1:     'rgb(var(--surface-1)     / <alpha-value>)',
          2:     'rgb(var(--surface-2)     / <alpha-value>)',
          hover: 'rgb(var(--surface-hover) / <alpha-value>)',
        },
        // Borders
        edge: {
          DEFAULT: 'rgb(var(--edge)    / <alpha-value>)',
          hi:      'rgb(var(--edge-hi) / <alpha-value>)',
        },
        // Text
        ink: {
          DEFAULT: 'rgb(var(--ink)   / <alpha-value>)',
          2:       'rgb(var(--ink-2) / <alpha-value>)',
          3:       'rgb(var(--ink-3) / <alpha-value>)',
        },
        // Sidebar aliases (point at the same surface vars)
        sidebar: {
          bg:     'rgb(var(--surface-0)     / <alpha-value>)',
          active: 'rgb(var(--surface-1)     / <alpha-value>)',
          text:   'rgb(var(--ink-2)         / <alpha-value>)',
          border: 'rgb(var(--edge)          / <alpha-value>)',
          bottom: 'rgb(var(--surface-1)     / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
