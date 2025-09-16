'use client'

import Link from 'next/link'
import Image from '@/components/SmartImage'
import { useCart } from '@/components/CartContext'
import { euro } from '@/lib/format'
import { useState } from 'react'

async function goToCheckout(payload: any) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('checkout-failed');
  const data = await res.json();
  if (!data?.url) throw new Error('missing-url');
  window.location.href = data.url as string;
}

export default function GlobalCartDrawer() {
  const { items, total, updateQty, remove, clear, open, closeCart } = useCart()
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handlePay = async () => {
    if (items.length === 0 || loading) return;
    setLoading(true);
    try {
      const mapped = items.map(i => ({
        workId: (i as any).artwork?.id ?? (i as any).workId ?? String(i.key),
        variantId: (i as any).format?.id ?? (i as any).variantId ?? `${(i as any).artwork?.id ?? i.key}-default`,
        title: (i as any).artwork?.title ?? (i as any).title ?? 'Œuvre',
        artistName: (i as any).artwork?.artist?.name ?? (i as any).artistName,
        image: (i as any).artwork?.image ?? (i as any).image,
        price: Number((i as any).format?.price ?? (i as any).artwork?.price ?? (i as any).price ?? 0),
        qty: Number(i.qty ?? 1),
      }));
      await goToCheckout({ items: mapped });
    } catch (e) {
      console.error(e);
      alert('Une erreur est survenue lors de la création du paiement. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  // Empêche la propagation des clics à l'intérieur du panneau
  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div
      className="fixed inset-0 z-50 flex md:justify-end bg-black/20 backdrop-blur-sm"
      // Ne ferme que si on clique directement sur l'overlay (pas sur les enfants)
      onClick={(e) => {
        if (e.target !== e.currentTarget) return
        closeCart()
      }}
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return
      }}
    >
      <aside
        id="cart-drawer"
        role="dialog"
        aria-modal="true"
        onClick={stop}
        onMouseDown={stop}
        className="h-full w-full md:max-w-md md:border-l bg-white px-4 sm:px-6 py-5 flex flex-col"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-medium">Panier</h3>
          <button
            type="button"
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
                      <button type="button" onClick={() => remove(i.key)} className="text-xs text-neutral-500 hover:text-accent">Retirer</button>
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

              <button
                type="button"
                onClick={handlePay}
                disabled={items.length === 0 || loading}
                aria-busy={loading}
                className="w-full rounded-lg bg-accent hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed text-ink font-medium px-3 py-2 text-sm transition"
              >
                {loading ? 'Redirection en cours…' : 'Procéder au paiement'}
              </button>
              <button
                type="button"
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