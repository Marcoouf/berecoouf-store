// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { Prisma } from '@prisma/client'

const SHIPPING_BASE_CENTS = (() => {
  const raw = Number(process.env.SHIPPING_BASE_CENTS_FR ?? '600')
  return Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : 600
})()
const SHIPPING_FREE_THRESHOLD_CENTS = (() => {
  const raw = Number(process.env.SHIPPING_FREE_THRESHOLD_CENTS_FR ?? '9000')
  return Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : 9000
})()

function getOrigin(req: NextRequest) {
  const h = req.headers
  const fromHeader = h.get('origin')
  if (fromHeader) return fromHeader
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

function isVerbose(req: NextRequest) {
  if (process.env.VERBOSE_CHECKOUT === '1') return true
  const origin = req.headers.get('origin') || ''
  return /localhost|127\.0\.0\.1/i.test(origin)
}

// Util small: borne inférieure (>= 1) pour les quantités
const clampQty = (n: unknown) => {
  const q = typeof n === 'number' ? Math.floor(n) : 0
  return q > 0 ? q : 1
}

// Stripe attend des montants en centimes (EUR).
const toStripeAmount = (cents: number) => {
  const n = Number(cents)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
}

type VariantWithWork = {
  id: string
  price: number
  label: string
  workId: string
  stock: number | null
  work: { id: string; title: string; slug: string; artist: { id: string; isOnVacation: boolean } | null }
}

function computeShippingTotal(
  items: IncomingItem[],
  vMap: Map<string, VariantWithWork>,
  baseCents: number,
  freeThresholdCents: number,
) {
  const byArtist = new Map<string, number>()
  for (const it of items) {
    const v = vMap.get(it.variantId)
    if (!v) continue
    const artistId = v.work.artist?.id || '__unknown__'
    const qty = clampQty(it.qty)
    const unit = toStripeAmount(v.price ?? 0)
    byArtist.set(artistId, (byArtist.get(artistId) ?? 0) + unit * qty)
  }
  let total = 0
  for (const subtotal of byArtist.values()) {
    if (freeThresholdCents > 0 && subtotal >= freeThresholdCents) continue
    total += baseCents
  }
  return { shippingTotal: total, breakdownCount: byArtist.size }
}

type IncomingItem = {
  workId: string
  variantId: string
  qty?: number
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'stripe_not_configured', message: 'Clé Stripe manquante (STRIPE_SECRET_KEY).' },
        { status: 500 },
      )
    }

    const body = await req.json().catch(() => ({}))
    const email: string | undefined = typeof body?.email === 'string' ? body.email : undefined
    const items: IncomingItem[] = Array.isArray(body?.items) ? body.items : []

    if (!items.length) {
      return NextResponse.json({ error: 'empty_cart' }, { status: 400 })
    }

    // Nettoyage léger : libère le stock des commandes pending trop anciennes
    const staleDate = new Date(Date.now() - 1000 * 60 * 60 * 24) // 24h
    await prisma.order.updateMany({
      where: { status: 'pending', createdAt: { lt: staleDate } },
      data: { status: 'cancelled' },
    })

    // 1) On va chercher UNIQUEMENT les variants en base
    const variantIds = [...new Set(items.map((i) => i.variantId).filter(Boolean))]
    if (!variantIds.length) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
    }

    const variants: VariantWithWork[] = await prisma.variant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        price: true,
        label: true,
        workId: true,
        stock: true,
        work: { select: { id: true, title: true, slug: true, artist: { select: { id: true, isOnVacation: true } } } },
      },
    })

    const vMap = new Map(variants.map((v) => [v.id, v]))
    const requestedByVariant = new Map<string, number>()

    // 2) Construire les lignes Stripe + valider les prix > 0
    const zeroPrice: Array<{ workId: string; variantId: string }> = []
    const vacationBlocked: Array<{ workId: string; variantId: string }> = []
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    let orderTotal = 0

    for (const it of items) {
      const v = vMap.get(it.variantId)
      if (!v || v.workId !== it.workId) {
        // variant inexistant ou ne correspond pas à l’œuvre → on ignore dans Stripe, mais on NE crée pas l’order
        zeroPrice.push({ workId: it.workId, variantId: it.variantId })
        continue
      }

      if (v.work.artist?.isOnVacation) {
        vacationBlocked.push({ workId: v.workId, variantId: v.id })
        continue
      }

      const unitCents = toStripeAmount(v.price ?? 0)
      const qty = clampQty(it.qty)

      if (!Number.isFinite(unitCents) || unitCents < 50) {
        // Stripe impose un minimum de 50 centimes
        zeroPrice.push({ workId: it.workId, variantId: it.variantId })
        continue
      }

      requestedByVariant.set(v.id, (requestedByVariant.get(v.id) ?? 0) + qty)
      orderTotal += unitCents * qty

      lineItems.push({
        quantity: qty,
        price_data: {
          currency: 'eur',
          unit_amount: unitCents,
          product_data: {
            name: `${v.work.title} — ${v.label}`,
            metadata: {
              workId: v.workId,
              variantId: v.id,
              slug: v.work.slug,
              variant: v.label,
            },
          },
        },
      })
    }

    // Si au moins un item a un prix 0 ou variant invalide → on bloque
    if (zeroPrice.length) {
      return NextResponse.json(
        {
          error: 'zero_price_item',
          message:
            'Un ou plusieurs articles ont un prix invalide (0€) ou un variant introuvable. Corrigez le prix dans l’admin puis réessayez.',
          items: zeroPrice,
        },
        { status: 400 },
      )
    }

    if (vacationBlocked.length) {
      return NextResponse.json(
        {
          error: 'artist_unavailable',
          message: "L'artiste est temporairement indisponible : les commandes seront possibles dès son retour.",
          items: vacationBlocked,
        },
        { status: 400 },
      )
    }

    if (!lineItems.length || orderTotal <= 0) {
      return NextResponse.json({ error: 'empty_or_invalid' }, { status: 400 })
    }

    // 2bis) Calcul frais de livraison France par artiste (forfait + gratuité)
    const { shippingTotal } = computeShippingTotal(items, vMap, SHIPPING_BASE_CENTS, SHIPPING_FREE_THRESHOLD_CENTS)
    const grandTotal = orderTotal + shippingTotal
    if (shippingTotal > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: toStripeAmount(shippingTotal),
          product_data: { name: 'Livraison (France)' },
        },
      })
    }

    // 3) Créer la commande "pending" AVANT Stripe (propre) en vérifiant le stock limité
    let order: { id: string } | null = null
    try {
      order = await prisma.$transaction(
        async (tx) => {
          if (requestedByVariant.size) {
            const stockUsage = await tx.orderItem.groupBy({
              by: ['variantId'],
              where: {
                variantId: { in: Array.from(requestedByVariant.keys()) },
                order: { status: { in: ['pending', 'paid'] } },
              },
              _sum: { qty: true },
            })
            const alreadyUsed = new Map<string, number>(stockUsage.map((entry) => [entry.variantId, entry._sum?.qty ?? 0]))
            const shortages: Array<{ workId: string; variantId: string; available: number }> = []
            for (const [variantId, requested] of requestedByVariant.entries()) {
              const variant = vMap.get(variantId)
              if (!variant) continue
              if (variant.stock == null) continue
              const remaining = Math.max(0, variant.stock - (alreadyUsed.get(variantId) ?? 0))
              if (requested > remaining) {
                shortages.push({ workId: variant.workId, variantId, available: remaining })
              }
            }
            if (shortages.length) {
              const err: any = new Error('out_of_stock')
              err.code = 'out_of_stock'
              err.detail = shortages
              throw err
            }
          }

          return tx.order.create({
            data: {
              email: email ?? null,
              status: 'pending',
              total: grandTotal, // centimes (produits + port)
              shippingAmount: shippingTotal,
              shippingStatus: 'pending',
              trackingUrl: null,
              items: {
                create: items.map((it) => {
                  const v = vMap.get(it.variantId)!
                  return {
                    workId: v.workId,
                    variantId: v.id,
                    qty: clampQty(it.qty),
                    unitPrice: v.price, // en centimes, conformément au schéma Prisma
                  }
                }),
              },
            },
            select: { id: true },
          })
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
    } catch (err: any) {
      if (err?.code === 'out_of_stock') {
        return NextResponse.json(
          {
            error: 'out_of_stock',
            message: 'Le stock est insuffisant pour au moins un format. Mets le panier à jour.',
            detail: err?.detail ?? [],
          },
          { status: 400 },
        )
      }
      throw err
    }

    if (!order) {
      throw new Error('order_creation_failed')
    }

    // 4) Créer la session Stripe – metadata ultra compacte (orderId seulement)
    const origin = process.env.NEXT_PUBLIC_BASE_URL || getOrigin(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: lineItems,
      success_url: `${origin}/merci?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?cancel=1`,
      allow_promotion_codes: true,
      metadata: {
        orderId: order.id,
      },
    })

    // 5) Sauvegarder l’id de session Stripe
    await (prisma as any).order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    // Affiche le détail en local ou si VERBOSE_CHECKOUT=1
    const rawMsg =
      err?.raw?.message || err?.message || (typeof err === 'string' ? err : 'checkout_failed')
    console.error('checkout_error:', rawMsg, err?.raw || '')

    const verbose = isVerbose(req) || process.env.NODE_ENV !== 'production'
    const payload = verbose
      ? { error: 'checkout_failed', message: String(rawMsg) }
      : { error: 'checkout_failed' }

    return NextResponse.json(payload, { status: 400 })
  }
}
