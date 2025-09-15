'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from '@/components/SmartImage'
import NextImage from 'next/image'
import Link from 'next/link'
import type { Artwork, Artist } from '@/lib/types'
import { useCart } from '@/components/CartContext'
import { FadeIn, Stagger } from '@/components/Motion'
import { motion, useScroll, useSpring } from 'framer-motion'
import { euro } from '@/lib/format';

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
        <Link href="/" className="text-sm tracking-widest uppercase">Point Bleu</Link>
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
        const pool = arr.length ? arr : candidates
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
                  <Image src={a.cover} alt={a.name} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Image src={a.avatar} alt="" width={32} height={32} className="rounded-full object-cover" sizes="32px" />
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
  const [formatId, setFormatId] = useState(art.formats?.[0]?.id ?? null)
  const selected = useMemo(
    () => art.formats?.find((f) => f.id === formatId) ?? null,
    [formatId, art.formats]
  )

  // Fallback si un artwork n'a pas de slug
  const slug = art.slug ?? art.id

  return (
    <div className="group flex h-full flex-col">
      {/* Visuel cliquable */}
      <Link
        href={`/artworks/${slug}`}
        scroll
        className="relative block aspect-[4/5] overflow-hidden rounded-2xl border transition-all duration-300 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-accent-300"
        aria-label={`Voir l’œuvre ${art.title}`}
      >
        <Image
          src={art.image}
          alt={art.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          priority={false}
        />
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
<div className="text-sm tabular-nums">
  {euro(selected?.price ?? art.price)}
</div>      </div>

      {/* Formats — interactions locales */}
      {!!art.formats?.length && (
        <div className="mt-2 min-h-[72px] grid grid-cols-2 gap-2 xs:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
          {art.formats.map((f) => {
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
  return (
    <section id="gallery" className="border-b border-neutral-200/60">
      <Container className="py-10 sm:py-14 md:py-20">
        <SectionTitle kicker="catalogue" title="Galerie" />
        <div className="grid items-stretch gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Stagger>
            {artworks.map(a => (
              <ArtworkCard key={a.id} art={a} onAdd={add} artistsById={artistsById} />
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
              {items.map(i => (
                <li key={i.key} className="flex gap-3">
                  <div className="h-16 w-16 rounded border overflow-hidden relative">
                    <Image src={i.artwork.image} alt="" fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="truncate text-sm font-medium">{i.artwork.title}</div>
                      <button onClick={() => remove(i.key)} className="text-xs text-neutral-500 hover:text-accent">Retirer</button>
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      {artistsById[i.artwork.artistId] ?? 'Artiste'}{i.format ? ` — ${i.format.label}` : ''}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={i.qty}
                        onChange={(e) => updateQty(i.key, Math.max(1, Number(e.target.value)))}
                        className="w-16 rounded border px-2 py-1 text-sm"
                      />
                      <div className="ml-auto text-sm tabular-nums">
                        {euro((i.format?.price ?? i.artwork.price) * i.qty)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
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

function Footer() {
  return (
    <footer id="about" className="bg-neutral-50/60">
      <Container className="py-8 sm:py-10 md:py-16 text-sm text-neutral-600">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="text-sm tracking-widest uppercase text-neutral-800">Point Bleu</div>
            <p className="mt-3 max-w-sm">Éditions d&apos;art et galerie en ligne. Tirages numérotés, impression fine art.</p>
          </div>
          <div>
            <div className="font-medium text-neutral-800">Aide</div>
            <ul className="mt-3 space-y-2">
              <li><a href="#" className="hover:text-accent">FAQ</a></li>
              <li><a href="#" className="hover:text-accent">Livraison & retours</a></li>
              <li><a href="#" className="hover:text-accent">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-neutral-800">Légal</div>
            <ul className="mt-3 space-y-2">
              <li><a href="#" className="hover:text-accent">Mentions légales</a></li>
              <li><a href="#" className="hover:text-accent">CGV</a></li>
              <li><a href="#" className="hover:text-accent">Confidentialité</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 text-xs text-neutral-500">© {new Date().getFullYear()} Point Bleu. Tous droits réservés.</div>
      </Container>
    </footer>
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
    return (artworksState || []).map(a => (a.mockup || a.image)).filter(Boolean) as string[]
  }, [artworksState])

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased pb-12 sm:pb-0">
      <Hero candidates={heroCandidates} />
      <Artists artists={artistsState} />
      <Gallery artworks={artworksState} artistsById={artistsById} />
      <Footer />
      <CartDrawer artistsById={artistsById} />
    </div>
  )
}