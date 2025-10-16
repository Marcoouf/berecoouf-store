'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from '@/components/SmartImage'
import { euro } from '@/lib/format'
import { useCartCtx } from '@/components/CartContext'

export default function GlobalCartDrawer() {
  const {
    items,
    remove,
    updateQty,
    clear,
    open,
    closeCart,
    overlayClick,
    checkout,
    checkingOut,
  } = useCartCtx()

  const subtotal = useMemo(
    () =>
      items.reduce((sum: number, i: any) => {
        const unit = Number(i?.unitPriceCents ?? 0)
        const qty = Number(i?.qty ?? 1)
        return sum + unit * qty
      }, 0),
    [items]
  )

  if (!open) return null

  return (
    <div
      id="cart-drawer"
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[79] flex"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[80] bg-neutral-900/40 pointer-events-auto"
        aria-hidden="true"
        onMouseDown={overlayClick}
      />

      {/* Panel */}
      <aside
        className="relative ml-auto h-full w-full max-w-md bg-white shadow-xl border-l border-line/60 flex flex-col z-[81] pointer-events-auto"
        onMouseDownCapture={(e) => e.stopPropagation()}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onTouchStartCapture={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-line/60">
          <h2 className="text-sm font-medium">Votre panier</h2>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              closeCart()
            }}
            className="text-xs text-neutral-600 hover:text-neutral-900"
          >
            Fermer
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-sm text-neutral-600">
              Votre panier est vide.<br />
              <Link href="/artworks" className="mt-2 inline-block underline">
                Découvrir les œuvres
              </Link>
            </div>
          ) : (
            items.map((i: any) => (
              <div key={i?.key} className="flex gap-3 border rounded-lg p-3">
                <div className="relative h-16 w-16 overflow-hidden rounded border">
                  <Image
                    src={i?.artwork?.image ?? ''}
                    alt={i?.artwork?.title ?? 'Œuvre'}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate text-sm">{i?.artwork?.title ?? 'Œuvre'}</div>
                      <div className="text-xs text-neutral-500">
                        {i?.format ? `Format — ${i?.format?.label}` : 'Format standard'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        remove(i?.key)
                      }}
                      className="text-xs text-neutral-500 hover:text-accent"
                    >
                      Retirer
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-2" role="group" aria-label="Quantité">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        updateQty(i?.key, Math.max(1, Number(i?.qty ?? 1) - 1))
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-sm hover:bg-neutral-50"
                      aria-label={`Diminuer la quantité pour ${i?.artwork?.title ?? 'l’œuvre'}`}
                      disabled={(i?.qty ?? 1) <= 1}
                    >
                      −
                    </button>
                    <span className="min-w-[2ch] text-center text-sm tabular-nums" aria-live="polite">
                      {i?.qty ?? 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        updateQty(i?.key, Math.max(1, Number(i?.qty ?? 1) + 1))
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-sm hover:bg-neutral-50"
                      aria-label={`Augmenter la quantité pour ${i?.artwork?.title ?? 'l’œuvre'}`}
                    >
                      +
                    </button>
                    <div className="ml-auto tabular-nums">
                      {euro(Number(i?.unitPriceCents ?? 0) * Number(i?.qty ?? 1))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line/60 p-4 space-y-3">
          <div className="flex justify-between text-sm" aria-live="polite">
            <span>Sous-total</span>
            <span className="tabular-nums">{euro(subtotal)}</span>
          </div>
          <p className="text-xs text-neutral-500">Taxes et frais d’expédition calculés au paiement.</p>

          <Link
            href="/cart"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // we do not close the cart to allow user to return easily
              window.location.href = '/cart'
            }}
            className="w-full block rounded-lg border border-line px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 text-center"
          >
            Voir le panier complet
          </Link>

          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (checkingOut) return;
              await checkout();
            }}
            disabled={items.length === 0 || checkingOut}
            aria-busy={checkingOut}
            className="w-full rounded-lg bg-accent text-ink px-4 py-2 text-sm font-medium hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {checkingOut ? 'Redirection…' : 'Procéder au paiement'}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              clear()
            }}
            className="w-full rounded-lg border border-accent px-4 py-2 text-xs text-accent hover:bg-accent-light transition"
          >
            Vider le panier
          </button>
        </div>
      </aside>
    </div>
  )
}