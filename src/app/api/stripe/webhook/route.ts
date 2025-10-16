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

  const orderInclude = {
    items: {
      include: {
        work: {
          select: {
            id: true,
            title: true,
            slug: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
                contactEmail: true,
              },
            },
          },
        },
        variant: {
          select: { id: true, label: true },
        },
      },
    },
  } as const

  type TxResult = {
    order: (Awaited<ReturnType<typeof prisma.order.findUnique>> & { items: any[] }) | null
    alreadyPaid: boolean
    missing: Array<{ workId: string; variantId: string | null }>
  }

  const txResult: TxResult = await prisma.$transaction(async (tx: any) => {
    const hasOrder = tx && typeof tx === 'object' && tx.order && typeof tx.order.findFirst === 'function'
    const hasOrderItem = tx && typeof tx === 'object' && tx.orderItem && typeof tx.orderItem.create === 'function'
    if (!hasOrder || !hasOrderItem) {
      console.warn('webhook: Order/OrderItem models not available in Prisma client → skipping persistence')
      return { order: null, alreadyPaid: false, missing: [] }
    }

    const orderIdFromMetadata = typeof session.metadata?.orderId === 'string' ? session.metadata.orderId : null

    let existing = await tx.order.findFirst({
      where: { stripeSessionId: session.id },
      include: orderInclude,
    })

    if (!existing && orderIdFromMetadata) {
      existing = await tx.order.findUnique({
        where: { id: orderIdFromMetadata },
        include: orderInclude,
      })
    }

    if (existing && existing.status === 'paid') {
      return { order: existing, alreadyPaid: true, missing: [] }
    }

    if (existing) {
      await tx.order.update({
        where: { id: existing.id },
        data: {
          status: 'paid',
          total: typeof totalCents === 'number' ? totalCents : existing.total,
          email: email || existing.email,
          stripeSessionId: session.id,
        },
      })

      const refreshed = await tx.order.findUnique({ where: { id: existing.id }, include: orderInclude })
      return { order: refreshed, alreadyPaid: false, missing: [] }
    }

    const variantIds = Array.from(new Set(items.map((i) => i.variantId).filter(Boolean))) as string[]
    const variants: Array<{ id: string; label: string; workId: string }> = variantIds.length
      ? await tx.variant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, label: true, workId: true },
        })
      : []

    const variantMap = new Map<string, { id: string; label: string; workId: string }>(
      variants.map((v) => [v.id, v]),
    )
    const createItems: Array<{ workId: string; variantId: string; qty: number; unitPrice: number }> = []
    const missing: Array<{ workId: string; variantId: string | null }> = []

    for (const it of items) {
      if (!it.variantId) {
        missing.push({ workId: it.workId, variantId: null })
        continue
      }
      const variant = variantMap.get(it.variantId)
      if (!variant || variant.workId !== it.workId) {
        missing.push({ workId: it.workId, variantId: it.variantId })
        continue
      }
      createItems.push({
        workId: variant.workId,
        variantId: variant.id,
        qty: it.qty,
        unitPrice: it.unitPrice,
      })
    }

    const created = await tx.order.create({
      data: {
        email: email || null,
        total: typeof totalCents === 'number' ? totalCents : 0,
        status: 'paid',
        stripeSessionId: session.id,
        items: {
          create: createItems,
        },
      },
      include: orderInclude,
    })

    if (missing.length) {
      console.warn('webhook: some items missing variant mapping', missing)
    }

    return { order: created, alreadyPaid: false, missing }
  })

  const orderRecord = txResult.order
  if (!orderRecord) {
    return ok({ skipped: 'order_not_recorded' })
  }

  if (txResult.alreadyPaid) {
    return ok({ ignored: 'already_paid' })
  }

  const siteUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')
  const orderTotalCents = typeof totalCents === 'number' ? totalCents : orderRecord.total || 0
  const fmtCurrency = (amountCents: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format((amountCents || 0) / 100)

  type ArtistMail = {
    to: string
    artistName: string
    artistSlug?: string | null
    items: Array<{
      title: string
      variantLabel?: string | null
      qty: number
      unitPrice: number
      lineTotal: number
      artworkSlug: string
    }>
  }

  const artistGroups = new Map<string, ArtistMail>()
  const missingContacts = new Set<string>()

  for (const item of orderRecord.items ?? []) {
    const work = item.work as any
    const artist = work?.artist as any
    if (!artist) continue

    const to = typeof artist.contactEmail === 'string' ? artist.contactEmail.trim() : ''
    const key = artist.id || `artist-${work.id}`
    const stored: ArtistMail =
      artistGroups.get(key) ?? {
        to,
        artistName: artist.name || 'Artiste',
        artistSlug: artist.slug || null,
        items: [] as ArtistMail['items'],
      }

    stored.to = stored.to || to
    stored.items.push({
      title: work.title,
      variantLabel: item.variant?.label ?? null,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.qty,
      artworkSlug: work.slug,
    })

    if (!stored.to) missingContacts.add(stored.artistName)

    artistGroups.set(key, stored)
  }

  // 4) Notification email (optionnelle, pas bloquante)
  const artistSendFailures: Array<{ to: string; artist: string; reason: string }> = []

  if (resend) {
    for (const entry of artistGroups.values()) {
      if (!entry.to) continue
      try {
        const rows = entry.items
          .map(
            (it) => `
              <tr>
                <td style="padding:4px 8px;">${it.qty}×</td>
                <td style="padding:4px 8px;">${it.title}${it.variantLabel ? ` — ${it.variantLabel}` : ''}</td>
                <td style="padding:4px 8px; text-align:right;">${fmtCurrency(it.unitPrice)}</td>
                <td style="padding:4px 8px; text-align:right;">${fmtCurrency(it.lineTotal)}</td>
              </tr>
            `,
          )
          .join('')

        const artworksLinks = siteUrl
          ? entry.items
              .map((it) => `<a href="${siteUrl}/artworks/${it.artworkSlug}" style="color:#111111;">${it.title}</a>`)
              .join(', ')
          : ''

        const html = `
          <h2>Nouvelle commande confirmée</h2>
          <p>Commande <strong>${orderRecord.id}</strong> — ${fmtCurrency(orderTotalCents)}</p>
          <p>Client : ${email || 'Non renseigné'}</p>
          <table style="border-collapse:collapse; margin-top:12px;">
            <thead>
              <tr>
                <th style="text-align:left; padding:4px 8px;">Qté</th>
                <th style="text-align:left; padding:4px 8px;">Œuvre</th>
                <th style="text-align:right; padding:4px 8px;">PU</th>
                <th style="text-align:right; padding:4px 8px;">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          ${artworksLinks ? `<p style="margin-top:12px;">Liens : ${artworksLinks}</p>` : ''}
          <p style="margin-top:12px;">Vous recevrez les détails logistiques très bientôt. Merci !</p>
        `

        await resend.emails.send({
          from: process.env.RESEND_FROM || 'Vague <noreply@vague.art>',
          to: entry.to,
          subject: `Nouvelle commande — ${entry.artistName}`,
          html,
        })
      } catch (err: any) {
        artistSendFailures.push({ to: entry.to, artist: entry.artistName, reason: err?.message || 'unknown_error' })
        console.error('webhook artist email error', entry.to, err)
      }
    }
  } else if (artistGroups.size) {
    console.log('Webhook OK, notifications artistes non envoyées (Resend non configuré).')
  }

  try {
    const adminTo = (process.env.SALES_NOTIF_OVERRIDE || '').trim()
    if (resend && adminTo) {
      const adminRows = (orderRecord.items ?? [])
        .map((it) => {
          const work = it.work as any
          const artist = work?.artist as any
          return `
            <tr>
              <td style="padding:4px 8px;">${artist?.name || 'Artiste'}</td>
              <td style="padding:4px 8px;">${work?.title || it.workId}</td>
              <td style="padding:4px 8px;">${it.variant?.label || 'Format'}</td>
              <td style="padding:4px 8px; text-align:right;">${it.qty}</td>
              <td style="padding:4px 8px; text-align:right;">${fmtCurrency(it.unitPrice)}</td>
              <td style="padding:4px 8px; text-align:right;">${fmtCurrency(it.unitPrice * it.qty)}</td>
            </tr>
          `
        })
        .join('')

      const missingArtists = missingContacts.size
        ? `<p><strong>Attention :</strong> aucun email de contact pour ${Array.from(missingContacts).join(', ')}.</p>`
        : ''

      const fallbackWarnings = txResult.missing.length
        ? `<p><strong>Articles ignorés (variant introuvable):</strong> ${txResult.missing
            .map((m) => `${m.workId}${m.variantId ? `/${m.variantId}` : ''}`)
            .join(', ')}</p>`
        : ''

      const failures = artistSendFailures.length
        ? `<p><strong>Envois artistes en erreur:</strong> ${artistSendFailures
            .map((f) => `${f.artist} (${f.to})`)
            .join(', ')}.</p>`
        : ''

      const html = `
        <h2>Nouvelle commande confirmée</h2>
        <p><strong>Commande :</strong> ${orderRecord.id}</p>
        <p><strong>Session Stripe :</strong> ${session.id}</p>
        <p><strong>Client :</strong> ${email || '(inconnu)'}</p>
        <p><strong>Total :</strong> ${fmtCurrency(orderTotalCents)}</p>
        <table style="border-collapse:collapse; margin-top:16px;">
          <thead>
            <tr>
              <th style="text-align:left; padding:4px 8px;">Artiste</th>
              <th style="text-align:left; padding:4px 8px;">Œuvre</th>
              <th style="text-align:left; padding:4px 8px;">Format</th>
              <th style="text-align:right; padding:4px 8px;">Qté</th>
              <th style="text-align:right; padding:4px 8px;">PU</th>
              <th style="text-align:right; padding:4px 8px;">Total</th>
            </tr>
          </thead>
          <tbody>${adminRows}</tbody>
        </table>
        ${missingArtists}
        ${failures}
        ${fallbackWarnings}
      `

      await resend.emails.send({
        from: process.env.RESEND_FROM || 'Vague <noreply@vague.art>',
        to: adminTo,
        subject: 'Nouvelle commande — récapitulatif',
        html,
      })
    } else if (adminTo) {
      console.log('Webhook OK, notification admin non envoyée (Resend non configuré).')
    }
  } catch (e) {
    console.error('webhook admin email error', e)
  }

  return ok({ orderId: orderRecord.id })
}
