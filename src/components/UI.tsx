'use client'

import React from 'react'
import Image from '@/components/SmartImage'
import NextImage from 'next/image'
import Link from 'next/link'
import type { Artwork, Artist, CartItem } from '@/lib/types'
import { useCart } from '@/components/CartContext'
import { FadeIn, Stagger } from '@/components/Motion'
import { euro } from '@/lib/format'

type HeroHighlight = {
  image?: string | null
  title?: string | null
  artistName?: string | null
  edition?: string | null
  priceLabel?: string | null
}

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

function Hero({ highlight }: { highlight?: HeroHighlight | null }) {
  const altText = highlight?.title
    ? `Œuvre « ${highlight.title} »${highlight?.artistName ? ` par ${highlight.artistName}` : ''}`
    : "Illustration mise en avant"

  return (
    <section className="border-b border-neutral-200/60">
      <Container className="py-12 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <FadeIn>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-accent">
                Editions limitées
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-medium tracking-tight leading-tight">
                Illustrations contemporaines
                <span className="block text-neutral-500">à collectionner ou offrir</span>
              </h1>
              <p className="mt-6 max-w-prose text-neutral-600">
                Tirages certifiés, numérotés et emballés avec soin. Chaque pièce inclut sa licence numérique et un certificat d’authenticité signé.
              </p>

              {highlight?.priceLabel && (
                <p className="mt-3 text-sm text-neutral-500">
                  Œuvre mise en avant&nbsp;: {highlight?.title} — {highlight.priceLabel}
                  {highlight?.artistName ? ` · ${highlight.artistName}` : ''}
                  {highlight?.edition ? ` · ${highlight.edition}` : ''}
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/artworks"
                  className="inline-flex items-center justify-center rounded-full bg-accent text-ink px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Découvrir la galerie
                </Link>
                <Link
                  href="/artists"
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-800 transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Rencontrer les artistes
                </Link>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="relative aspect-[4/3] min-h-[260px] sm:min-h-[320px] md:min-h-[420px] lg:min-h-[520px] overflow-hidden rounded-3xl border bg-neutral-50" aria-busy={false}>
              {highlight?.image ? (
                <NextImage
                  src={highlight.image}
                  alt={altText}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
                  className="object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 text-neutral-400">
                  <span className="text-sm">Visuel d’œuvre indisponible</span>
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  )
}

const reassuranceItems = [
  {
    title: 'Certificat et édition limitée',
    description: 'Chaque tirage est numéroté et livré avec certificat d’authenticité signé par l’artiste.'
  },
  {
    title: 'Qualité musée',
    description: 'Impression giclée sur papier beaux-arts, encres pigmentaires, contrôle colorimétrique en atelier.'
  },
  {
    title: 'Livraison suivie & fichier HD',
    description: 'Expédition protégée avec suivi + accès immédiat au fichier numérique (lien sécurisé & expirant).'
  },
]

function Reassurance() {
  return (
    <section aria-label="Garanties" className="border-b border-neutral-200/60">
      <Container className="py-10 md:py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {reassuranceItems.map((item) => (
            <div key={item.title} className="rounded-2xl border border-neutral-200/70 bg-white/60 p-6">
              <div className="text-sm font-semibold uppercase tracking-widest text-accent">{item.title}</div>
              <p className="mt-3 text-sm text-neutral-600">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

type CollectionHighlight = {
  id: string
  title: string
  artist?: string | null
  image?: string | null
}

function CollectionsTeaser({ collections }: { collections: CollectionHighlight[] }) {
  if (!collections.length) return null

  return (
    <section id="collections" className="border-b border-neutral-200/60">
      <Container className="py-12 md:py-16">
        <SectionTitle
          kicker="pour explorer"
          title="Collections mises en avant"
          right={
            <Link href="/artworks" className="text-sm text-accent hover:text-accent-dark underline-offset-4 hover:underline">
              Voir toute la galerie
            </Link>
          }
        />
        <div className="grid gap-5 md:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/artworks?highlight=${collection.id}`}
              className="group rounded-2xl border bg-white/70 p-5 transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-neutral-50">
                {collection.image ? (
                  <Image
                    src={collection.image}
                    alt={collection.title}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
                    Visuel en préparation
                  </div>
                )}
              </div>
              <div className="mt-4 text-sm font-medium text-neutral-800">
                {collection.title}
                {collection.artist ? <span className="block text-xs text-neutral-500">{collection.artist}</span> : null}
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}

function Artists({ artists }: { artists: Artist[] }) {
  if (!artists.length) return null

  return (
    <section id="artists" className="border-b border-neutral-200/60">
      <Container className="py-14 md:py-20">
        <SectionTitle kicker="sélection" title="Artistes publiés" />
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          <Stagger>
            {artists.map(a => (
              <Link key={a.id} href={`/artists/${a.slug}`} className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl border relative transition-all duration-300 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
                  {a.image ? (
                    <Image
                      src={a.image}
                      alt={`Œuvre représentative de ${a.name}`}
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
                  {a.portrait ? (
                    <Image src={a.portrait} alt={`Portrait de ${a.name}`} width={32} height={32} className="rounded-full object-cover" sizes="32px" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">
                      {a.name?.charAt(0) ?? '?'}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium group-hover:text-accent transition">{a.name}</div>
                    {a.handle ? <div className="text-xs text-neutral-500">{a.handle}</div> : null}
                  </div>
                </div>
                {a.bio ? <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{a.bio}</p> : null}
              </Link>
            ))}
          </Stagger>
        </div>
      </Container>
    </section>
  )
}

function ArtworkCard({ art, onAdd, artistsById }: { art: Artwork; onAdd: (a: Artwork, f: any) => void; artistsById: Record<string, string> }) {
  const [formatId, setFormatId] = React.useState((art.formats ?? (art as any).variants ?? [])[0]?.id ?? null)
  const selected = React.useMemo(() => {
    const list = (art.formats ?? (art as any).variants ?? []) as any[]
    return list.find((f) => f.id === formatId) ?? null
  }, [formatId, art.formats, (art as any).variants])

  const slug = art.slug ?? art.id

  const formats = (art.formats ?? (art as any).variants ?? []) as any[]

  return (
    <div className="group flex h-full flex-col">
      <Link
        href={`/artworks/${slug}`}
        scroll
        className="relative block aspect-square overflow-hidden rounded-2xl border transition-all duration-300 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-accent-300"
        aria-label={`Voir l’œuvre ${art.title}`}
      >
        {art.image ? (
          <Image
            src={art.image}
            alt={`Visuel de l’œuvre ${art.title}`}
            fill
            className="object-contain bg-white transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-accent text-ink">
            <span className="px-3 text-sm font-medium text-center">{art.title}</span>
          </div>
        )}
      </Link>

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
          {art.priceMinFormatted ?? euro((art as any).priceMin ?? 0)}
        </div>
      </div>

      {formats.length > 0 && (
        <div className="mt-2 min-h-[72px] grid grid-cols-2 gap-2 xs:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
          {formats.map((f) => {
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
                  'border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
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

      <div className="mt-auto pt-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAdd(art, selected)
          }}
          className="w-full rounded-lg bg-accent-300 hover:bg-accent-400 text-ink font-medium px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
      0

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
    }

    add(item as any)
  }, [add])

  if (!artworks.length) {
    return (
      <section id="gallery" className="border-b border-neutral-200/60">
        <Container className="py-10 sm:py-14 md:py-20">
          <SectionTitle kicker="catalogue" title="Galerie" />
          <p className="text-sm text-neutral-600">Le catalogue est en cours de mise à jour. Revenez bientôt pour découvrir les nouvelles œuvres.</p>
        </Container>
      </section>
    )
  }

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

export default function Site({ openCartOnLoad = false, catalog }: { openCartOnLoad?: boolean; catalog?: { artists: Artist[]; artworks: Artwork[] } }) {
  const { openCart } = useCart()
  const [artistsState, setArtistsState] = React.useState<Artist[]>(catalog?.artists ?? [])
  const [artworksState, setArtworksState] = React.useState<Artwork[]>(catalog?.artworks ?? [])

  React.useEffect(() => {
    if (openCartOnLoad) openCart()
  }, [openCartOnLoad, openCart])

  React.useEffect(() => {
    if (catalog) return
    let active = true
    fetch('/api/catalog', { cache: 'no-store' })
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

  const heroHighlight = React.useMemo<HeroHighlight | null>(() => {
    const first = artworksState[0]
    if (!first) return null

    const image =
      (first as any).cover?.url ??
      (first as any).image ??
      (first as any).mockup ??
      (Array.isArray((first as any).images) ? (first as any).images[0]?.url : undefined)

    return {
      image: typeof image === 'string' ? image : undefined,
      title: first.title,
      artistName: artistsById[first.artistId] ?? null,
      edition: (first as any).edition ?? null,
      priceLabel: first.priceMinFormatted ?? (first.priceMin ? euro(first.priceMin) : null),
    }
  }, [artworksState, artistsById])

  const collections = React.useMemo<CollectionHighlight[]>(() => {
    return artworksState.slice(0, 3).map((art) => ({
      id: art.id,
      title: art.title,
      artist: artistsById[art.artistId] ?? null,
      image: (art as any).image ?? (art as any).mockup ?? null,
    }))
  }, [artworksState, artistsById])

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased pb-12 sm:pb-0">
      <Hero highlight={heroHighlight} />
      <Reassurance />
      <CollectionsTeaser collections={collections} />
      <Artists artists={artistsState} />
      <Gallery artworks={artworksState} artistsById={artistsById} />
    </div>
  )
}
