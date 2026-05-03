'use client'

import {
  Shield,
  Users,
  Lock,
  DollarSign,
  Building2,
  Activity,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { SignalCard, TagList, DataRow } from './SignalCard'
import { RiskBadge } from './RiskBadge'
import type { ScanResult } from '@/types/vendor'
import { formatDistanceToNow } from 'date-fns'

interface VendorDetailProps {
  domain: string
  scan: ScanResult | null
  isScanning: boolean
  onScan: () => void
}

export function VendorDetail({ domain, scan, isScanning, onScan }: VendorDetailProps) {
  const s = scan?.signals

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {/* favicon */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt=""
            className="h-8 w-8 rounded-md border border-gray-100"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div>
            <h2 className="text-lg font-bold text-gray-900">{domain}</h2>
            {scan?.scannedAt && (
              <p className="text-xs text-gray-400">
                Last scanned {formatDistanceToNow(new Date(scan.scannedAt), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {scan && <RiskBadge score={scan.riskScore} level={scan.riskLevel} size="lg" />}
          <button
            onClick={onScan}
            disabled={isScanning}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isScanning ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Scanning…</>
            ) : (
              <><RefreshCw className="h-4 w-4" /> {scan ? 'Re-scan' : 'Scan'}</>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {/* No scan yet */}
        {!scan && !isScanning && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Shield className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No scan data yet</p>
            <p className="text-gray-400 text-sm mt-1">Click &ldquo;Scan&rdquo; to fetch vendor intelligence</p>
          </div>
        )}

        {/* Scanning in progress */}
        {isScanning && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Loader2 className="h-10 w-10 text-gray-400 animate-spin mb-3" />
            <p className="text-gray-600 font-medium">Fetching vendor data…</p>
            <p className="text-gray-400 text-sm mt-1">Scraping security pages, pricing, trust portals…</p>
          </div>
        )}

        {/* Failed */}
        {scan?.status === 'failed' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <AlertTriangle className="h-4 w-4" /> Scan failed
            </div>
            <p className="text-red-600">{scan.error ?? 'Unknown error'}</p>
          </div>
        )}

        {/* Results */}
        {scan?.status === 'done' && s && (
          <div className="space-y-4">
            {/* CFO Summary */}
            {scan.summary && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">CFO Summary</p>
                <p className="text-sm text-blue-900 leading-relaxed">{scan.summary}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Security */}
              <SignalCard
                title="Security Posture"
                icon={<Shield className="h-4 w-4" />}
                status={s.security.status}
              >
                <div className="space-y-2">
                  <TagList items={s.security.certifications} emptyText="No certifications detected" />
                  {s.security.notes && <p className="text-xs text-gray-500 mt-2">{s.security.notes}</p>}
                  {s.security.sourceUrl && (
                    <a href={s.security.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1">
                      <ExternalLink className="h-3 w-3" /> Trust page
                    </a>
                  )}
                </div>
              </SignalCard>

              {/* Sub-processors */}
              <SignalCard
                title="Sub-Processors"
                icon={<Users className="h-4 w-4" />}
                status={s.subProcessors.status}
              >
                <div className="space-y-2">
                  {s.subProcessors.count > 0 && (
                    <p className="text-xs text-gray-500">{s.subProcessors.count} named sub-processors</p>
                  )}
                  <TagList items={s.subProcessors.processors.slice(0, 12)} emptyText="No sub-processors listed" />
                  {s.subProcessors.processors.length > 12 && (
                    <p className="text-xs text-gray-400">+{s.subProcessors.processors.length - 12} more</p>
                  )}
                </div>
              </SignalCard>

              {/* Privacy */}
              <SignalCard
                title="Privacy & Data Residency"
                icon={<Lock className="h-4 w-4" />}
                status={s.privacy.status}
              >
                <div className="space-y-1">
                  <DataRow label="Last updated" value={s.privacy.lastUpdated ?? '—'} />
                  <DataRow label="GDPR mechanism" value={s.privacy.gdprMechanism ?? '—'} />
                  <DataRow label="Data residency" value={s.privacy.dataResidency} />
                </div>
              </SignalCard>

              {/* Pricing */}
              <SignalCard
                title="Pricing Signal"
                icon={<DollarSign className="h-4 w-4" />}
                status={s.pricing.status}
              >
                <div className="space-y-2">
                  <DataRow
                    label="Model"
                    value={
                      <span className="capitalize">{s.pricing.model.replace(/_/g, ' ')}</span>
                    }
                  />
                  <DataRow label="Free option" value={s.pricing.hasFreeOption ? 'Yes' : 'No'} />
                  {s.pricing.tiers.length > 0 && (
                    <div className="pt-1">
                      <TagList items={s.pricing.tiers} />
                    </div>
                  )}
                </div>
              </SignalCard>

              {/* Ownership */}
              <SignalCard
                title="Ownership & Funding"
                icon={<Building2 className="h-4 w-4" />}
                status={s.ownership.status}
              >
                <div className="space-y-1">
                  <DataRow
                    label="Type"
                    value={<span className="capitalize">{s.ownership.type.replace(/_/g, ' ')}</span>}
                  />
                  <DataRow label="Founded" value={s.ownership.foundingYear ?? '—'} />
                  <DataRow label="Latest round" value={s.ownership.latestRound ?? '—'} />
                  {s.ownership.acquiredBy && (
                    <DataRow label="Acquired by" value={s.ownership.acquiredBy} />
                  )}
                  {s.ownership.investors.length > 0 && (
                    <div className="pt-1">
                      <TagList items={s.ownership.investors.slice(0, 6)} />
                    </div>
                  )}
                </div>
              </SignalCard>

              {/* Operating Health */}
              <SignalCard
                title="Operating Health"
                icon={<Activity className="h-4 w-4" />}
                status={s.health.status}
              >
                <div className="space-y-2">
                  {s.health.flags.length === 0 && s.health.incidents.length === 0 ? (
                    <p className="text-gray-400 italic">No flags or incidents detected</p>
                  ) : (
                    <>
                      {s.health.flags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                            flag.severity === 'high' ? 'bg-red-500' :
                            flag.severity === 'medium' ? 'bg-amber-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <p className="text-xs font-medium text-gray-700 capitalize">{flag.type.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-gray-500">{flag.description}</p>
                            {flag.date && <p className="text-xs text-gray-400">{flag.date}</p>}
                          </div>
                        </div>
                      ))}
                      {s.health.incidents.slice(0, 3).map((inc, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 h-2 w-2 rounded-full shrink-0 bg-amber-400" />
                          <p className="text-xs text-gray-600">{inc}</p>
                        </div>
                      ))}
                    </>
                  )}
                  {s.health.statusPageUrl && (
                    <a href={s.health.statusPageUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1">
                      <ExternalLink className="h-3 w-3" /> Status page
                    </a>
                  )}
                </div>
              </SignalCard>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
