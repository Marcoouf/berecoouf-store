'use client'

import Link from 'next/link'
import Image from '@/components/SmartImage'
import { useRef } from 'react'
import { euro } from '@/lib/format';


type Item = {
  id: string
  slug: string
  title: string
  image: string
  price: number
  artistName?: string
}

export default function RelatedCarousel({ items }: { items: Item[] }) {
  const ref = useRef<HTMLDivElement>(null)

  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = ref.current
    if (!el) return
    const amount = Math.round(el.clientWidth * 0.9)
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (!items?.length) return null

  return (
    <div className="relative">
      {/* Boutons */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between px-2">
        <button
          onClick={() => scrollByAmount('left')}
          className="pointer-events-auto hidden md:inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 ring-1 ring-line hover:bg-white"
          aria-label="Faire défiler vers la gauche"
        >
          ‹
        </button>
        <button
          onClick={() => scrollByAmount('right')}
          className="pointer-events-auto hidden md:inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 ring-1 ring-line hover:bg-white"
          aria-label="Faire défiler vers la droite"
        >
          ›
        </button>
      </div>

      {/* Piste scrollable */}
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {/* Hide default scrollbar Chrome/Safari */}
        <style jsx>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        {items.map((w) => (
          <div key={w.id} className="snap-start shrink-0 w-[72%] sm:w-[48%] md:w-[32%]">
            <div className="group">
              <div className="relative overflow-hidden rounded-xl border aspect-[4/5]">
                <Link href={`/artworks/${w.slug}`} className="absolute inset-0" aria-label={`Voir ${w.title}`}>
                  <Image
                    src={w.image}
                    alt={w.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </Link>
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">
                    <Link href={`/artworks/${w.slug}`} className="hover:underline">
                      {w.title}
                    </Link>
                  </div>
                  {w.artistName && <div className="text-xs text-neutral-500">{w.artistName}</div>}
                </div>
                <div className="text-sm tabular-nums">{euro(w.price)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}