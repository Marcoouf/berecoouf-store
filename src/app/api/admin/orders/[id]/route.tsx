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
      shippingAmount: true,
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

  const resend = getResendClient()
  const contactEmail = process.env.CONTACT_EMAIL || process.env.SALES_NOTIF_OVERRIDE || 'contact@vague-galerie.store'

  const trackingUrl = updates.trackingUrl ?? order.trackingUrl ?? null

  if (resend && order.email && newStatus && newStatus !== order.shippingStatus) {
    const statusLabel = formatShippingStatus(newStatus)
    let introText = ''
    let extraInfo: React.ReactNode = null
    switch (newStatus) {
      case 'packing':
        introText = 'Ta commande est en préparation dans notre atelier.'
        break
      case 'shipped':
        introText = 'Bonne nouvelle ! Ton colis a été remis aux services postaux et est désormais en route.'
        extraInfo = (
          <p style={{ margin: '12px 0' }}>
            Les envois se font en lettre suivie via La Poste. Compte généralement 2 à 4 jours ouvrés pour la livraison.
          </p>
        )
        break
      case 'delivered':
        introText = 'Merci pour ta patience : la livraison est indiquée comme effectuée.'
        extraInfo = (
          <p style={{ margin: '12px 0' }}>
            Si tu n’as rien reçu ou si tu constates un souci, réponds simplement à cet email et nous ferons le nécessaire.
          </p>
        )
        break
      default:
        introText = `Le statut de ta commande a été mis à jour : ${statusLabel}.`
    }

    try {
      const html = await renderEmail({
        title: `Commande — ${statusLabel}`,
        intro: <p>Bonjour,</p>,
        children: (
          <>
            <p style={{ margin: '12px 0' }}>{introText}</p>
            <p style={{ margin: '12px 0' }}>
              Référence commande : <strong>{order.id}</strong>
              <br />
              Statut actuel : <strong>{statusLabel}</strong>
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
              <p style={{ margin: '12px 0' }}>Nous t’écrirons dès qu’un numéro de suivi sera disponible.</p>
            )}
            {extraInfo}
          </>
        ),
        footer: (
          <p>
            Besoin d’aide ? Réponds simplement à cet email ou écris-nous sur{' '}
            <a href={`mailto:${contactEmail}`} style={{ color: '#2563eb' }}>
              {contactEmail}
            </a>
            .
          </p>
        ),
      })

      await resend.emails.send({
        from: process.env.RESEND_FROM || 'Vague <noreply@vague.art>',
        to: order.email,
        subject: `Commande ${order.id} — ${statusLabel}`,
        html,
      })
    } catch (err) {
      console.error('orders.patch shipping email failed', err)
    }
  }

  return NextResponse.json({ ok: true, order: serializeOrder(updatedRecord as any) })
})

export const DELETE = withAdmin(async (_req: NextRequest, { params }: Params) => {
  const orderId = params.id

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } })
  if (!order) {
    return NextResponse.json({ ok: false, error: 'order_not_found' }, { status: 404 })
  }

  await prisma.order.delete({ where: { id: orderId } })

  return NextResponse.json({ ok: true })
})
