'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from '@/components/SmartImage'
import NextImage from 'next/image'
import Link from 'next/link'
import type { Artwork, Artist, CartItem } from '@/lib/types'
import { useCart } from '@/components/CartContext'
import { FadeIn, Stagger } from '@/components/Motion'
import { motion, useScroll, useSpring } from 'framer-motion'

import { euro } from '@/lib/format';

// Prix utilitaire — retourne un prix en centimes, robuste (format sélectionné > min des formats > priceMin > price)
function unitPriceFrom(art: Artwork, selected?: { price: number } | null): number {
  if (selected && typeof selected.price === 'number') return selected.price
  if (Array.isArray(art.formats) && art.formats.length > 0) {
    const prices = art.formats.map(f => Number(f.price)).filter(n => Number.isFinite(n))
    if (prices.length) return Math.min(...prices)
  }
  if (typeof (art as any).priceMin === 'number') return (art as any).priceMin
  if (typeof art.price === 'number') return art.price
  return 0
}


// === Container local (on NE l'importe PAS) ===
function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>
}

function SectionTitle({ kicker, title, right }: { kicker?: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-8">
      {kicker && (
        <div className="mb-2 inline-flex items-center gap-2">
          <span className="h-[8px] w-[8px] rounded-full bg-accent" />
          <span className="font-serif text-sm tracking-wide text-accent">{kicker}</span>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl md:text-[28px] font-medium tracking-tight">{title}</h2>
          <div className="mt-2 h-[2px] w-10 sm:w-12 rounded-full bg-accent" />
        </div>
        {right}
      </div>
    </div>
  )
}

function Header({ onOpenCart }: { onOpenCart: () => void }) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line/70 bg-white/70 backdrop-blur">
      <Container className="py-3 flex items-center justify-between">
        <Link href="/" className="text-sm tracking-widest uppercase">Vague</Link>
        <nav className="hidden gap-6 md:flex text-sm text-neutral-600">
          <Link href="/artists" className="hover:underline underline-offset-4">Artistes</Link>
          <Link href="/artworks" className="hover:underline underline-offset-4">Œuvres</Link>
          <a href="#about" className="hover:underline underline-offset-4">À propos</a>
        </nav>
        <button
          onClick={onOpenCart}
          className="rounded-full border border-accent px-3 py-1 text-sm text-accent hover:bg-accent-light transition"
        >
          Panier
        </button>
      </Container>

      {/* Progress bar collée sous le header */}
      <div className="relative h-[3px] bg-accent/25">
        <motion.div
          className="absolute left-0 top-0 h-[3px] w-full bg-accent origin-left shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          style={{ scaleX }}
        />
      </div>
    </header>
  )
}

