import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ShippingStatus } from '@prisma/client'
import { withAdmin } from '../../_lib/withAdmin'
import { SHIPPING_STATUSES, formatShippingStatus } from '@/lib/shipping'
import { serializeOrder } from '@/lib/orders'
import { getResendClient, renderEmail } from '@/lib/emailer'
import * as React from 'react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

const SHIPPING_SET = new Set<ShippingStatus>(SHIPPING_STATUSES)

function sanitizeTrackingUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed
}

export const PATCH = withAdmin(async (req: NextRequest, { params }: Params) => {
  const body = await req.json().catch(() => ({}))
  const orderId = params.id

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      email: true,
      shippingStatus: true,
      trackingUrl: true,
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

  if (!order) {
    return NextResponse.json({ ok: false, error: 'order_not_found' }, { status: 404 })
  }

  const updates: { shippingStatus?: ShippingStatus; trackingUrl?: string | null } = {}
  let newStatus: ShippingStatus | undefined

  if (body && typeof body.shippingStatus === 'string') {
    const normalized = body.shippingStatus.trim().toLowerCase()
    if (!SHIPPING_SET.has(normalized as any)) {
      return NextResponse.json({ ok: false, error: 'invalid_shipping_status' }, { status: 400 })
    }
    updates.shippingStatus = normalized as ShippingStatus
    newStatus = normalized as ShippingStatus
  }

  if (Object.prototype.hasOwnProperty.call(body, 'trackingUrl')) {
    updates.trackingUrl = sanitizeTrackingUrl(body.trackingUrl)
  }

  if (!('shippingStatus' in updates) && !('trackingUrl' in updates)) {
    return NextResponse.json({ ok: true, updated: false })
  }

  const updatedRecord = await prisma.order.update({
    where: { id: orderId },
    data: updates,
    include: {
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

  const resend = getResendClient()
  const becameShipped = newStatus === 'shipped' && order.shippingStatus !== 'shipped'
  const trackingUrl = updates.trackingUrl ?? order.trackingUrl ?? null

  if (resend && becameShipped && order.email) {
    try {
      const html = await renderEmail({
        title: 'Votre commande est en route ✉️',
        intro: <p>Bonjour,</p>,
        children: (
          <>
            <p style={{ margin: '12px 0' }}>
              Bonne nouvelle&nbsp;! Ton colis a été remis aux services postaux et est désormais en chemin.
            </p>
            <p style={{ margin: '12px 0' }}>
              Référence commande&nbsp;: <strong>{order.id}</strong>
            </p>
            <p style={{ margin: '12px 0' }}>
              Statut actuel : <strong>{formatShippingStatus('shipped')}</strong>
            </p>
            {trackingUrl ? (
              <p style={{ margin: '12px 0' }}>
                Suivre le colis&nbsp;:
                {' '}
                <a href={trackingUrl} style={{ color: '#2563eb' }}>
                  {trackingUrl}
                </a>
              </p>
            ) : (
              <p style={{ margin: '12px 0' }}>
                Le suivi sera disponible dans les prochaines heures. Nous t’écrirons si un complément est nécessaire.
              </p>
            )}
            <p style={{ margin: '12px 0' }}>
              Les envois se font en lettre suivie via La Poste. Compte généralement 2 à 4 jours ouvrés pour la livraison.
            </p>
          </>
        ),
        footer: (
          <p>
            Besoin d’aide&nbsp;? Réponds simplement à cet email ou écris-nous sur{' '}
            <a href="mailto:contact@point-bleu.fr" style={{ color: '#2563eb' }}>
              contact@point-bleu.fr
            </a>
            .
          </p>
        ),
      })

      await resend.emails.send({
        from: process.env.RESEND_FROM || 'Vague <noreply@vague.art>',
        to: order.email,
        subject: 'Votre commande est expédiée',
        html,
      })
    } catch (err) {
      console.error('orders.patch shipping email failed', err)
    }
  }

  return NextResponse.json({ ok: true, order: serializeOrder(updatedRecord as any) })
})
