import { Zap, Flame, Rocket, Star, Sparkles } from 'lucide-react'

interface Props {
  progress: number   // 0..1
  message: string
  className?: string
}

type Stage = 0 | 1 | 2 | 3 | 4

function getStage(pct: number): Stage {
  if (pct >= 100) return 4
  if (pct >= 75)  return 3
  if (pct >= 50)  return 2
  if (pct >= 20)  return 1
  return 0
}

const STAGE_ICONS = [Zap, Flame, Rocket, Star, Sparkles]

const STAGE_GRADIENT: Record<Stage, string> = {
  0: 'linear-gradient(90deg, #CBD5E1, #94A3B8)',
  1: 'linear-gradient(90deg, #969EF9, #7A82F7)',
  2: 'linear-gradient(90deg, #7A82F7, #5C66F5)',
  3: 'linear-gradient(90deg, #5C66F5, #4A55DC)',
  4: 'linear-gradient(90deg, #059669, #10B981, #34D399)',
}

const STAGE_DOT: Record<Stage, string> = {
  0: '#94A3B8',
  1: '#969EF9',
  2: '#7A82F7',
  3: '#5C66F5',
  4: '#10B981',
}

const STAGE_GLOW: Record<Stage, string> = {
  0: 'rgba(148,163,184,0.0)',
  1: 'rgba(150,158,249,0.55)',
  2: 'rgba(122,130,247,0.55)',
  3: 'rgba(92,102,245,0.60)',
  4: 'rgba(16,185,129,0.60)',
}

const STAGE_TEXT: Record<Stage, string> = {
  0: 'text-ink-3',
  1: 'text-brand-400',
  2: 'text-brand-500',
  3: 'text-brand-600',
  4: 'text-emerald-500',
}

const MILESTONE_PCTS = [33, 66]

export default function MotivationBar({ progress, message, className = '' }: Props) {
  const pct     = Math.round(Math.min(Math.max(progress, 0), 1) * 100)
  const stage   = getStage(pct)
  const Icon    = STAGE_ICONS[stage]
  const isEmpty = pct === 0
  const isDone  = pct === 100

  return (
    <div className={`select-none ${className}`}>

      {/* ── Message row ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`transition-all duration-500 ${STAGE_TEXT[stage]}`}>
            <Icon size={11} className={isDone ? 'animate-bounce' : ''} />
          </span>
          <span className={`text-[11px] font-semibold transition-colors duration-500 ${STAGE_TEXT[stage]}`}>
            {message}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isEmpty && !isDone && (
            <span
              key={pct}
              className={`badge-pop text-[11px] font-bold tabular-nums transition-colors duration-500 ${STAGE_TEXT[stage]}`}
            >
              {pct}%
            </span>
          )}
          {isDone && (
            <span className="badge-pop flex items-center gap-0.5 text-[11px] font-bold text-emerald-500">
              <Sparkles size={10} /> Ready!
            </span>
          )}
        </div>
      </div>

      {/* ── Track + fill ── */}
      <div className="relative">

        {/* Track */}
        <div
          className={`h-2 rounded-full overflow-hidden relative ${isDone ? 'bar-complete-glow' : ''}`}
          style={{ background: 'rgb(var(--surface-0))' }}
        >
          {/* Milestone tick marks */}
          {MILESTONE_PCTS.map((pos) => (
            <div
              key={pos}
              className="absolute top-0 bottom-0 w-px z-10 transition-opacity duration-500"
              style={{
                left: `${pos}%`,
                background: pct > pos ? 'rgba(255,255,255,0.25)' : 'rgba(148,163,184,0.18)',
              }}
            />
          ))}

          {/* Fill */}
          {!isEmpty && (
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out overflow-hidden"
              style={{ width: `${pct}%`, background: STAGE_GRADIENT[stage] }}
            >
              {/* Shimmer sweep */}
              <div className="bar-shimmer absolute inset-0 pointer-events-none">
                <div
                  className="h-full w-10"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Leading-edge glow dot */}
        {!isEmpty && !isDone && (
          <div
            className="dot-pulse absolute top-1/2 z-20 w-3.5 h-3.5 rounded-full border-2 border-white/80 transition-all duration-700 ease-out"
            style={{
              left: `${pct}%`,
              transform: 'translateY(-50%) translateX(-50%)',
              background: STAGE_DOT[stage],
              boxShadow: `0 0 0 3px ${STAGE_GLOW[stage]}, 0 0 10px 2px ${STAGE_GLOW[stage]}`,
            }}
          />
        )}

        {/* Complete checkmark cap */}
        {isDone && (
          <div
            className="badge-pop absolute top-1/2 right-0 z-20 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center"
            style={{
              transform: 'translateY(-50%) translateX(40%)',
              background: '#10B981',
              boxShadow: '0 0 0 3px rgba(16,185,129,0.4), 0 0 12px 4px rgba(16,185,129,0.2)',
            }}
          >
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
              <path d="M1.5 3.5L3 5L5.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
