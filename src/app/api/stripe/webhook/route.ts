// src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

// Resend (optionnel)
let resend: any = null
try {
  const { Resend } = require('resend')
  const key = process.env.RESEND_API_KEY
  if (key) resend = new Resend(key)
} catch {
  // paquet non installé → on continue sans email
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function ok(body: any = { received: true }, init: number | ResponseInit = 200) {
  return NextResponse.json(body, typeof init === 'number' ? { status: init } : init)
}
function bad(msg = 'bad_request', code = 400) {
  return new NextResponse(msg, { status: code })
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !whSecret) {
    // En dev sans secret, ne casse pas (noop)
    return ok({ skipped: 'missing_signature_or_secret' })
  }

  const rawBody = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret)
  } catch (err: any) {
    console.error('Webhook signature failed:', err?.message)
    return bad('invalid_signature', 400)
  }

  if (event.type !== 'checkout.session.completed') {
    return ok({ ignored: event.type })
  }

  const sessObj = event.data.object as { id: string }

  // 1) Récupération session sans expand exotique (shipping_details est directement présent)
  const session = (await stripe.checkout.sessions.retrieve(sessObj.id)) as unknown as Stripe.Checkout.Session

  // 2) Lignes de commande avec product expandé pour lire metadata (workId/variantId)
  const lines = await stripe.checkout.sessions.listLineItems(sessObj.id, {
    expand: ['data.price.product'],
    limit: 100,
  })

  const email = session.customer_details?.email || session.customer_email || ''
  const totalCents = session.amount_total ?? 0
  const currency = (session.currency || 'eur').toUpperCase()

  type Item = { workId: string; variantId: string | null; qty: number; unitPrice: number }
  const items: Item[] = []

  for (const li of lines.data ?? []) {
    const qty = li.quantity ?? 1
    const unit = li.price?.unit_amount ?? 0 // CENTIMES
    const product = (li.price?.product as Stripe.Product) || null
    const workId = (product?.metadata?.workId || '').toString()
    const variantIdRaw = (product?.metadata?.variantId || '').toString()
    const variantId = variantIdRaw.length ? variantIdRaw : null

    if (!workId || !unit || qty <= 0) continue
    items.push({ workId, variantId, qty, unitPrice: unit })
  }

  if (items.length === 0) {
    console.warn('webhook: no items from line_items', sessObj.id)
    return ok()
  }

  // 3) Transaction DB: créer Order + OrderItems (print uniquement)
  try {
    await prisma.$transaction(async (tx: any) => {
      // Certains schémas locaux n'ont pas encore Order/OrderItem → on vérifie dynamiquement
      const hasOrder = tx && typeof tx === 'object' && tx.order && typeof tx.order.create === 'function'
      const hasOrderItem = tx && typeof tx === 'object' && tx.orderItem && typeof tx.orderItem.create === 'function'
      if (!hasOrder || !hasOrderItem) {
        console.warn('webhook: Order/OrderItem models not available in Prisma client → skipping persistence')
        return
      }

      const order = await tx.order.create({
        data: {
          email: email || null,
          total: totalCents,
          status: 'paid',
          stripeSessionId: session.id,
        },
      })

      for (const it of items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            workId: it.workId,
            variantId: it.variantId || undefined,
            qty: it.qty,
            unitPrice: it.unitPrice, // CENTIMES
          },
        })
      }
    })
  } catch (e) {
    console.error('webhook db error', e)
    // On renvoie 200 pour éviter les retries agressifs pendant le dev,
    // mais logge bien pour rattraper l’état si besoin.
    return ok({ db: 'error' })
  }

  // 4) Notification email (optionnelle, pas bloquante)
  try {
    const to = (process.env.SALES_NOTIF_OVERRIDE || '').trim()
    if (resend && to) {
      const linesTxt = items
        .map((i) => `• ${i.qty} × ${i.workId}${i.variantId ? ` (${i.variantId})` : ''} — ${(i.unitPrice / 100).toFixed(2)} €`)
        .join('\n')
      const html = `
        <h2>Nouvelle commande confirmée</h2>
        <p><strong>Session:</strong> ${session.id}</p>
        <p><strong>Client:</strong> ${email || '(inconnu)'}</p>
        <p><strong>Total:</strong> ${(totalCents / 100).toFixed(2)} ${currency}</p>
        <h3>Articles</h3>
        <pre>${linesTxt}</pre>
      `
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'Vague <noreply@vague.art>',
        to,
        subject: 'Nouvelle commande — Vague',
        html,
      })
    } else {
      console.log('Webhook OK, notification non envoyée (Resend ou SALES_NOTIF_OVERRIDE manquant).')
    }
  } catch (e) {
    console.error('webhook email error', e)
  }

  return ok()
}