import type { ReactNode } from 'react'

interface Props {
 title: string
 subtitle?: string
 actions?: ReactNode
}

export default function PageHeader({ title, subtitle, actions }: Props) {
 return (
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-xl font-semibold text-ink tracking-tight">{title}</h1>
 {subtitle && <p className="text-sm text-ink-3 mt-0.5">{subtitle}</p>}
 </div>
 {actions && <div className="flex items-center gap-3">{actions}</div>}
 </div>
 )
}
