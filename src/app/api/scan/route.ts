import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scanVendor } from '@/lib/scan-vendor'

export async function POST(req: Request) {
  const body = await req.json()
  const vendorId: string = body.vendorId

  if (!vendorId) {
    return NextResponse.json({ error: 'vendorId required' }, { status: 400 })
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  }

  // Create a pending scan record immediately so UI can show progress
  const scan = await prisma.scan.create({
    data: { vendorId, status: 'scanning' },
  })

  // Run scan async — return scan id immediately so client can poll
  runScanInBackground(scan.id, vendor.domain)

  return NextResponse.json({ scanId: scan.id, status: 'scanning' })
}

async function runScanInBackground(scanId: string, domain: string) {
  try {
    const result = await scanVendor(domain)

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'done',
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        data: JSON.stringify(result.signals),
        summary: result.summary,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'failed', error: msg.slice(0, 500) },
    })
  }
}