function Hero({ candidates = [] as string[] }: { candidates?: string[] }) {
  const [src, setSrc] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    async function pick() {
      try {
        const r = await fetch('/api/hero-images')
        const json = await r.json()
        const arr = Array.isArray(json?.files) ? json.files.filter(Boolean) : []
        // Filtre les mockups renvoyés par l'API (exclut chemins contenant "mockup")
        const noMockups = arr.filter((s: string) => typeof s === 'string' && !/mockup/i.test(s))
        const pool = noMockups.length ? noMockups : candidates
        if (!active || pool.length === 0) return
        const i = Math.floor(Math.random() * pool.length)
        setReady(false)
        setSrc(String(pool[i]))
      } catch {
        const pool = candidates
        if (!active || pool.length === 0) return
        const i = Math.floor(Math.random() * pool.length)
        setReady(false)
        setSrc(String(pool[i]))
      }
    }
    pick()
    return () => { active = false }
  }, [candidates])

  return (
    <section className="border-b border-neutral-200/60">
      <Container className="py-12 md:py-24">
        <div className="grid items-end gap-10 md:grid-cols-2">
          <FadeIn>
            <div>
              <h1 className="text-4xl md:text-5xl font-medium tracking-tight leading-tight">
                Éditions d&apos;art contemporaines
                <span className="block text-neutral-500">en séries limitées</span>
              </h1>
              <p className="mt-6 max-w-prose text-neutral-600">
                Une sélection pointue d&apos;illustrations originales et de tirages numérotés, réalisés par des artistes émergents et confirmés.
              </p>

              {/* Boutons identiques (accent) */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#gallery"
                  className="rounded-full bg-accent hover:bg-accent-dark text-ink font-medium px-4 py-2 text-sm shadow-sm transition"
                >
                  Découvrir
                </Link>
                <Link
                  href="/artists"
                  className="rounded-full bg-accent hover:bg-accent-dark text-ink font-medium px-4 py-2 text-sm shadow-sm transition"
                >
                  Nos artistes
                </Link>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            {/* Conteneur invisible mais stable (ratio + min-height) */}
            <div
              className="relative aspect-[4/3] min-h-[260px] sm:min-h-[320px] md:min-h-[420px] lg:min-h-[520px] overflow-hidden flex items-center justify-center"
              aria-busy={!ready}
            >
              {/* Image : fade-in une fois chargée */}
              {src && (
                <NextImage
                  src={src}
                  alt="Hero artwork"
                  fill
                  unoptimized
                  priority
                  sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
                  className={`object-contain transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setTimeout(() => setReady(true), 150)}
                  onError={() => {
                    // tente une autre image candidate si possible
                    const pool = candidates || []
                    if (pool.length > 0) {
                      const alt = pool.find(u => u !== src)
                      if (alt) { setSrc(alt); return }
                    }
                    setReady(true)
                  }}
                />
              )}

              {/* Loader subtil (skeleton pulse) tant que l'image n'est pas prête */}
              {!ready && (
                <div className="absolute inset-0">
                  <div className="h-full w-full bg-mist animate-pulse" aria-hidden="true" />
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  )
}
function Artists({ artists }: { artists: Artist[] }) {
  return (
    <section id="artists" className="border-b border-neutral-200/60">
      <Container className="py-14 md:py-20">
        <SectionTitle kicker="sélection" title="Artistes publiés" />
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          <Stagger>
            {artists.map(a => (
              <Link key={a.id} href={`/artists/${a.slug}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl border relative transition-all duration-300 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
                  {a.cover ? (
                    <Image
                      src={a.cover}
                      alt={a.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-accent flex items-center justify-center text-white/90 font-medium">
                      <span className="px-3 text-sm text-center line-clamp-2">{a.name}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {a.avatar ? (
                    <Image src={a.avatar} alt={a.name} width={32} height={32} className="rounded-full object-cover" sizes="32px" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">
                      {a.name?.charAt(0) ?? '?'}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium group-hover:text-accent transition">{a.name}</div>
                    <div className="text-xs text-neutral-500">{a.handle}</div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{a.bio}</p>
              </Link>
            ))}
          </Stagger>
        </div>
      </Container>
    </section>
  )
}

function ArtworkCard({ art, onAdd, artistsById }: { art: Artwork; onAdd: (a: Artwork, f: any) => void; artistsById: Record<string, string> }) {
  const [formatId, setFormatId] = useState((art.formats ?? (art as any).variants ?? [])[0]?.id ?? null)
  const selected = useMemo(() => {
    const list = (art.formats ?? (art as any).variants ?? []) as any[]
    return list.find((f) => f.id === formatId) ?? null
  }, [formatId, art.formats, (art as any).variants])

  // Fallback si un artwork n'a pas de slug
  const slug = art.slug ?? art.id

  return (
    <div className="group flex h-full flex-col">
      {/* Visuel cliquable */}
      <Link
        href={`/artworks/${slug}`}
        scroll
        className="relative block aspect-square overflow-hidden rounded-2xl border transition-all duration-300 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-accent-300"
        aria-label={`Voir l’œuvre ${art.title}`}
      >
        {art.image ? (
          <Image
            src={art.image}
            alt={art.title}
            fill
            className="object-contain bg-white transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-accent text-ink">
            <span className="px-3 text-sm font-medium text-center">{art.title}</span>
          </div>
        )}
      </Link>

      {/* Titre / Prix */}
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/artworks/${slug}`}
            scroll
            className="text-sm font-medium transition group-hover:text-accent-700 hover:underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-accent-300 rounded"
          >
            {art.title}
          </Link>
          <div className="text-xs text-neutral-500">{artistsById[art.artistId] ?? 'Artiste'}</div>
        </div>
        <div className="ml-auto text-sm tabular-nums">
          {art.priceMinFormatted ?? euro(art.priceMin ?? 0)}
        </div>
      </div>

      {/* Formats — interactions locales */}
      {(() => { const list = (art.formats ?? (art as any).variants ?? []) as any[]; return list.length > 0 })() && (
        <div className="mt-2 min-h-[72px] grid grid-cols-2 gap-2 xs:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
          {((art.formats ?? (art as any).variants ?? []) as any[]).map((f) => {
            const isSel = f.id === formatId
            return (
              <button
                key={f.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFormatId(f.id)
                }}
                className={[
                  'inline-flex h-8 w-full items-center justify-center rounded-full px-3',
                  'text-[12px] font-medium whitespace-nowrap',
                  'border transition-colors',
                  isSel
                    ? 'bg-accent-300 text-ink border-accent-300'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-accent-100 hover:border-accent-300 hover:text-accent-700',
                ].join(' ')}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      )}

      {/* CTA en bas */}
      <div className="mt-auto pt-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAdd(art, selected)
          }}
          className="w-full rounded-lg bg-accent-300 hover:bg-accent-400 text-ink font-medium px-3 py-2 text-sm transition"
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  )
}

function Gallery({ artworks, artistsById }: { artworks: Artwork[]; artistsById: Record<string, string> }) {
  const { add } = useCart()
  const handleAdd = React.useCallback((art: Artwork, selected: any) => {
    const unit =
      (selected?.price as number | undefined) ??
      ((art as any).basePrice as number | undefined) ??
      ((art as any).priceMin as number | undefined) ??
      0;

    const item: CartItem = {
      key: `${art.id}-${selected?.id ?? 'std'}`,
      qty: 1,
      artwork: {
        id: art.id,
        title: art.title,
        image: (art as any).image ?? (art as any).mockup ?? null,
      },
      format: selected
        ? { id: selected.id, label: selected.label, price: selected.price }
        : undefined,
      unitPriceCents: unit,
    };

    add(item as any);
  }, [add]);
  return (
    <section id="gallery" className="border-b border-neutral-200/60">
      <Container className="py-10 sm:py-14 md:py-20">
        <SectionTitle kicker="catalogue" title="Galerie" />
        <div className="grid items-stretch gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Stagger>
            {artworks.map(a => (
              <ArtworkCard key={a.id} art={a} onAdd={handleAdd} artistsById={artistsById} />
            ))}
          </Stagger>
        </div>
      </Container>
    </section>
  )
}

function CartDrawer({ artistsById }: { artistsById: Record<string, string> }) {
  const { items, total, updateQty, remove, clear, open, closeCart } = useCart()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) closeCart()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, closeCart])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex md:justify-end bg-black/20 backdrop-blur-sm">
      <aside ref={ref} className="h-full w-full md:max-w-md md:border-l bg-white px-4 sm:px-6 py-5">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-medium">Panier</h3>
          <button onClick={closeCart} className="rounded-full border border-accent px-3 py-1 text-sm text-accent hover:bg-accent-light transition">
            Fermer
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-neutral-600">Votre panier est vide.</p>
        ) : (
          <div className="flex h-full flex-col">
            <ul className="flex-1 space-y-4 overflow-auto pr-2">
              {items.map((i: any) => {
                const qty = i?.qty ?? 1;
                // Prix unitaire robuste : priorité au nouveau champ, sinon anciens champs
                const unit = (i?.unitPriceCents ?? i?.format?.price ?? i?.artwork?.price ?? i?.price ?? 0) as number;

                // Données visuelles robustes (gère anciens / nouveaux formats)
                const title = i?.artwork?.title ?? i?.title ?? 'Œuvre';
                const img =
                  i?.artwork?.image ??
                  i?.image ??
                  i?.artwork?.mockup ??
                  i?.mockup ??
                  null;

                return (
                  <li key={i?.key ?? `${title}-${Math.random()}`} className="flex gap-3">
                    <div className="h-16 w-16 rounded border overflow-hidden relative bg-neutral-100">
                      {img ? (
                        <Image src={img} alt={title} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{title}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {i?.format?.label ?? 'Format standard'}
                          </div>
                        </div>

                        <div className="ml-auto tabular-nums">
                          {euro(unit * qty)}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 space-y-3 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="tabular-nums">{euro(total)}</span>
              </div>
              <Link
                href="/cart"
                className="w-full inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
              >
                Voir le panier complet
              </Link>
              <button className="w-full rounded-lg bg-accent hover:bg-accent-dark text-ink font-medium px-3 py-2 text-sm transition">
                Procéder au paiement
              </button>
              <button onClick={clear} className="w-full rounded-lg border border-accent px-3 py-2 text-xs text-accent hover:bg-accent-light transition">
                Vider le panier
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

export default function Site({ openCartOnLoad = false, catalog }: { openCartOnLoad?: boolean; catalog?: { artists: Artist[]; artworks: Artwork[] } }) {
  const { openCart } = useCart()
  const [artistsState, setArtistsState] = React.useState<Artist[]>(catalog?.artists ?? [])
  const [artworksState, setArtworksState] = React.useState<Artwork[]>(catalog?.artworks ?? [])

  React.useEffect(() => {
    if (openCartOnLoad) openCart()
  }, [openCartOnLoad, openCart])

  React.useEffect(() => {
    if (catalog) return // si on a déjà reçu les données du serveur, pas de fetch client
    let active = true
    fetch('/api/catalog')
      .then(r => r.json())
      .then((data) => {
        if (!active) return
        setArtistsState(Array.isArray(data.artists) ? data.artists : [])
        setArtworksState(Array.isArray(data.artworks) ? data.artworks : [])
      })
      .catch(console.error)
    return () => { active = false }
  }, [catalog])

  const artistsById = React.useMemo(() => Object.fromEntries(artistsState.map(a => [a.id, a.name])), [artistsState])

  const heroCandidates = React.useMemo(() => {
    // N'utiliser que l'image d'œuvre (pas les mockups)
    return (artworksState || [])
      .map(a => (a as any).image)
      .filter((u): u is string => typeof u === 'string' && u.length > 0)
  }, [artworksState])

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased pb-12 sm:pb-0">
      <Hero candidates={heroCandidates} />
      <Artists artists={artistsState} />
      <Gallery artworks={artworksState} artistsById={artistsById} />
      <CartDrawer artistsById={artistsById} />
    </div>
  )
}