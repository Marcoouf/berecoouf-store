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
  formats?: Format[] // <-- optionnel
}

export default function ArtworkPurchase({ artwork }: { artwork: ArtworkLite }) {
  const { add } = useCart()

  // Normalise les formats
  const formats: Format[] = Array.isArray(artwork.formats) ? artwork.formats : []

  // Sélection initiale : 1er format s’il existe, sinon null
  const [formatId, setFormatId] = useState<string | null>(formats[0]?.id ?? null)

  // Si on change d’œuvre (nouvelle page), réinitialiser la sélection
  useEffect(() => {
    setFormatId((Array.isArray(artwork.formats) && artwork.formats[0]?.id) || null)
  }, [artwork.id]) // change seulement quand on change d’œuvre

  // Format sélectionné (ou null)
  const selected = useMemo(
    () => (formats.length ? formats.find(f => f.id === formatId) ?? null : null),
    [formatId, formats]
  )

  // Prix à afficher : prix du format sélectionné OU prix de base de l’œuvre
  const unitPrice = Number.isFinite(Number(selected?.price))
    ? Number(selected!.price)
    : Number(artwork.price) || 0

  // Affichage formaté (NE PAS ré-ajouter "€" ailleurs)
  const displayPrice = euro(unitPrice)

  return (
    <div className="mt-6">
      {/* Formats */}
      {formats.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Format</div>
          <div className="flex flex-wrap gap-2">
            {formats.map(f => {
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
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50',
                  ].join(' ')}
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
          type="button"
          onClick={() => add(artwork as any, selected)}
          className="rounded-lg bg-accent hover:bg-accent-dark text-ink font-medium px-4 py-2 text-sm transition"
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  )
}