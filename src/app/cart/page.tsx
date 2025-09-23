'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from '@/components/SmartImage'
import { useCartCtx } from '@/components/CartContext'
import { euro } from '@/lib/format'

async function goToCheckout(payload: any) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('checkout-failed')
  const data = await res.json()
  if (!data?.url) throw new Error('missing-url')
  window.location.href = data.url as string
}

export default function CartPage() {
  const { items, updateQty, remove, clear, open, closeCart, hydrated } = useCartCtx()
  const [loading, setLoading] = useState(false)

  // Ferme le tiroir si on arrive sur /cart
  useEffect(() => {
    if (open) closeCart()
  }, [open, closeCart])

  const subtotal = useMemo(
    () => items.reduce((sum: number, i: any) => sum + Number(i?.unitPriceCents ?? 0) * Number(i?.qty ?? 1), 0),
    [items]
  )

  const handleCheckout = async () => {
    if (items.length === 0 || loading) return
    setLoading(true)
    try {
      const payload = {
        items: items.map((i: any) => ({
          workId: i?.artwork?.id ?? i?.workId ?? String(i?.key),
          variantId: i?.format?.id ?? i?.variantId ?? `${i?.artwork?.id ?? i?.key}-default`,
          title: i?.artwork?.title ?? i?.title ?? 'Œuvre',
          artistName: i?.artwork?.artist?.name ?? i?.artistName ?? '',
          image: i?.artwork?.image ?? i?.image ?? '',
          price: Number(i?.unitPriceCents ?? 0),
          qty: Number(i?.qty ?? 1),
        })),
      }
      await goToCheckout(payload)
    } catch (err) {
      console.error(err)
      alert('Une erreur est survenue lors de la création du paiement. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  // Affiche un état de chargement tant que le contexte n'est pas hydraté (évite le flash "panier vide")
  if (!hydrated) {
    return (
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <h1 className="text-xl font-semibold mb-6">Votre panier</h1>
        <div className="rounded-xl border p-8 text-center text-neutral-500">
          Chargement du panier…
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-semibold mb-6">Votre panier</h1>

      {items.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <p className="text-neutral-600">Votre panier est vide.</p>
          <Link href="/artworks" className="mt-4 inline-block underline">
            Découvrir les œuvres
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Liste des lignes */}
          <div className="space-y-4">
            {items.map((i: any) => (
              <div key={i.key} className="rounded-xl border p-4 flex gap-4 items-start">
                <div className="relative h-20 w-20 overflow-hidden rounded border">
                  <Image src={i?.artwork?.image} alt={i?.artwork?.title ?? 'Œuvre'} fill className="object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{i?.artwork?.title}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {i?.format ? `Format — ${i?.format?.label}` : 'Format standard'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(i.key)}
                      className="text-xs text-neutral-500 hover:text-accent"
                    >
                      Retirer
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-xs text-neutral-500" htmlFor={`qty-${i.key}`}>
                      Qté
                    </label>
                    <input
                      id={`qty-${i.key}`}
                      type="number"
                      min={1}
                      value={i?.qty ?? 1}
                      onChange={(e) => updateQty(i?.key, Math.max(1, Number(e.target.value)))}
                      className="w-20 rounded border px-2 py-1 text-sm"
                    />
                    <div className="ml-auto text-sm tabular-nums">
                      {euro(Number(i?.unitPriceCents ?? 0) * Number(i?.qty ?? 1))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Récapitulatif */}
          <aside className="rounded-xl border p-4 h-fit sticky top-24">
            <h2 className="font-medium mb-3">Récapitulatif</h2>
            <div className="flex justify-between text-sm py-1">
              <span>Sous-total</span>
              <span className="tabular-nums">{euro(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm py-1 text-neutral-500">
              <span>Livraison</span>
              <span>Calculée à l’étape suivante</span>
            </div>
            <div className="mt-2 flex justify-between font-medium">
              <span>Total</span>
              <span className="tabular-nums">{euro(subtotal)}</span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={items.length === 0 || loading}
              aria-busy={loading}
              className="mt-4 w-full rounded-lg bg-accent text-ink px-4 py-2 text-sm font-medium hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Redirection en cours…' : 'Procéder au paiement'}
            </button>

            <button
              type="button"
              onClick={() => clear()}
              className="mt-2 w-full rounded-lg border border-accent px-4 py-2 text-xs text-accent hover:bg-accent-light transition"
            >
              Vider le panier
            </button>

            <p className="mt-2 text-xs text-neutral-500">
              Taxes et frais d’expédition calculés au paiement.
            </p>
          </aside>
        </div>
      )}
    </main>
  )
}