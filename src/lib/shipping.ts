export const SHIPPING_STATUSES = ['pending', 'packing', 'shipped', 'delivered'] as const

export type ShippingStatus = (typeof SHIPPING_STATUSES)[number]

export const SHIPPING_STATUS_LABELS: Record<ShippingStatus, string> = {
  pending: 'En attente',
  packing: 'Préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
}

export function formatShippingStatus(value: string | null | undefined) {
  if (!value) return 'En attente'
  return SHIPPING_STATUS_LABELS[value as ShippingStatus] ?? value
}

