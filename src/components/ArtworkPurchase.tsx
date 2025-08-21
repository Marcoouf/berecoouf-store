'use client'

import { useEffect, useMemo, useState } from 'react'
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
  const hasFormats = Array.isArray(artwork.formats) && artwork.formats.length > 0
  const [formatId, setFormatId] = useState<string | null>(hasFormats ? artwork.formats![0].id : null)

  // Sélection courante
  const selected = useMemo(
    () => (hasFormats ? artwork.formats!.find(f => f.id === formatId) ?? null : null),
    [formatId, artwork.formats, hasFormats]
  )

  // Sécurité: si la liste des formats change et que le format sélectionné n'existe plus
  useEffect(() => {
    if (!hasFormats) return
    const exists = artwork.formats!.some(f => f.id === formatId)
    if (!exists) setFormatId(artwork.formats![0].id)
  }, [hasFormats, artwork.formats, formatId])

  const { add } = useCart()
  const price = (selected?.price ?? artwork.price).toFixed(0)

  return (
    <div className="mt-6">
      {hasFormats && (
        <div>
          <div className="text-sm font-medium">Format</div>
          {/* Grille responsive: 2 colonnes sur mobile, wrap en ligne dès sm */}
          <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {artwork.formats!.map(f => {
              const active = f.id === formatId
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormatId(f.id)}
                  aria-pressed={active}
                  className={[
                    'inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-medium',
                    'border transition-colors whitespace-nowrap',
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
        </div>
      )}

      {/* Prix dynamique (annonce polie aux lecteurs d'écran) */}
      <div className="mt-4 text-lg tabular-nums" aria-live="polite">
        {price}\u00A0€
      </div>

      {/* CTA */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => add(artwork as any, selected as any)}
          className="w-full sm:w-auto rounded-lg bg-accent hover:bg-accent-dark text-ink font-medium px-4 py-2 text-sm transition"
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  )
}