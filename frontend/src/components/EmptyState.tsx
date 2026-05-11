import type { ReactNode } from 'react'

// Mesh-style line-art SVG illustrations
const illustrations = {
  expenses: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="8" width="36" height="46" rx="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="12" y="8" width="36" height="46" rx="4" fill="currentColor" fillOpacity="0.06"/>
      <line x1="20" y1="22" x2="40" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="38" x2="32" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="44" cy="46" r="10" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"/>
      <line x1="44" y1="42" x2="44" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="40" y1="46" x2="48" y2="46" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  travel: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 36L28 20L36 28L52 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M38 16H52V30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 44H54" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="18" cy="50" r="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="32" cy="50" r="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="46" cy="50" r="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 36L18 28L24 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.4"/>
    </svg>
  ),
  approvals: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8L36.5 18.5L48 20L39.5 28L41.5 40L32 34.5L22.5 40L24.5 28L16 20L27.5 18.5L32 8Z"
        stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.08"/>
      <path d="M22 48L26 52L38 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  reports: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="28" height="36" rx="3" stroke="currentColor" strokeWidth="2"/>
      <rect x="10" y="10" width="28" height="36" rx="3" fill="currentColor" fillOpacity="0.06"/>
      <line x1="17" y1="22" x2="31" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17" y1="28" x2="31" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17" y1="34" x2="25" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="28" y="28" width="22" height="22" rx="11" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"/>
      <polyline points="33,39 37,43 45,35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  analytics: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="38" width="10" height="18" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="22" y="26" width="10" height="30" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="36" y="16" width="10" height="40" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="50" y="30" width="6" height="26" rx="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 12L22 20L36 14L56 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8" cy="12" r="2.5" fill="currentColor"/>
      <circle cx="22" cy="20" r="2.5" fill="currentColor"/>
      <circle cx="36" cy="14" r="2.5" fill="currentColor"/>
      <circle cx="56" cy="8" r="2.5" fill="currentColor"/>
    </svg>
  ),
  team: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="20" r="10" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"/>
      <path d="M14 54C14 44.059 22.059 36 32 36C41.941 36 50 44.059 50 54" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="14" cy="24" r="7" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 50C2 43.373 7.373 38 14 38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="50" cy="24" r="7" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M62 50C62 43.373 56.627 38 50 38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  generic: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="28" r="16" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2"/>
      <path d="M32 22V28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="32" cy="34" r="1.5" fill="currentColor"/>
      <path d="M16 48C18.667 42.667 24.4 40 32 40C39.6 40 45.333 42.667 48 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
}

export type EmptyStateVariant = keyof typeof illustrations

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({ variant = 'generic', title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      {/* Circular illustrated icon */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-brand-600/8 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-brand-600/10 flex items-center justify-center text-brand-600">
            {illustrations[variant]}
          </div>
        </div>
        {/* Subtle decorative ring */}
        <div className="absolute inset-0 rounded-full border border-brand-600/10" />
      </div>

      <p className="text-[15px] font-semibold text-ink mb-1.5">{title}</p>
      {description && (
        <p className="text-[13px] text-ink-3 max-w-xs mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
