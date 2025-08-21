'use client'

import Link from 'next/link'
import Image from '@/components/SmartImage'
import { useCart } from '@/components/CartContext'
import { euro } from '@/lib/format'

export default function CartPage() {
  const { items, updateQty, remove, clear, total } = useCart()

  const isEmpty = items.length === 0

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-tight">Votre panier</h1>
        <Link href="/artworks" className="text-sm hover:underline underline-offset-4">
          ← Continuer vos achats
        </Link>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border p-10 text-center">
          <p className="text-neutral-600">Votre panier est vide.</p>
          <div className="mt-4">
            <Link
              href="/artworks"
              className="rounded-full bg-accent hover:bg-accent-dark text-ink px-4 py-2 text-sm font-medium"
            >
              Parcourir les œuvres
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-[1fr_320px]">
          {/* Liste d'articles */}
          <ul className="space-y-5">
            {items.map((i) => (
              <li key={i.key} className="flex gap-4 rounded-xl border p-3">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border">
                  <Image src={i.artwork.image} alt="" fill className="object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {i.artwork.slug ? (
                          <Link href={`/artworks/${i.artwork.slug}`} className="hover:underline">
                            {i.artwork.title}
                          </Link>
                        ) : (
                          i.artwork.title
                        )}
                      </div>
                      {i.format && (
                        <div className="mt-0.5 text-xs text-neutral-500">
                          Format — {i.format.label}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => remove(i.key)}
                      className="text-xs text-neutral-500 hover:text-accent"
                    >
                      Retirer
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-xs text-neutral-500" htmlFor={`qty-${i.key}`}>
                      Qté
                    </label>
                    <input
                      id={`qty-${i.key}`}
                      type="number"
                      min={1}
                      value={i.qty}
                      onChange={(e) => updateQty(i.key, Math.max(1, Number(e.target.value)))}
                      className="w-20 rounded border px-2 py-1 text-sm"
                    />

                    <div className="ml-auto text-sm tabular-nums">
                      {euro((i.format?.price ?? i.artwork.price) * i.qty)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Récap */}
          <aside className="rounded-2xl border p-4 h-fit">
            <h2 className="text-sm font-medium">Récapitulatif</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span className="tabular-nums">{euro(total)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Livraison</span>
                <span>Calculée à l’étape suivante</span>
              </div>
            </div>

            <div className="mt-4 border-t pt-4 flex items-center justify-between text-sm font-medium">
              <span>Total</span>
              <span className="tabular-nums">{euro(total)}</span>
            </div>

            <div className="mt-4 space-y-2">
              <button className="w-full rounded-lg bg-accent hover:bg-accent-dark text-ink font-medium px-3 py-2 text-sm transition">
                Procéder au paiement
              </button>
              <button
                onClick={clear}
                className="w-full rounded-lg border border-accent px-3 py-2 text-xs text-accent hover:bg-accent-light transition"
              >
                Vider le panier
              </button>
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              Taxes et frais d’expédition calculés au paiement.
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}