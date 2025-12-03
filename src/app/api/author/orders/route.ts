import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SHIPPING_STATUSES } from '@/lib/shipping'
import { serializeOrder, filterOrderForArtists } from '@/lib/orders'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getAuthSession()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const artistIds = Array.isArray(user.artistIds) ? user.artistIds.filter(Boolean) : []
  if (artistIds.length === 0) {
    return NextResponse.json({ ok: true, orders: [], shippingStatuses: SHIPPING_STATUSES })
  }

  const url = new URL(req.url)
  const sortParam = (url.searchParams.get('sort') || 'created_desc').toLowerCase()
  const shippingFilter = (url.searchParams.get('shipping') || '').trim().toLowerCase()
  const statusFilter = (url.searchParams.get('status') || '').trim().toLowerCase()

  const where: any = {
    items: {
      some: {
        work: { artistId: { in: artistIds } },
      },
    },
  }

  if (shippingFilter && SHIPPING_STATUSES.includes(shippingFilter as any)) {
    where.shippingStatus = shippingFilter
  }
  if (statusFilter) {
    where.status = statusFilter
  }

  const orderBy =
    sortParam === 'created_asc'
      ? { createdAt: 'asc' as const }
      : sortParam === 'total_desc'
      ? { total: 'desc' as const }
      : sortParam === 'total_asc'
      ? { total: 'asc' as const }
      : { createdAt: 'desc' as const }

  const orders = await prisma.order.findMany({
    where,
    orderBy,
    take: 100,
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

  const serialized = orders
    .map((order) => filterOrderForArtists(serializeOrder(order as any), artistIds))
    .filter((order): order is NonNullable<typeof order> => Boolean(order))

  return NextResponse.json({ ok: true, orders: serialized, shippingStatuses: SHIPPING_STATUSES })
}
