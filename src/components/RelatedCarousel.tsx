'use client'

import Link from 'next/link'
import Image from '@/components/SmartImage'
import { useRef } from 'react'
import { euro } from '@/lib/format'

type Item = {
  id: string
  slug: string
  title: string
  image: string
  price: number
  artistId?: string
  artistName?: string
}

type Props = {
  items: Item[]
  /** Titre affiché au-dessus du carrousel (optionnel) */
  title?: string
  /** Dictionnaire pour résoudre les noms d’artistes si non fourni dans chaque item */
  artistsById?: Record<string, string>
}

export default function RelatedCarousel({ items, title = 'Plus d’œuvres', artistsById }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const showArrows = (items?.length ?? 0) > 3

  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = ref.current
    if (!el) return
    const amount = Math.round(el.clientWidth * 0.9)
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (!items?.length) return null

  return (
    <section className="border-t border-neutral-200/60">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 md:py-14">
        {/* Titre optionnel */}
        {title ? (
          <h2 className="text-xl md:text-[22px] font-medium tracking-tight">{title}</h2>
        ) : null}

        <div className="group relative mt-6">
          {/* Boutons (n'apparaissent qu'au survol) */}
          {showArrows && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between px-1 sm:px-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                onClick={() => scrollByAmount('left')}
                className="pointer-events-auto hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-white/90 ring-1 ring-line hover:bg-white"
                aria-label="Faire défiler vers la gauche"
              >
                <span aria-hidden>‹</span>
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount('right')}
                className="pointer-events-auto hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-white/90 ring-1 ring-line hover:bg-white"
                aria-label="Faire défiler vers la droite"
              >
                <span aria-hidden>›</span>
              </button>
            </div>
          )}

          {/* Piste scrollable */}
          <div
            ref={ref}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-1 sm:px-2 -mx-1 sm:-mx-2 [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {/* Hide default scrollbar Chrome/Safari */}
            <style jsx>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>

            {items.map((w) => {
              const artist =
                w.artistName || (w.artistId ? artistsById?.[w.artistId] : undefined) || 'Artiste'
              const href = `/artworks/${w.slug}`

              return (
                <div key={w.id} className="snap-start shrink-0 w-[80%] sm:w-[45%] md:w-[30%]">
                  <div className="group/card transition-transform duration-300 hover:scale-[1.03]">
                    <div className="relative overflow-hidden rounded-2xl border aspect-[4/5] transition-all duration-300 group-hover/card:shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
                      <Link href={href} scroll className="absolute inset-0" aria-label={`Voir ${w.title}`}>
                        <Image
                          src={w.image}
                          alt={w.title}
                          fill
                          sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 80vw"
                          className="object-cover transition-transform duration-500 group-hover/card:scale-[1.02]"
                          loading="lazy"
                        />
                      </Link>
                    </div>

                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={href}
                          scroll
                          className="text-sm font-medium transition hover:text-accent-700"
                        >
                          {w.title}
                        </Link>
                        <div className="text-xs text-neutral-500 truncate">{artist}</div>
                      </div>
                      <div className="text-sm tabular-nums shrink-0">{euro(w.price)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}