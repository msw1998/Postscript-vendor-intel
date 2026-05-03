import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/scan/status?vendorId=xxx  — returns latest scan for a vendor
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const vendorId = searchParams.get('vendorId')

  if (!vendorId) return NextResponse.json({ error: 'vendorId required' }, { status: 400 })

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const scan = await prisma.scan.findFirst({
    where: { vendorId },
    orderBy: { scannedAt: 'desc' },
  })

  if (!scan) return NextResponse.json({ status: 'never_scanned' })

  return NextResponse.json({
    id: scan.id,
    vendorId: scan.vendorId,
    domain: vendor.domain,
    name: vendor.name,
    scannedAt: scan.scannedAt.toISOString(),
    status: scan.status,
    riskScore: scan.riskScore,
    riskLevel: scan.riskLevel,
    signals: scan.data ? JSON.parse(scan.data) : null,
    summary: scan.summary,
    error: scan.error,
  })
}
