import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function Select({ options, value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`input w-full flex items-center justify-between text-left transition-all ${
          open ? 'border-brand-600/60 ring-2 ring-brand-600/15' : ''
        }`}
      >
        <span className={selected ? 'text-ink' : 'text-ink-3'}>
          {selected ? selected.label : placeholder ?? 'Select…'}
        </span>
        <ChevronDown
          size={15}
          className={`text-ink-3 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface-1 border border-edge rounded-lg shadow-lg overflow-hidden">
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-brand-600/8 text-ink font-medium'
                    : 'text-ink-2 hover:bg-surface-hover'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} className="text-brand-600 flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
