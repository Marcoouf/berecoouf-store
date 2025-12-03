import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { SHIPPING_STATUSES, formatShippingStatus } from '@/lib/shipping'
import { serializeOrder } from '@/lib/orders'
import type { ShippingStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const SHIPPING_SET = new Set<ShippingStatus>(SHIPPING_STATUSES)

function sanitizeTrackingUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession()
  const user = session?.user
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const artistIds = Array.isArray(user.artistIds) ? user.artistIds.filter(Boolean) : []
  if (artistIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'no_artist_access' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const updates: { shippingStatus?: ShippingStatus; trackingUrl?: string | null } = {}

  if (body && typeof body.shippingStatus === 'string') {
    const normalized = body.shippingStatus.trim().toLowerCase()
    if (!SHIPPING_SET.has(normalized as ShippingStatus)) {
      return NextResponse.json({ ok: false, error: 'invalid_shipping_status' }, { status: 400 })
    }
    updates.shippingStatus = normalized as ShippingStatus
  }

  if (Object.prototype.hasOwnProperty.call(body, 'trackingUrl')) {
    updates.trackingUrl = sanitizeTrackingUrl(body.trackingUrl)
  }

  if (!('shippingStatus' in updates) && !('trackingUrl' in updates)) {
    return NextResponse.json({ ok: true, updated: false })
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      shippingStatus: true,
      trackingUrl: true,
      items: {
        select: {
          work: { select: { artistId: true } },
        },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ ok: false, error: 'order_not_found' }, { status: 404 })
  }

  const ownsOrder = order.items.every((item) => item.work?.artistId && artistIds.includes(item.work.artistId))
  if (!ownsOrder) {
    return NextResponse.json({ ok: false, error: 'not_authorized_for_order' }, { status: 403 })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: updates,
    select: {
      id: true,
      email: true,
      total: true,
      shippingAmount: true,
      status: true,
      shippingStatus: true,
      trackingUrl: true,
      createdAt: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          qty: true,
          unitPrice: true,
          work: {
            select: {
              id: true,
              title: true,
              slug: true,
              artist: { select: { id: true, name: true } },
            },
          },
          variant: { select: { id: true, label: true } },
        },
      },
    },
  })

  if (updates.shippingStatus === 'shipped' && order.email) {
    // Optionally, we could send an email similar to admin logic later.
  }

  const serialized = serializeOrder(updated as any)
  return NextResponse.json({ ok: true, order: serialized, message: `Statut: ${formatShippingStatus(serialized.shippingStatus)}` })
}
