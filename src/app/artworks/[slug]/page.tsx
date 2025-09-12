// src/app/artworks/[slug]/page.tsx
import Link from 'next/link'
import Image from '@/components/SmartImage'
import AdaptiveFrame from '@/components/AdaptiveFrame'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import ArtworkPurchase from '@/components/ArtworkPurchase'
import { euro } from '@/lib/format'
import { getCatalog } from '@/lib/getCatalog'
import type { Catalog } from '@/lib/getCatalog'

// important : ne pas figer au build
export const dynamic = 'force-dynamic'
export const revalidate = 0

function displayPriceFor(w: Catalog['artworks'][number]) {
  const formats = Array.isArray(w.formats) ? w.formats : []
  const formatPrices = formats.map((f: { price: any }) => Number(f.price)).filter((n: unknown) => Number.isFinite(n))
  const base = formatPrices.length > 0
    ? Math.min(...formatPrices)
    : (Number.isFinite(Number(w.price)) ? Number(w.price) : 0)
  return euro(base)
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const catalog = await getCatalog()
  const artwork = catalog.artworks.find(a => a.slug === params.slug)
  if (!artwork) return {}
  const artist = catalog.artists.find(a => a.id === artwork.artistId) || null

  const title = `${artwork.title}${artist ? ` — ${artist.name}` : ''}`
  const description = artwork.description || 'Œuvre disponible en édition limitée.'
  const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  const imgPath = artwork.mockup || artwork.image
  const ogImage = /^https?:\/\//i.test(imgPath) ? imgPath : (site ? `${site}${imgPath}` : imgPath)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = params
  const catalog = await getCatalog()

  const artwork = catalog.artworks.find(a => a.slug === slug)
  if (!artwork) notFound()

  const artist = catalog.artists.find(a => a.id === artwork.artistId) ?? null
  const related = catalog.artworks
    .filter(w => w.artistId === artwork.artistId && w.id !== artwork.id)
    .slice(0, 3)

  const mockupSrc = artwork.mockup ?? artwork.image
  const originalSrc = artwork.image

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
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

      <div className="grid gap-6 md:gap-8 py-8 sm:py-10 md:py-16 md:grid-cols-2">
        <AdaptiveFrame
          className="group relative rounded-2xl border bg-neutral-50 overflow-hidden transition-colors duration-300 hover:border-transparent hover:bg-transparent"
          src={mockupSrc}
          alt={`${artwork.title} — mise en situation`}
          sizes="(min-width:1024px) 50vw, 100vw"
          imgClassName="object-contain transition-opacity duration-300 will-change-[opacity] group-hover:opacity-0"
        >
          <Image
            src={originalSrc}
            alt={artwork.title}
            fill
            sizes="(min-width:1024px) 50vw, 100vw"
            className="absolute inset-0 z-10 object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-300 will-change-[opacity] pointer-events-none"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            data-protect="1"
            priority
            aria-hidden="true"
          />
        </AdaptiveFrame>

        <div className="md:pl-6">
          <Link
            href={artist ? `/artists/${artist.slug}` : '#'}
            className="text-xs uppercase tracking-widest text-neutral-500 hover:underline"
          >
            {artist ? artist.name : 'Artiste'}
          </Link>

          <h1 className="mt-2 text-2xl sm:text-3xl font-medium tracking-tight">{artwork.title}</h1>

          {artwork.description && (
            <p className="mt-4 max-w-prose text-neutral-700">{artwork.description}</p>
          )}

          {(artwork.year || artwork.technique || artwork.paper || artwork.size || artwork.edition) && (
            <div className="mt-6 rounded-xl border p-4">
              <div className="text-sm font-medium mb-3">Détails d’impression</div>
              <ul className="grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
                {artwork.year && (
                  <li>
                    <span className="block text-neutral-500">Année</span>
                    <span>{artwork.year}</span>
                  </li>
                )}
                {artwork.technique && (
                  <li>
                    <span className="block text-neutral-500">Technique</span>
                    <span>{artwork.technique}</span>
                  </li>
                )}
                {artwork.paper && (
                  <li>
                    <span className="block text-neutral-500">Papier</span>
                    <span>{artwork.paper}</span>
                  </li>
                )}
                {artwork.size && (
                  <li>
                    <span className="block text-neutral-500">Dimensions</span>
                    <span>{artwork.size}</span>
                  </li>
                )}
                {artwork.edition && (
                  <li className="sm:col-span-2">
                    <span className="block text-neutral-500">Édition</span>
                    <span>{artwork.edition}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          <ArtworkPurchase
            artwork={{
              id: artwork.id,
              title: artwork.title,
              image: artwork.image,
              price: artwork.price,
              artistId: artwork.artistId,
              formats: artwork.formats,
            }}
          />

          <div className="mt-8">
            <Link href="/" className="text-sm hover:underline">
              ← Retour à l’accueil
            </Link>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-neutral-200/60 py-10 md:py-16">
          <h2 className="mb-6 text-xl font-medium tracking-tight">
            Plus d’œuvres {artist ? `de ${artist.name}` : 'de cet artiste'}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {related.map(w => (
              <div key={w.id} className="group">
                <div className="relative overflow-hidden rounded-xl border aspect-[4/5]">
                  <Link href={`/artworks/${w.slug}`} scroll className="absolute inset-0" aria-label={`Voir ${w.title}`}>
                    <Image
                      src={w.image}
                      alt={w.title}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      data-protect="1"
                      className="object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.02]"
                    />
                  </Link>
                </div>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">
                      <Link href={`/artworks/${w.slug}`} scroll className="hover:underline">
                        {w.title}
                      </Link>
                    </div>
                    {artist && <div className="text-xs text-neutral-500">{artist.name}</div>}
                  </div>
                  <div className="text-sm tabular-nums">{displayPriceFor(w)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(() => {
        const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
        const img = artwork.mockup || artwork.image
        const imageAbs = /^https?:\/\//i.test(img) ? img : (site ? `${site}${img}` : img)
        const urlAbs = site ? `${site}/artworks/${artwork.slug}` : `/artworks/${artwork.slug}`
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'VisualArtwork',
          name: artwork.title,
          image: imageAbs,
          creator: artist ? { '@type': 'Person', name: artist.name } : undefined,
          url: urlAbs,
          artform: artwork.technique || undefined,
          material: artwork.paper || undefined,
        }
        return (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )
      })()}
    </div>
  )
}
