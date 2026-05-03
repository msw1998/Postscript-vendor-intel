'use client'

interface RiskBadgeProps {
  score: number | null
  level: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function RiskBadge({ score, level, size = 'md' }: RiskBadgeProps) {
  if (score === null || !level) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
        Not scanned
      </span>
    )
  }

  const colors = {
    low: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
    medium: 'bg-amber-100 text-amber-800 ring-amber-600/20',
    high: 'bg-red-100 text-red-800 ring-red-600/20',
  }[level] ?? 'bg-gray-100 text-gray-800'

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  }[size]

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ring-1 ring-inset font-medium ${colors} ${sizes}`}>
      <span className="tabular-nums">{score}</span>
      <span className="opacity-70">/100</span>
      <span className="ml-0.5 capitalize">{level}</span>
    </span>
  )
}

export function RiskDot({ level }: { level: string | null }) {
  if (!level) return <span className="h-2 w-2 rounded-full bg-gray-300 inline-block" />
  const colors = { low: 'bg-emerald-500', medium: 'bg-amber-500', high: 'bg-red-500' }[level] ?? 'bg-gray-400'
  return <span className={`h-2 w-2 rounded-full inline-block ${colors}`} />
}
