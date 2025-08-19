'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from '@/components/SmartImage'
import Link from 'next/link'
import { artworks } from '@/lib/data'
import { artists } from '@/lib/data'
import type { Artwork } from '@/lib/types'
import { useCart } from '@/components/CartContext'
import Breadcrumb from '@/components/Breadcrumb'
import { FadeIn, Stagger } from '@/components/Motion'

function Container({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>
}

function SectionTitle({ kicker, title, right }: { kicker?: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        {kicker && <div className="text-xs uppercase tracking-widest text-neutral-500">{kicker}</div>}
        <h2 className="mt-2 text-2xl font-medium tracking-tight">{title}</h2>
      </div>
      {right}
    </div>
  )
}

function Header({ onOpenCart }: { onOpenCart: () => void }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-line/70 bg-white/70 backdrop-blur">
      <Container className="py-3 flex items-center justify-between">
        <Link href="/" className="text-sm tracking-widest uppercase">Berecoouf</Link>
        <nav className="hidden gap-6 md:flex text-sm text-neutral-600">
          <Link href="/artists" className="hover:underline underline-offset-4">Artistes</Link>
          <Link href="/artworks" className="hover:underline underline-offset-4">Œuvres</Link>
          <a href="#about" className="hover:underline underline-offset-4">À propos</a>
        </nav>
        <button onClick={onOpenCart} className="rounded-full border px-3 py-1 text-sm hover:bg-neutral-50">Panier</button>
      </Container>
    </header>
  )
}
function Hero() {
  return (
    <section className="border-b border-line/60">
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
              <div className="mt-8 flex gap-3">
                <a href="#gallery" className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50">Découvrir</a>
                <Link href="/artists" className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50">Nos artistes</Link>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border relative">
              <Image src="/images/hero.jpg" alt="Hero artwork" fill className="object-cover" />
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
            <Link key={a.id} href={`/artists/${a.slug}`} className="group">
              <div className="aspect-[4/3] overflow-hidden rounded-xl border relative">
                <Image src={a.cover} alt={a.name} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Image src={a.avatar} alt="" width={32} height={32} className="rounded-full object-cover" />
                <div>
                  <div className="text-sm font-medium">{a.name}</div>
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

function ArtworkCard({ art, onAdd }: { art: Artwork; onAdd: (a: Artwork, f: any) => void }) {
  const [formatId, setFormatId] = useState(art.formats?.[0]?.id ?? null)
  const selected = useMemo(() => art.formats?.find(f => f.id === formatId) ?? null, [formatId, art.formats])

  return (
    <div className="group">
      <div className="aspect-[4/5] overflow-hidden rounded-xl border relative">
        <Link href={`/artworks/${art.slug}`} className="absolute inset-0">
          <Image src={art.image} alt={art.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        </Link>
      </div>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium">
            <Link href={`/artworks/${art.slug}`}>{art.title}</Link>
          </div>
          <div className="text-xs text-neutral-500">{artistName(art.artistId)}</div>
        </div>
        <div className="text-sm tabular-nums">€{(selected?.price ?? art.price).toFixed(0)}</div>
      </div>
      {!!art.formats?.length && (
        <div className="mt-2 flex flex-wrap gap-2">
          {art.formats.map(f => (
            <button key={f.id} onClick={() => setFormatId(f.id)} className={`rounded-full border px-3 py-1 text-xs ${f.id === formatId ? 'bg-black text-white' : 'hover:bg-neutral-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3">
        <button onClick={() => onAdd(art, selected)} className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50">
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
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
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
          <button onClick={onClose} className="rounded-full border px-3 py-1 text-sm hover:bg-neutral-50">Fermer</button>
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
                      <button onClick={() => remove(i.key)} className="text-xs text-neutral-500 hover:underline">Retirer</button>
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">{artistName(i.artwork.artistId)}{i.format ? ` — ${i.format.label}` : ''}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <input type="number" min={1} value={i.qty} onChange={(e) => updateQty(i.key, Math.max(1, Number(e.target.value)))} className="w-16 rounded border px-2 py-1 text-sm" />
                      <div className="ml-auto text-sm tabular-nums">€{((i.format?.price ?? i.artwork.price) * i.qty).toFixed(0)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-3 border-t pt-4">
              <div className="flex justify-between text-sm"><span>Total</span><span className="tabular-nums">€{total.toFixed(0)}</span></div>
              <button className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50">Procéder au paiement</button>
              <button onClick={clear} className="w-full rounded-lg border px-3 py-2 text-xs text-neutral-500 hover:bg-neutral-50">Vider le panier</button>
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
            <div className="text-sm tracking-widest uppercase text-neutral-800">Berecoouf</div>
            <p className="mt-3 max-w-sm">Éditions d&apos;art et galerie en ligne. Tirages numérotés, impression fine art.</p>
          </div>
          <div>
            <div className="font-medium text-neutral-800">Aide</div>
            <ul className="mt-3 space-y-2">
              <li><a href="#" className="hover:underline">FAQ</a></li>
              <li><a href="#" className="hover:underline">Livraison & retours</a></li>
              <li><a href="#" className="hover:underline">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-neutral-800">Légal</div>
            <ul className="mt-3 space-y-2">
              <li><a href="#" className="hover:underline">Mentions légales</a></li>
              <li><a href="#" className="hover:underline">CGV</a></li>
              <li><a href="#" className="hover:underline">Confidentialité</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 text-xs text-neutral-500">© {new Date().getFullYear()} Berecoouf. Tous droits réservés.</div>
      </Container>
    </footer>
  )
}

function artistName(id: string) {
  const a = artists.find(x => x.id === id)
  return a ? a.name : 'Artiste'
}

export default function Site() {
  const [open, setOpen] = useState(false)
  return (
   
      <div className="min-h-screen bg-white text-neutral-900 antialiased">
        <Header onOpenCart={() => setOpen(true)} />
          <Container className="pt-6">
  <Breadcrumb items={[{ label: 'Accueil' }]} />
</Container>
        <Hero />
        <Artists />
        <Gallery />
        <Footer />
        <CartDrawer open={open} onClose={() => setOpen(false)} />
      </div>
    
  )
}
