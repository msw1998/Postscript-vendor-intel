'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { VendorSidebar } from '@/components/VendorSidebar'
import { VendorDetail } from '@/components/VendorDetail'
import type { VendorWithLatestScan, ScanResult } from '@/types/vendor'

const POLL_INTERVAL = 3000

export default function Home() {
  const [vendors, setVendors] = useState<VendorWithLatestScan[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [scanningIds, setScanningIds] = useState<Set<string>>(new Set())
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadVendors = useCallback(async () => {
    const res = await fetch('/api/vendors')
    const data: VendorWithLatestScan[] = await res.json()
    setVendors(data)
    return data
  }, [])

  useEffect(() => {
    loadVendors()
  }, [loadVendors])

  useEffect(() => {
    if (!selectedId) { setScanResult(null); return }
    const v = vendors.find((x) => x.id === selectedId)
    if (v?.latestScan) setScanResult(v.latestScan)
  }, [selectedId, vendors])

  useEffect(() => {
    if (scanningIds.size === 0) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }

    const poll = async () => {
      const updated = await loadVendors()
      const stillScanning = new Set<string>()

      for (const id of scanningIds) {
        const v = updated.find((x) => x.id === id)
        if (v?.latestScan?.status === 'scanning' || v?.latestScan?.status === 'pending') {
          stillScanning.add(id)
        }
        if (id === selectedId && v?.latestScan && v.latestScan.status !== 'scanning') {
          setScanResult(v.latestScan)
        }
      }
      setScanningIds(stillScanning)
    }

    pollRef.current = setInterval(poll, POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [scanningIds, loadVendors, selectedId])

  const handleSelect = (domain: string, id: string) => {
    setSelectedDomain(domain)
    setSelectedId(id)
    const v = vendors.find((x) => x.id === id)
    setScanResult(v?.latestScan ?? null)
  }

  const handleAdd = async (domains: string[]) => {
    await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains }),
    })
    const updated = await loadVendors()
    if (!selectedId && updated.length > 0) {
      const first = updated[0]
      setSelectedId(first.id)
      setSelectedDomain(first.domain)
      setScanResult(first.latestScan ?? null)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/vendors/${id}`, { method: 'DELETE' })
    if (selectedId === id) {
      setSelectedId(null)
      setSelectedDomain(null)
      setScanResult(null)
    }
    setScanningIds((prev) => { const s = new Set(prev); s.delete(id); return s })
    await loadVendors()
  }

  const handleScan = async (id: string) => {
    setScanningIds((prev) => new Set(prev).add(id))
    if (id === selectedId) setScanResult(null)
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId: id }),
    })
  }

  const handleScanAll = async () => {
    for (const v of vendors) {
      await handleScan(v.id)
      await new Promise((r) => setTimeout(r, 400))
    }
  }

  const selectedVendor = vendors.find((v) => v.id === selectedId)
  const isScanning = selectedId ? scanningIds.has(selectedId) : false

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="w-72 shrink-0 flex flex-col">
        <VendorSidebar
          vendors={vendors}
          selectedDomain={selectedDomain}
          scanningIds={scanningIds}
          onSelect={handleSelect}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onScanAll={handleScanAll}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {selectedDomain ? (
          <VendorDetail
            domain={selectedDomain}
            scan={scanResult ?? selectedVendor?.latestScan ?? null}
            isScanning={isScanning}
            onScan={() => selectedId && handleScan(selectedId)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Vendor Intelligence</h2>
            <p className="text-gray-400 max-w-xs text-sm leading-relaxed">
              Add SaaS vendors from the sidebar, then scan them to get security posture, pricing signals, funding data, and risk flags.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
