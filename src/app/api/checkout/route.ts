// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

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

    // 1) On va chercher UNIQUEMENT les variants en base
    const variantIds = [...new Set(items.map((i) => i.variantId).filter(Boolean))]
    if (!variantIds.length) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
    }

type VariantWithWork = {
  id: string
  price: number
  label: string
  workId: string
  work: { id: string; title: string; slug: string; artist: { id: string; isOnVacation: boolean } | null }
}

    const variants: VariantWithWork[] = await prisma.variant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        price: true,
        label: true,
        workId: true,
        work: { select: { id: true, title: true, slug: true, artist: { select: { id: true, isOnVacation: true } } } },
      },
    })

    const vMap = new Map(variants.map((v) => [v.id, v]))

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

    // 3) Créer la commande "pending" AVANT Stripe (propre)
    const order = await (prisma as any).order.create({
      data: {
        email: email ?? null,
        status: 'pending',
        total: orderTotal, // centimes
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
