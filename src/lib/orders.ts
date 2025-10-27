import type { Order, OrderItem } from '@prisma/client'

export type OrderWithRelations = Order & {
  items: Array<
    OrderItem & {
      work: { id: string; title: string; slug: string; artist: { id: string; name: string; slug: string } | null } | null
      variant: { id: string; label: string | null } | null
    }
  >
}

export type SerializedOrder = ReturnType<typeof serializeOrder>

export function serializeOrder(order: OrderWithRelations) {
  return {
    id: order.id,
    email: order.email,
    total: order.total,
    status: order.status,
    shippingStatus: order.shippingStatus,
    trackingUrl: order.trackingUrl,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.qty,
      workId: item.work?.id ?? null,
      workTitle: item.work?.title ?? 'Œuvre',
      workSlug: item.work?.slug ?? null,
      artistName: item.work?.artist?.name ?? 'Artiste',
      artistId: item.work?.artist?.id ?? null,
      artistSlug: item.work?.artist?.slug ?? null,
      variantLabel: item.variant?.label ?? null,
    })),
  }
}

export function filterOrderForArtists(order: SerializedOrder, artistIds: string[]) {
  const filteredItems = order.items.filter((item) => (item.artistId ? artistIds.includes(item.artistId) : false))
  if (filteredItems.length === 0) return null
  return {
    ...order,
    items: filteredItems.map(({ artistId, artistSlug, ...rest }) => rest),
  }
}
