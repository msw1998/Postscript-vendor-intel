'use client'

import { useState } from 'react'
import { Plus, Trash2, X, Search, RefreshCw, Loader2, Download } from 'lucide-react'
import { RiskDot } from './RiskBadge'
import type { VendorWithLatestScan } from '@/types/vendor'

interface VendorSidebarProps {
  vendors: VendorWithLatestScan[]
  selectedDomain: string | null
  scanningIds: Set<string>
  onSelect: (domain: string, id: string) => void
  onAdd: (domains: string[]) => void
  onDelete: (id: string) => void
  onScanAll: () => void
}

const STARTER_VENDORS = [
  'omni.co', 'retool.com', 'claude.ai', 'intercom.com', 'adobe.com',
  'jetbrains.com', 'coderabbit.ai', 'avalara.com', 'datadoghq.com', 'notion.so',
  'linear.app', 'gong.io', 'ramp.com', 'brex.com', 'lattice.com',
  'carta.com', 'rippling.com', 'segment.com', 'amplitude.com',
]

export function VendorSidebar({
  vendors,
  selectedDomain,
  scanningIds,
  onSelect,
  onAdd,
  onDelete,
  onScanAll,
}: VendorSidebarProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')

  const filtered = vendors.filter((v) =>
    v.domain.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    const domains = input
      .split(/[\n,\s]+/)
      .map((d) => d.trim())
      .filter(Boolean)
    if (domains.length) {
      onAdd(domains)
      setInput('')
      setShowAddModal(false)
    }
  }

  const handleLoadStarters = () => {
    setInput(STARTER_VENDORS.join('\n'))
  }

  const anyScanRunning = scanningIds.size > 0

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm font-bold text-gray-900 tracking-tight">Vendor Intel</h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onScanAll}
              disabled={vendors.length === 0 || anyScanRunning}
              title="Scan all vendors"
              className="flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              {anyScanRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Scan All
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Filter vendors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      </div>

      {/* Vendor list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">
            {vendors.length === 0
              ? 'No vendors yet. Click Add to get started.'
              : 'No matches found.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filtered.map((v) => {
              const isSelected = v.domain === selectedDomain
              const isScanning = scanningIds.has(v.id)
              const scan = v.latestScan

              return (
                <li key={v.id}>
                  <div
                    onClick={() => onSelect(v.domain, v.id)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-gray-100 border-l-2 border-gray-900' : ''
                    }`}
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${v.domain}&sz=16`}
                      alt=""
                      className="h-4 w-4 rounded shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{v.domain}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {isScanning
                          ? 'Scanning…'
                          : scan?.status === 'failed'
                          ? 'Scan failed'
                          : scan?.riskScore !== null && scan?.riskScore !== undefined
                          ? `Risk: ${scan.riskScore}/100`
                          : 'Not scanned'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isScanning ? (
                        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                      ) : (
                        <RiskDot level={scan?.riskLevel ?? null} />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(v.id) }}
                        className="p-0.5 rounded text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Stats footer */}
      <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
        <span>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} &middot; {vendors.filter((v) => v.latestScan?.riskLevel === 'high').length} high risk</span>
        <a
          href="/api/export"
          title="Export CSV"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Add vendors</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Paste one domain per line (or comma-separated). e.g. <code className="bg-gray-100 px-1 rounded">notion.so</code>
            </p>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              placeholder="notion.so&#10;linear.app&#10;retool.com"
              className="w-full rounded-lg border border-gray-200 p-3 text-sm font-mono text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={handleLoadStarters}
                className="text-xs text-blue-500 hover:underline"
              >
                Load 19 starter vendors
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                >
                  Add vendors
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
