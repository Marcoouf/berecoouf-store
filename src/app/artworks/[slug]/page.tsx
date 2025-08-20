'use client'

import Image from '@/components/SmartImage'
import Link from 'next/link'
import { findArtworkBySlug, artists, artworksByArtist } from '@/lib/data'
import { useState, useMemo } from 'react'
import { useCart } from '@/components/CartContext'
import Breadcrumb from '@/components/Breadcrumb'

type Props = { params: { slug: string } }

export default function ArtworkPage({ params }: Props) {
  const artwork = findArtworkBySlug(params.slug)
  if (!artwork) {
    return <div className="mx-auto max-w-3xl px-6 py-20">Œuvre introuvable.</div>
  }

  const artist = artists.find(a => a.id === artwork.artistId) ?? null

  const [formatId, setFormatId] = useState(artwork.formats?.[0]?.id ?? null)
  const selected = useMemo(
    () => artwork.formats?.find(f => f.id === formatId) ?? null,
    [formatId, artwork.formats]
  )

  const { add } = useCart()

  const related = (artist ? artworksByArtist(artist.id) : [])
    .filter(w => w.id !== artwork.id)
    .slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Fil d’Ariane */}
      <div className="pt-6">
        <Breadcrumb
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Œuvres', href: '/artworks' },
            ...(artist ? [{ label: artist.name, href: `/artists/${artist.slug}` as const }] : []),
            { label: artwork.title },
          ]}
        />
      </div>

      {/* Grille principale */}
      <div className="grid gap-8 py-10 md:grid-cols-2 md:py-16">
        {/* Visuel — toujours entier */}
        <div
          className="
            relative overflow-hidden rounded-2xl border bg-mist
            aspect-[4/5] md:aspect-[3/4]
            lg:aspect-auto lg:h-[72vh]
            flex items-center justify-center
          "
        >
          <Image
            src={artwork.image}
            alt={artwork.title}
            fill
            className="object-contain"
            sizes="(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw"
            priority={false}
          />
        </div>

        {/* Panneau d’infos */}
        <div className="md:pl-6">
          <Link
            href={artist ? `/artists/${artist.slug}` : '#'}
            className="text-xs uppercase tracking-widest text-neutral-500 hover:underline"
          >
            {artist ? artist.name : 'Artiste'}
          </Link>

          <h1 className="mt-2 text-3xl font-medium tracking-tight">{artwork.title}</h1>

          <div className="mt-2 text-lg tabular-nums">
            €{(selected?.price ?? artwork.price).toFixed(0)}
          </div>

          {artwork.description && (
            <p className="mt-4 max-w-prose text-neutral-700">{artwork.description}</p>
          )}

          {!!artwork.formats?.length && (
            <div className="mt-6">
              <div className="text-sm font-medium">Format</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {artwork.formats.map(f => {
                  const isSel = f.id === formatId
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFormatId(f.id)}
                      className={[
                        'rounded-full px-3 py-1 text-xs border transition',
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
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => add(artwork as any, selected as any)}
              className="rounded-lg bg-accent hover:bg-accent-dark text-ink font-medium px-4 py-2 text-sm transition md:w-auto"
            >
              Ajouter au panier
            </button>
          </div>

          <div className="mt-8">
            <Link href="/" className="text-sm hover:underline">← Retour à l’accueil</Link>
          </div>
        </div>
      </div>

      {/* Plus d’œuvres du même artiste */}
      {related.length > 0 && (
        <section className="border-t border-neutral-200/60 py-10 md:py-16">
          <h2 className="mb-6 text-xl font-medium tracking-tight">
            Plus d’œuvres {artist ? `de ${artist.name}` : 'de cet artiste'}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {related.map(w => (
              <div key={w.id} className="group">
                <div className="relative overflow-hidden rounded-xl border aspect-[4/5]">
                  <Link href={`/artworks/${w.slug}`} className="absolute inset-0">
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
                    {artist && <div className="text-xs text-neutral-500">{artist.name}</div>}
                  </div>
                  <div className="text-sm tabular-nums">€{w.price.toFixed(0)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}