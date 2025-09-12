'use client'

import { useEffect, useMemo, useState } from 'react'
import { euro } from '@/lib/format'
import { useCart } from '@/components/CartContext'

type Format = { id: string; label: string; price: number }
type ArtworkLite = {
  id: string
  title: string
  image: string
  artistId: string
  price: number
  formats?: Format[]
}

export default function ArtworkPurchase({ artwork }: { artwork: ArtworkLite }) {
  const { add } = useCart()

  // Normalise les formats (toujours un tableau)
  const formats: Format[] = Array.isArray(artwork.formats) ? artwork.formats : []

  // Sélection initiale : 1er format s’il existe, sinon null
  const [formatId, setFormatId] = useState<string | null>(formats[0]?.id ?? null)

  // Réinit quand l’œuvre change
  useEffect(() => {
    setFormatId((Array.isArray(artwork.formats) && artwork.formats[0]?.id) || null)
  }, [artwork.id])

  // Format sélectionné (ou null)
  const selected = useMemo(
    () => (formats.length ? formats.find((f) => f.id === formatId) ?? null : null),
    [formatId, formats]
  )

  // Prix affiché : prix du format sélectionné OU prix de base de l’œuvre
  const unitPrice = Number.isFinite(Number(selected?.price))
    ? Number(selected!.price)
    : Number(artwork.price) || 0

  // Affichage formaté (place correctement le symbole selon ta fonction euro())
  const displayPrice = euro(unitPrice)

  // Feedback visuel sur le bouton « Ajouter au panier »
  const [bump, setBump] = useState(false)
  function handleAdd() {
    add(artwork as any, selected || null)
    setBump(true)
    // petit bump rapide
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
          onClick={handleAdd}
          className={[
            'rounded-lg bg-accent text-ink font-medium px-4 py-2 text-sm transition',
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