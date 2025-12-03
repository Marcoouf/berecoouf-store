// src/app/merci/page.tsx
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import CheckoutSuccessClient from '@/components/CheckoutSuccessClient'
import Link from 'next/link'

// NOTE: cette page est un Server Component, mais on veille à ce qu'aucun overlay
// décoratif ne capture les clics. On rend CheckoutSuccessClient sous le contenu
// et avec pointer-events: none.

type Props = { searchParams?: { session_id?: string; orderId?: string } }

const SHIPPING_LABELS: Record<string, string> = {
  pending: 'En attente',
  packing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
}

export default async function MerciPage({ searchParams }: Props) {
  const sessionId = searchParams?.session_id
  const orderId = searchParams?.orderId

  const orderRecord = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, shippingStatus: true, trackingUrl: true, updatedAt: true },
      })
    : null

  if (!sessionId) {
    return (
      <main className="relative z-10 mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Merci pour votre commande</h1>
        <p className="text-neutral-600">Référence de paiement inconnue.</p>
        <Link href="/" className="mt-6 inline-block underline">Retourner à la galerie</Link>
      </main>
    )
  }

  // Récupère la session + ses lignes
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price.product', 'payment_intent.latest_charge'],
  })

  const email = session.customer_details?.email ?? session.customer_email ?? ''
  const amount = (session.amount_total ?? 0) / 100
  const currency = (session.currency ?? 'eur').toUpperCase()
  const items = (session.line_items?.data ?? []).map((li) => {
    const qty = li.quantity ?? 1
    const unit = (li.price?.unit_amount ?? 0) / 100
    const name =
      li.description || (li.price?.product && typeof li.price.product !== 'string'
        ? (li.price?.product as any)?.name ?? li.description
        : li.description)
    return { name, qty, unit, total: unit * qty }
  })

  const shippingStatus = orderRecord?.shippingStatus ?? null
  const trackingUrl = orderRecord?.trackingUrl ?? null
  const trackingTarget = trackingUrl || '#suivi'

  // URL du reçu Stripe (charge associée à la session)
  const paymentIntent = session.payment_intent
  const latestCharge =
    paymentIntent && typeof paymentIntent !== 'string'
      ? (paymentIntent as Stripe.PaymentIntent).latest_charge
      : null
  const receiptUrl =
    latestCharge && typeof latestCharge !== 'string'
      ? (latestCharge as Stripe.Charge)?.receipt_url ?? null
      : (paymentIntent as any)?.charges?.data?.[0]?.receipt_url ?? null

  return (
    <div className="relative">
      {/* Effets visuels en arrière-plan, ne capte pas les clics */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <CheckoutSuccessClient />
      </div>

      {/* Contenu interactif au-dessus */}
      <main className="relative z-10 mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Merci pour votre commande</h1>
        <p className="text-neutral-600">Votre paiement a été confirmé.</p>
        <p className="mt-1 text-sm text-neutral-500 break-all">Référence : {session.id}</p>

        <section className="mt-6 rounded-xl border p-4">
          <h2 className="font-medium mb-3">Récapitulatif</h2>
          <ul className="divide-y">
            {items.map((it, idx) => (
              <li key={idx} className="py-2 flex justify-between text-sm">
                <span>
                  {it.name}{' '}
                  <span className="text-neutral-500">× {it.qty}</span>
                </span>
                <span className="tabular-nums">{it.total.toFixed(2)} {currency}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between font-medium">
            <span>Total</span>
            <span className="tabular-nums">{amount.toFixed(2)} {currency}</span>
          </div>
          {email && (
            <p className="mt-2 text-xs text-neutral-500">
              Un reçu a été envoyé à <span className="font-medium">{email}</span>.
            </p>
          )}
        </section>

        {orderRecord ? (
          <section id="suivi" className="mt-6 rounded-xl border border-neutral-200 bg-white/70 p-4">
            <h2 className="font-medium mb-2">Suivi d’expédition</h2>
            <p className="text-sm text-neutral-600">
              Statut :{' '}
              <span className="font-semibold text-neutral-900">
                {shippingStatus ? SHIPPING_LABELS[shippingStatus] ?? shippingStatus : 'En attente'}
              </span>
            </p>
            {trackingUrl ? (
              <p className="mt-2 text-sm">
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-ink transition hover:bg-neutral-100"
                >
                  <span aria-hidden>🔍</span>
                  Consulter le suivi La Poste
                </a>
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">
                Nous te préviendrons par email dès que le numéro de suivi sera disponible. Les œuvres partent en lettre
                suivie via La Poste.
              </p>
            )}
          </section>
        ) : null}

        <section className="mt-6 grid gap-3 md:grid-cols-2">
          {receiptUrl ? (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener"
              className="group inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <span aria-hidden className="text-base">📄</span>
              Télécharger le reçu PDF
            </a>
          ) : (
            <a
              href={`mailto:contact@vague-galerie.store?subject=Reçu%20commande%20${encodeURIComponent(session.id)}`}
              className="group inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <span aria-hidden className="text-base">📄</span>
              Demander le reçu PDF
            </a>
          )}
          <Link
            href={trackingTarget}
            target={trackingUrl ? '_blank' : undefined}
            rel={trackingUrl ? 'noopener' : undefined}
            className="group inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <span aria-hidden className="text-base">🚚</span>
            Suivre la préparation et l’envoi
          </Link>
        </section>

        <p className="mt-4 flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
          <span aria-hidden className="text-lg">✅</span>
          Les tirages sont préparés sous 3 à 5 jours ouvrés. Nous envoyons un email avec le suivi dès l’expédition.
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Continuer les achats
          </Link>
        </div>
      </main>
    </div>
  )
}
