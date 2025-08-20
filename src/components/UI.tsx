'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from '@/components/SmartImage'
import Link from 'next/link'
import { artworks, artists } from '@/lib/data'
import type { Artwork } from '@/lib/types'
import { useCart } from '@/components/CartContext'
import { FadeIn, Stagger } from '@/components/Motion'
import { motion, useScroll, useSpring } from 'framer-motion'


// === Container local (on NE l'importe PAS) ===
function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>
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
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-[28px] font-medium tracking-tight">{title}</h2>
          <div className="mt-2 h-[2px] w-12 rounded-full bg-accent" />
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

function Hero() {
  const [src, setSrc] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    // Récupère la liste des images et en choisit une au hasard
    fetch('/api/hero-images')
      .then(r => r.json())
      .then(({ files }) => {
        if (!active || !Array.isArray(files) || files.length === 0) return
        const i = Math.floor(Math.random() * files.length)
        // reset du loader quand on change d'image
        setReady(false)
        setSrc(files[i])
      })
      .catch(() => {})

    return () => { active = false }
  }, [])

  return (
    <section className="border-b border-neutral-200/60">
      <Container className="py-16 md:py-24">
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
              <div className="mt-8 flex gap-3">
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
              className="relative aspect-[4/3] min-h-[320px] md:min-h-[420px] lg:min-h-[520px] overflow-hidden flex items-center justify-center"
              aria-busy={!ready}
            >
              {/* Image : fade-in une fois chargée */}
              {src && (
                <Image
                  src={src}
                  alt="Hero artwork"
                  fill
                  className={`object-contain transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
                  sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
                  priority
                  onLoadingComplete={() => {
                    // Petite latence pour voir le skeleton même si l'image est en cache
                    setTimeout(() => setReady(true), 150)
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
function Artists() {
  return (
    <section id="artists" className="border-b border-neutral-200/60">
      <Container className="py-14 md:py-20">
        <SectionTitle kicker="sélection" title="Artistes publiés" />
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          <Stagger>
            {artists.map(a => (
              <Link key={a.id} href={`/artists/${a.slug}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl border relative transition-all duration-300 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
                  <Image src={a.cover} alt={a.name} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Image src={a.avatar} alt="" width={32} height={32} className="rounded-full object-cover" />
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

function ArtworkCard({
  art,
  onAdd,
}: {
  art: Artwork
  onAdd: (a: Artwork, f: any) => void
}) {
  const [formatId, setFormatId] = useState(art.formats?.[0]?.id ?? null)
  const selected = useMemo(
    () => art.formats?.find(f => f.id === formatId) ?? null,
    [formatId, art.formats]
  )

  // Fallback si jamais un artwork n'a pas de slug
  const slug = art.slug ?? art.id

  return (
    <div className="group flex h-full flex-col">
      {/* Visuel cliquable */}
      <Link
        href={`/artworks/${slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-2xl border transition-all duration-300 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label={`Voir l’œuvre ${art.title}`}
      >
        <Image
          src={art.image}
          alt={art.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
        />
      </Link>

      {/* Titre / Prix (titre cliquable aussi) */}
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/artworks/${slug}`}
            className="text-sm font-medium transition group-hover:text-accent hover:underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-accent rounded"
          >
            {art.title}
          </Link>
          <div className="text-xs text-neutral-500">{artistName(art.artistId)}</div>
        </div>
        <div className="text-sm tabular-nums">
          €{(selected?.price ?? art.price).toFixed(0)}
        </div>
      </div>

      {/* Formats — interactions locales (pas de navigation) */}
      {!!art.formats?.length && (
        <div className="mt-2 min-h-[72px] grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
          {art.formats.map(f => {
            const isSel = f.id === formatId
            return (
              <button
                key={f.id}
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  setFormatId(f.id)
                }}
                className={[
                  'inline-flex h-8 w-full items-center justify-center rounded-full px-3',
                  'text-[12px] font-medium whitespace-nowrap',
                  'border transition-colors',
                  isSel
                    ? 'bg-accent text-ink border-accent'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-accent-light hover:border-accent hover:text-accent',
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
          onClick={e => {
            e.stopPropagation()
            onAdd(art, selected)
          }}
          className="w-full rounded-lg bg-accent hover:bg-accent-dark text-ink font-medium px-3 py-2 text-sm transition"
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  )
}

function Gallery() {
  const { add } = useCart()
  return (
    <section id="gallery" className="border-b border-neutral-200/60">
      <Container className="py-14 md:py-20">
        <SectionTitle kicker="catalogue" title="Galerie" />
        <div className="grid items-stretch gap-6 sm:grid-cols-2 md:grid-cols-3">
          <Stagger>
            {artworks.map(a => <ArtworkCard key={a.id} art={a} onAdd={add} />)}
          </Stagger>
        </div>
      </Container>
    </section>
  )
}

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, total, updateQty, remove, clear } = useCart()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
      <aside ref={ref} className="h-full w-full max-w-md border-l bg-white px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-medium">Panier</h3>
          <button onClick={onClose} className="rounded-full border border-accent px-3 py-1 text-sm text-accent hover:bg-accent-light transition">
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
                      {artistName(i.artwork.artistId)}{i.format ? ` — ${i.format.label}` : ''}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={i.qty}
                        onChange={(e) => updateQty(i.key, Math.max(1, Number(e.target.value)))}
                        className="w-16 rounded border px-2 py-1 text-sm"
                      />
                      <div className="ml-auto text-sm tabular-nums">€{((i.format?.price ?? i.artwork.price) * i.qty).toFixed(0)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-3 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="tabular-nums">€{total.toFixed(0)}</span>
              </div>
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
      <Container className="py-10 md:py-16 text-sm text-neutral-600">
        <div className="grid gap-8 md:grid-cols-4">
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

function artistName(id: string) {
  const a = artists.find(x => x.id === id)
  return a ? a.name : 'Artiste'
}


export default function Site({ openCartOnLoad = false }: { openCartOnLoad?: boolean }) {
  const [open, setOpen] = React.useState(false)

  // Quand la page se charge, si on a ?cart=1 -> on ouvre le panier
  React.useEffect(() => {
    if (openCartOnLoad) setOpen(true)
  }, [openCartOnLoad])

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* plus de Header ici, il est global via layout */}
      <Hero />
      <Artists />
      <Gallery />
      <Footer />

      {/* Drawer panier */}
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  )
}