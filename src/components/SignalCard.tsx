'use client'

import { CheckCircle, XCircle, AlertCircle, MinusCircle } from 'lucide-react'

type Status = 'found' | 'not_found' | 'blocked' | 'error' | 'unknown'

interface SignalCardProps {
  title: string
  icon: React.ReactNode
  status: Status
  children: React.ReactNode
}

export function SignalCard({ title, icon, status, children }: SignalCardProps) {
  const statusConfig: Record<Status, { icon: React.ReactNode; color: string; label: string }> = {
    found: { icon: <CheckCircle className="h-4 w-4" />, color: 'text-emerald-600', label: 'Found' },
    not_found: { icon: <MinusCircle className="h-4 w-4" />, color: 'text-gray-400', label: 'Not Found' },
    blocked: { icon: <AlertCircle className="h-4 w-4" />, color: 'text-amber-500', label: 'Blocked' },
    error: { icon: <XCircle className="h-4 w-4" />, color: 'text-red-500', label: 'Error' },
    unknown: { icon: <MinusCircle className="h-4 w-4" />, color: 'text-gray-400', label: 'Unknown' },
  }

  const cfg = statusConfig[status] ?? statusConfig.unknown

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
          <span className="text-gray-500">{icon}</span>
          {title}
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
          {cfg.icon}
          {cfg.label}
        </span>
      </div>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  )
}

export function TagList({ items, emptyText = 'None found' }: { items: string[]; emptyText?: string }) {
  if (!items.length) return <span className="text-gray-400 italic">{emptyText}</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
          {item}
        </span>
      ))}
    </div>
  )
}

export function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800 text-right font-medium">{value ?? '—'}</span>
    </div>
  )
}
