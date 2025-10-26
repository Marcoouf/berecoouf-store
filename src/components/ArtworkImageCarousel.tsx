'use client'

import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import SmartImage from '@/components/SmartImage'

type Props = {
  title: string
  image: string            // visuel plein
  mockup?: string | null   // mockup encadré (optionnel)
  images?: { url?: string | null }[] // option moderne: liste normalisée
  priority?: boolean
  /** Taille max du carré (en px). Par défaut 720. */
  maxSize?: number
  className?: string
}

/**
 * Carrousel carré avec passe‑partout blanc
 * – Toujours un carré (aspect-square), image en object-contain (jamais rognée)
 * – Cadre blanc arrondi + bordure
 * – Flèches au survol/focus uniquement
 * – Puces sous le cadre
 * – Nav clavier (← →) + swipe simple
 * – Peut consommer une prop normalisée : `images: {url}[]` (fallback sur les props legacy)
 */
export default function ArtworkImageCarousel({
  title,
  image,
  mockup = null,
  images = [],
  priority,
  maxSize = 720,
  className,
}: Props) {
  const slides = useMemo(() => {
    const toStringArray = (
      input?: Array<{ url?: string | null }> | Array<string | null> | null,
    ) =>
      (input || [])
        .map((it) => (typeof it === 'string' ? it : it?.url))
        .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)

    const normalized = toStringArray(images)
    const legacy = [mockup, image].filter(
      (src): src is string => typeof src === 'string' && src.trim().length > 0,
    )
    const base = normalized.length > 0 ? normalized : legacy

    const unique: string[] = []
    const seen = new Set<string>()
    base.forEach((src) => {
      if (seen.has(src)) return
      seen.add(src)
      unique.push(src)
    })

    const prioritized: string[] = []
    ;[mockup, image]
      .filter((src): src is string => typeof src === 'string' && seen.has(src))
      .forEach((src) => {
        if (!prioritized.includes(src)) prioritized.push(src)
      })
    unique.forEach((src) => {
      if (!prioritized.includes(src)) prioritized.push(src)
    })

    return prioritized
  }, [images, mockup, image])
  const [idx, setIdx] = useState(0)
  const wrap = useCallback((n: number) => (n + slides.length) % slides.length, [slides.length])
  const eagerAll = priority && slides.length <= 4

  // Nav clavier
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!rootRef.current?.matches(':focus-within')) return
      if (e.key === 'ArrowRight') setIdx(i => wrap(i + 1))
      if (e.key === 'ArrowLeft')  setIdx(i => wrap(i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [wrap])

  // Swipe simple
  const startX = useRef<number | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX
  }
  const resetSwipe = () => {
    startX.current = null
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current == null) return
    const dx = e.clientX - startX.current
    resetSwipe()
    if (Math.abs(dx) < 40) return
    setIdx((i) => wrap(i + (dx < 0 ? 1 : -1)))
  }

  if (slides.length === 0) return null

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label={`Images pour « ${title} »`}
      className={className}
    >
      {/* Wrapper responsive centré : largeur limitée, carré garanti */}
      <div
        className="group relative mx-auto w-full max-w-[min(92vw,theme(maxWidth.7xl))] aspect-square"
        style={{
          // max-w dynamique basé sur la prop (ex: 720) — on passe en CSS var pour conserver Tailwind
          // @ts-ignore
          '--max': `${maxSize}px`,
        } as React.CSSProperties}
      >
        {/* Cadre blanc arrondi */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl border bg-white"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={resetSwipe}
        >
          <div
            className="flex h-full w-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {slides.map((src, i) => {
              const isPriority = eagerAll || (priority && i === 0)
              return (
                <div key={`${src}-${i}`} className="relative h-full w-full flex-shrink-0">
                  <SmartImage
                    src={src}
                    alt={title}
                    fill
                    priority={isPriority}
                    loading={isPriority ? 'eager' : undefined}
                    sizes="(min-width:1024px) 40vw, (min-width:768px) 50vw, 100vw"
                    className="h-full w-full object-contain"
                    wrapperClassName="absolute inset-0"
                  />
                </div>
              )
            })}
          </div>
          {/* Flèches (hover/focus) */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Image précédente"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx(i => wrap(i - 1)) }}
                className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/85 px-2.5 py-1.5 text-sm shadow-sm backdrop-blur transition-opacity opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Image suivante"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx(i => wrap(i + 1)) }}
                className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/85 px-2.5 py-1.5 text-sm shadow-sm backdrop-blur transition-opacity opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              >
                →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Puces sous le cadre */}
      {slides.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Aller à l’image ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${i === idx ? 'bg-accent' : 'bg-neutral-300 hover:bg-neutral-400'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
