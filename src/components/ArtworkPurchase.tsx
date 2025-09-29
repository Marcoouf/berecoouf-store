'use client'

import { useEffect, useMemo, useState } from 'react'
import { euro } from '@/lib/format'
import { useCart } from '@/components/CartContext'
import type { CartItem } from '@/lib/types'

// Types de props (light)
export type Format = { id: string; label: string; price: number }
export type ArtworkLite = {
  id: string
  title: string
  image?: string | null
  mockup?: string | null
  artistId?: string
  // les prix sont TOUJOURS en centimes
  price?: number | null
  basePrice?: number | null
  priceMin?: number | null
  formats?: Format[]
}

export default function ArtworkPurchase({ artwork }: { artwork: ArtworkLite }) {
  const { add } = useCart()

  // Normalise les formats (print-only) :
  // - on écarte les variantes numériques si un champ `type` est présent et ≠ 'print'
  // - on ne garde que les formats valides (label non vide, prix > 0 en CENTIMES)
  const rawFormats: any[] = Array.isArray(artwork.formats) ? (artwork.formats as any[]) : []
  const formats: Format[] = rawFormats
    .filter((v: any) => {
      const t = String(v?.type ?? '').toLowerCase()
      return !t || t === 'print'
    })
    .map((v: any): Format => ({
      id: String(v?.id ?? ''),
      label: String(v?.label ?? ''),
      price: Number(v?.price ?? 0) || 0,
    }))
    .filter((f) => Number.isFinite(f.price) && f.price > 0 && f.label.trim().length > 0)

  // Sélection initiale : 1er format s’il existe, sinon null
  const [formatId, setFormatId] = useState<string | null>(formats[0]?.id ?? null)

  // Réinit quand l’œuvre change
  useEffect(() => {
    setFormatId(formats[0]?.id ?? null)
  }, [artwork.id, formats])

  // Format sélectionné (ou null)
  const selected = useMemo(
    () => (formats.length ? formats.find((f) => f.id === formatId) ?? null : null),
    [formatId, formats]
  )

  // Prix en CENTIMES: priorise le format sélectionné, sinon fallback de l'œuvre
  const unitPriceCents: number =
    (selected?.price as number | undefined) ??
    (artwork.price as number | undefined) ??
    (artwork.basePrice as number | undefined) ??
    (artwork.priceMin as number | undefined) ??
    0

  // Affichage formaté (la fonction `euro` attend des centimes)
  const displayPrice = euro(unitPriceCents)
  const canBuy = unitPriceCents > 0

  // Feedback visuel sur le bouton « Ajouter au panier »
  const [bump, setBump] = useState(false)
  function handleAdd() {
    const item: CartItem = {
      key: `${artwork.id}-${selected?.id ?? 'default'}`,
      qty: 1,
      artwork: {
        id: artwork.id,
        title: artwork.title,
        image: (artwork.image ?? artwork.mockup ?? null) as string | null,
      },
      format: selected
        ? { id: selected.id, label: (selected as any).label, price: selected.price }
        : undefined,
      unitPriceCents,
    }
    // Ajoute l'item normalisé au panier
    add(item)
    setBump(true)
    setTimeout(() => setBump(false), 180)
  }

  return (
    <div className="mt-6">
      {/* Formats */}
      {formats.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-sm font-medium">Format</div>
          <div className="flex flex-wrap gap-2">
            {formats.map((f) => {
              const active = f.id === formatId
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormatId(f.id)}
                  className={[
                    'rounded-full border px-3 py-1 text-xs transition',
                    active
                      ? 'bg-accent text-ink border-accent'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-accent-light hover:border-accent hover:text-accent',
                  ].join(' ')}
                  aria-pressed={active}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Prix */}
      <div className="text-lg tabular-nums">{displayPrice}</div>

      {/* CTA */}
      <div className="mt-4">
        <button
          id="add-to-cart"
          type="button"
          disabled={!canBuy}
          onClick={handleAdd}
          className={[
            canBuy
              ? 'rounded-lg bg-accent text-ink font-medium px-4 py-2 text-sm transition'
              : 'rounded-lg bg-neutral-200 text-neutral-500 cursor-not-allowed font-medium px-4 py-2 text-sm',
            'hover:bg-accent-dark',
            'transform transition-transform duration-150',
            bump ? 'scale-95 ring-2 ring-accent/40' : 'scale-100',
          ].join(' ')}
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  )
}