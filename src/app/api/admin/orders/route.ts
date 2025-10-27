import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAdmin } from '../_lib/withAdmin'
import { SHIPPING_STATUSES } from '@/lib/shipping'
import { serializeOrder } from '@/lib/orders'

export const dynamic = 'force-dynamic'

export const GET = withAdmin(async (req: NextRequest) => {
  const url = new URL(req.url)
  const takeParam = Number(url.searchParams.get('limit'))
  const take = Number.isFinite(takeParam) ? Math.min(Math.max(Math.floor(takeParam), 1), 200) : 100
  const sortParam = (url.searchParams.get('sort') || 'created_desc').toLowerCase()
  const shippingFilter = (url.searchParams.get('shipping') || '').trim().toLowerCase()
  const statusFilter = (url.searchParams.get('status') || '').trim().toLowerCase()
  const artistFilter = (url.searchParams.get('artist') || '').trim()

  const where: any = {}
  if (shippingFilter && SHIPPING_STATUSES.includes(shippingFilter as any)) {
    where.shippingStatus = shippingFilter
  }
  if (statusFilter) {
    where.status = statusFilter
  }

  const artistCondition = artistFilter
    ? {
        OR: [
          { id: artistFilter },
          { slug: artistFilter },
          { name: { contains: artistFilter, mode: 'insensitive' } },
        ],
      }
    : null

  if (artistCondition) {
    where.items = {
      some: {
        work: {
          is: {
            artist: artistCondition,
          },
        },
      },
    }
  }

  const orderBy =
    sortParam === 'created_asc'
      ? { createdAt: 'asc' as const }
      : sortParam === 'total_desc'
      ? { total: 'desc' as const }
      : sortParam === 'total_asc'
      ? { total: 'asc' as const }
      : sortParam === 'shipping_asc'
      ? { shippingStatus: 'asc' as const }
      : sortParam === 'shipping_desc'
      ? { shippingStatus: 'desc' as const }
      : { createdAt: 'desc' as const }

  const orders = await prisma.order.findMany({
    where,
    orderBy,
    take,
    select: {
      id: true,
      email: true,
      total: true,
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
              artist: { select: { id: true, name: true, slug: true } },
            },
          },
          variant: { select: { id: true, label: true } },
        },
      },
    },
  })

  const payload = orders
    .map((order) => serializeOrder(order as any))
    .map((order) => {
      if (!artistCondition) return order
      const filteredItems = order.items.filter((item) => item.artistId && artistCondition.OR.some((cond: any) => {
        if ('id' in cond && cond.id) return item.artistId === cond.id
        if ('slug' in cond && cond.slug) return (item.artistSlug ?? '').toLowerCase() === String(cond.slug).toLowerCase()
        if ('name' in cond) {
          const needle = String(cond.name.contains ?? '').toLowerCase()
          return needle ? item.artistName.toLowerCase().includes(needle) : true
        }
        return false
      }))
      return { ...order, items: filteredItems }
    })
    .filter((order) => order.items.length > 0)

  return NextResponse.json({ ok: true, orders: payload, shippingStatuses: SHIPPING_STATUSES })
})
