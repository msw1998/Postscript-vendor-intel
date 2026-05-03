import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { VendorSignals } from '@/types/vendor'

export async function GET() {
  const vendors = await prisma.vendor.findMany({
    include: {
      scans: { orderBy: { scannedAt: 'desc' }, take: 1 },
    },
    orderBy: { addedAt: 'asc' },
  })

  const rows: string[] = [
    [
      'Domain',
      'Risk Score',
      'Risk Level',
      'Security Certs',
      'Sub-Processors Count',
      'Privacy Last Updated',
      'GDPR Mechanism',
      'Data Residency',
      'Pricing Model',
      'Free Option',
      'Ownership Type',
      'Latest Round',
      'Founded',
      'Health Flags',
      'Summary',
      'Scanned At',
    ]
      .map(csvEscape)
      .join(','),
  ]

  for (const v of vendors) {
    const scan = v.scans[0]
    if (!scan || !scan.data) {
      rows.push(
        [v.domain, '', '', '', '', '', '', '', '', '', '', '', '', '', scan?.error ?? 'Not scanned', ''].map(csvEscape).join(',')
      )
      continue
    }

    const s: VendorSignals = JSON.parse(scan.data)

    rows.push(
      [
        v.domain,
        scan.riskScore ?? '',
        scan.riskLevel ?? '',
        s.security.certifications.join('; '),
        s.subProcessors.count,
        s.privacy.lastUpdated ?? '',
        s.privacy.gdprMechanism ?? '',
        s.privacy.dataResidency,
        s.pricing.model,
        s.pricing.hasFreeOption ? 'Yes' : 'No',
        s.ownership.type,
        s.ownership.latestRound ?? '',
        s.ownership.foundingYear ?? '',
        s.health.flags.map((f) => `${f.type}: ${f.description}`).join('; '),
        scan.summary ?? '',
        scan.scannedAt.toISOString(),
      ]
        .map(csvEscape)
        .join(',')
    )
  }

  const csv = rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="vendor-intel-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}

function csvEscape(val: unknown): string {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}
