'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  title: string
  image: string            // visuel plein
  mockup?: string | null   // mockup encadré
  priority?: boolean
}

export default function ArtworkImageCarousel({ title, image, mockup, priority }: Props) {
  const slides = useMemo(
    () => [mockup, image].filter(Boolean) as string[],
    [mockup, image]
  )
  const [idx, setIdx] = useState(0)
  const wrap = (n: number) => (n + slides.length) % slides.length

  // clavier (← →)
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.matches(':focus-within')) return
      if (e.key === 'ArrowRight') setIdx((i) => wrap(i + 1))
      if (e.key === 'ArrowLeft') setIdx((i) => wrap(i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  // swipe (basique)
  const dragStart = useRef<number | null>(null)
  const onPointerDown = (e: React.PointerEvent) => { dragStart.current = e.clientX }
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current == null) return
    const dx = e.clientX - dragStart.current
    dragStart.current = null
    if (Math.abs(dx) < 40) return
    setIdx((i) => wrap(i + (dx < 0 ? 1 : -1)))
  }

  if (slides.length === 0) return null

  return (
    <div
      ref={rootRef}
      className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl border bg-white"
      aria-roledescription="carousel"
      aria-label={`Images pour « ${title} »`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={slides[idx]}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0"
        >
          <Image
            src={slides[idx]}
            alt={title}
            fill
            sizes="(min-width:1024px) 40vw, (min-width:768px) 50vw, 100vw"
            className="object-cover"
            priority={priority}
          />
        </motion.div>
      </AnimatePresence>

      {/* Flèches */}
      {slides.length > 1 && (
        <div className="group">
          <button
            type="button"
            aria-label="Image précédente"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx((i) => wrap(i - 1)) }}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-2 py-1 text-sm border shadow-sm hover:bg-white opacity-0 group-hover:opacity-100 pointer-events-auto transition-opacity"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Image suivante"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx((i) => wrap(i + 1)) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-2 py-1 text-sm border shadow-sm hover:bg-white opacity-0 group-hover:opacity-100 pointer-events-auto transition-opacity"
          >
            →
          </button>

          {/* Points */}
          <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i === idx ? 'bg-accent' : 'bg-neutral-300'}`}
                aria-hidden
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}