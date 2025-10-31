// src/app/artworks/[slug]/page.tsx
import Link from 'next/link'
import ConditionalPaddingImage from '@/components/ConditionalPaddingImage'
import { euro } from '@/lib/format'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import ArtworkPurchase from '@/components/ArtworkPurchase'
import { getCatalog } from '@/lib/getCatalog'
import ArtworkImageCarousel from '@/components/ArtworkImageCarousel'
import { MoonIcon } from '@/components/icons'
// important : ne pas figer au build
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const catalog = await getCatalog()
  const artwork = catalog.artworks.find(a => a.slug === params.slug)
  if (!artwork) return {}
  const artist = catalog.artists.find(a => a.id === artwork.artistId) || null

  const title = `${artwork.title}${artist ? ` — ${artist.name}` : ''}`
  const description = artwork.description || 'Œuvre disponible en édition limitée.'
  const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  const imgPath = artwork.mockup || artwork.image || ''
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

  // Normalisation: variants & priceMin pour l'UI (types solides)
  type VariantUI = { id: string; label: string; price: number }

  const rawVariants = Array.isArray((artwork as any).variants)
    ? (artwork as any).variants
    : Array.isArray((artwork as any).formats)
      ? (artwork as any).formats
      : []

  // Print-only: on exclut toute variante numérique si un champ "type" est présent
  const variants: VariantUI[] = (rawVariants as any[])
    .filter((v: any) => {
      const t = String(v?.type ?? '').toLowerCase()
      return !t || t === 'print'
    })
    .map((v: any): VariantUI => ({
      id: String(v?.id ?? ''),
      label: String(v?.label ?? ''),
      price: Number(v?.price ?? 0) || 0,
    }))
    // On ne garde que les formats valides (prix > 0 et label non vide)
    .filter((v) => Number.isFinite(v.price) && v.price > 0 && v.label.trim().length > 0)

  const prices = variants
    .map((v) => Number(v.price))
    .filter((n) => Number.isFinite(n) && n >= 0)

  const base = Number((artwork as any)?.basePrice ?? (artwork as any)?.price ?? 0)
  const priceMin = prices.length > 0
    ? Math.min(...prices)
    : (Number.isFinite(base) && base > 0 ? base : 0)

  const artist = catalog.artists.find(a => a.id === artwork.artistId) ?? null

  // Prépare les items "plus d'œuvres" directement depuis le catalogue
  const related = catalog.artworks.filter(
    (w) => w.artistId === artwork.artistId && w.id !== artwork.id
  )

  const artistsById = Object.fromEntries(
    catalog.artists.map((a) => [a.id, a.name as string])
  ) as Record<string, string>

  const relatedTitle: string = artist
    ? `Plus d’œuvres de ${artist?.name ?? ''}`
    : 'Plus d’œuvres'

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
        <figure className="mx-auto w-full max-w-[820px]">
          <ArtworkImageCarousel
            title={String(artwork.title)}
            image={String((artwork as any).image ?? '')}
            mockup={(artwork as any).mockup ?? null}
            images={Array.isArray((artwork as any).images) ? ((artwork as any).images as any[]) : undefined}
            priority
            maxSize={720}
            className="artwork-carousel"
          />
          <figcaption className="sr-only">{artwork.title}</figcaption>
        </figure>

        <div className="md:pl-6">
          <Link
            href={artist ? (`/artists/${artist.slug ?? ''}` as const) : '#'}
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

          {artist?.isOnVacation ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <MoonIcon className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
              <div>
                <div className="font-semibold">L’artiste est en vacances</div>
                <p className="mt-1 text-amber-700/90">
                  Les commandes pour cette œuvre seront disponibles à son retour.
                </p>
              </div>
            </div>
          ) : null}

          <ArtworkPurchase
            artwork={{
              id: String(artwork.id),
              title: String(artwork.title),
              image: String((artwork as any).image ?? ''),
              price: Number(priceMin) || 0,
              artistId: String(artwork.artistId),
              formats: variants.map((v) => ({ id: v.id, label: v.label, price: v.price })),
              artistOnVacation: Boolean((artwork as any).artistOnVacation ?? artist?.isOnVacation ?? false),
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
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-medium">{relatedTitle}</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {related.map((art) => (
              <Link
                key={art.id}
                href={`/artworks/${art.slug}`}
                className="group block"
              >
                <div className="aspect-square w-full overflow-hidden rounded-2xl border bg-white relative">
                  <ConditionalPaddingImage
                    src={String((art as any).image ?? '')}
                    alt={String(art.title)}
                    sizes="(min-width: 1024px) 320px, (min-width: 640px) 33vw, 100vw"
                    imageClassName="transition-transform duration-300 group-hover:scale-[1.02] !object-contain"
                    padding={28}
                  />
                </div>

                <div className="mt-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{art.title}</div>
                    <div className="text-xs text-neutral-500">{artistsById[art.artistId]}</div>
                  </div>
                  <div className="ml-auto text-sm tabular-nums">
                    {(art as any).priceMinFormatted ?? euro((art as any).priceMin ?? (art as any).price ?? 0)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(() => {
        const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
        const img = artwork.mockup || artwork.image || ''
        const isAbsolute = /^https?:\/\//i.test(img)
        const imageAbs = isAbsolute ? img : (site ? `${site}${img}` : img)
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
