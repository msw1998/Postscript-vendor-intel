import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { addedAt: 'desc' },
    include: {
      scans: {
        orderBy: { scannedAt: 'desc' },
        take: 1,
      },
    },
  })

  const result = vendors.map((v) => {
    const scan = v.scans[0] ?? null
    return {
      id: v.id,
      domain: v.domain,
      name: v.name,
      addedAt: v.addedAt.toISOString(),
      latestScan: scan
        ? {
            id: scan.id,
            vendorId: scan.vendorId,
            domain: v.domain,
            name: v.name,
            scannedAt: scan.scannedAt.toISOString(),
            status: scan.status,
            riskScore: scan.riskScore,
            riskLevel: scan.riskLevel,
            signals: scan.data ? JSON.parse(scan.data) : null,
            summary: scan.summary,
            error: scan.error,
          }
        : null,
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const body = await req.json()
  const domains: string[] = body.domains ?? []

  if (!domains.length) {
    return NextResponse.json({ error: 'No domains provided' }, { status: 400 })
  }

  const cleaned = domains
    .map((d) =>
      d
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//i, '')
        .replace(/\/.*$/, '')
    )
    .filter(Boolean)

  const created = []
  for (const domain of cleaned) {
    const vendor = await prisma.vendor.upsert({
      where: { domain },
      update: {},
      create: { domain, name: domainToName(domain) },
    })
    created.push(vendor)
  }

  return NextResponse.json(created)
}

function domainToName(domain: string): string {
  const base = domain.replace(/\.(com|io|co|ai|app|so|net|org)$/, '')
  return base.charAt(0).toUpperCase() + base.slice(1)
}
