import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.vendor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      scans: {
        orderBy: { scannedAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(vendor)
}
