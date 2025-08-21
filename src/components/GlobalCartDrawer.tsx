'use client'

import Link from 'next/link'
import Image from '@/components/SmartImage'
import { useEffect, useRef } from 'react'
import { useCart } from '@/components/CartContext'
import { euro } from '@/lib/format'

export default function GlobalCartDrawer() {
  const { items, total, updateQty, remove, clear, open, closeCart } = useCart()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) closeCart()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, closeCart])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex md:justify-end bg-black/20 backdrop-blur-sm">
      <aside id="cart-drawer" role="dialog" aria-modal="true" ref={ref} className="h-full w-full md:max-w-md md:border-l bg-white px-4 sm:px-6 py-5 flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-medium">Panier</h3>
          <button
            onClick={closeCart}
            className="rounded-full border border-accent px-3 py-1 text-sm text-accent hover:bg-accent-light transition"
          >
            Fermer
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-neutral-600">Votre panier est vide.</p>
        ) : (
          <div className="flex h-full flex-col">
            <ul className="flex-1 space-y-4 overflow-auto pr-2">
              {items.map(i => (
                <li key={i.key} className="flex gap-3">
                  <div className="h-16 w-16 rounded border overflow-hidden relative">
                    <Image src={i.artwork.image} alt="" fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="truncate text-sm font-medium">{i.artwork.title}</div>
                      <button onClick={() => remove(i.key)} className="text-xs text-neutral-500 hover:text-accent">Retirer</button>
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      {i.format ? `Format — ${i.format.label}` : 'Format standard'}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={i.qty}
                        onChange={(e) => updateQty(i.key, Math.max(1, Number(e.target.value)))}
                        className="w-16 rounded border px-2 py-1 text-sm"
                      />
                      <div className="ml-auto text-sm tabular-nums">{euro((i.format?.price ?? i.artwork.price) * i.qty)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="sticky bottom-0 -mx-4 sm:-mx-6 bg-white/90 supports-[backdrop-filter]:bg-white/60 backdrop-blur border-t px-4 sm:px-6 pt-4 pb-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="tabular-nums">{euro(total)}</span>
              </div>

<Link
  href="/cart"
  onClick={() => closeCart()}
  className="w-full inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
>
  Voir le panier complet
</Link>

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
          </div>
        )}
      </aside>
    </div>
  )
}