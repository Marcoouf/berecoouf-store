'use client'

import { useMemo, useState } from 'react'
import { useCart } from '@/components/CartContext'

type Format = { id: string; label: string; price: number }
type ArtworkLite = {
  id: string
  title: string
  image: string
  price: number
  artistId: string
  formats?: Format[]
}

export default function ArtworkPurchase({ artwork }: { artwork: ArtworkLite }) {
  const [formatId, setFormatId] = useState<string | null>(artwork.formats?.[0]?.id ?? null)
  const selected = useMemo(
    () => artwork.formats?.find(f => f.id === formatId) ?? null,
    [formatId, artwork.formats]
  )

  const { add } = useCart()

  const price = (selected?.price ?? artwork.price).toFixed(0)

  return (
    <div className="mt-6">
      {!!artwork.formats?.length && (
        <>
          <div className="text-sm font-medium">Format</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {artwork.formats.map(f => {
              const active = f.id === formatId
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormatId(f.id)}
                  className={[
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    active
                      ? 'bg-accent text-ink border-accent'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-accent-light hover:border-accent hover:text-accent',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Prix dynamique */}
      <div className="mt-4 text-lg tabular-nums">{price} €</div>

      {/* CTA */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => add(artwork as any, selected as any)}
          className="rounded-lg bg-accent hover:bg-accent-dark text-ink font-medium px-4 py-2 text-sm transition"
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  )
}