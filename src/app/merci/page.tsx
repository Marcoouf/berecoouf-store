// src/app/merci/page.tsx
import { stripe } from '@/lib/stripe'
import CheckoutSuccessClient from '@/components/CheckoutSuccessClient'
import Link from 'next/link'

// NOTE: cette page est un Server Component, mais on veille à ce qu'aucun overlay
// décoratif ne capture les clics. On rend CheckoutSuccessClient sous le contenu
// et avec pointer-events: none.

type Props = { searchParams?: { session_id?: string } }

export default async function MerciPage({ searchParams }: Props) {
  const sessionId = searchParams?.session_id

  if (!sessionId) {
    return (
      <main className="relative z-10 mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Merci pour votre commande</h1>
        <p className="text-neutral-600">Référence de paiement inconnue.</p>
        <Link href="/galerie" className="mt-6 inline-block underline">Retourner à la galerie</Link>
      </main>
    )
  }

  // Récupère la session + ses lignes
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price.product'],
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

        <div className="mt-6 flex gap-3">
          <Link
            href="/galerie"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Continuer vos achats
          </Link>
          <Link
            href="/account/orders"
            className="rounded-lg bg-accent text-ink px-4 py-2 text-sm hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Voir ma commande
          </Link>
        </div>
      </main>
    </div>
  )
}