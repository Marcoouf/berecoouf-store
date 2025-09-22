// src/app/artworks/[slug]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import ArtworkPurchase from '@/components/ArtworkPurchase'
import { getCatalog } from '@/lib/getCatalog'
import ArtworkImageCarousel from '@/components/ArtworkImageCarousel'
import RelatedCarousel from '@/components/RelatedCarousel'
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

  const variants: VariantUI[] = (Array.isArray((artwork as any).variants)
    ? (artwork as any).variants
    : Array.isArray((artwork as any).formats)
      ? (artwork as any).formats
      : [])
    .map((v: any): VariantUI => ({
      id: String(v?.id ?? ''),
      label: String(v?.label ?? ''),
      price: Number(v?.price ?? 0) || 0,
    }))

  const prices = variants
    .map((v) => Number(v.price))
    .filter((n) => Number.isFinite(n) && n >= 0)

  const base = Number((artwork as any)?.basePrice ?? (artwork as any)?.price ?? 0)
  const priceMin = prices.length > 0
    ? Math.min(...prices)
    : (Number.isFinite(base) && base > 0 ? base : 0)

  const artist = catalog.artists.find(a => a.id === artwork.artistId) ?? null

  // Prépare les items "plus d'oeuvres" au format attendu par RelatedCarousel
  const relatedRaw = catalog.artworks.filter(w => w.artistId === artwork.artistId && w.id !== artwork.id)
  const relatedItems = relatedRaw.map(w => ({
    id: w.id,
    slug: w.slug,
    title: w.title,
    image: String((w as any).image ?? ''),
    price: Number((w as any).price ?? (w as any).basePrice ?? 0) || 0,
    artistId: w.artistId,
  }))

  const artistsById = Object.fromEntries(catalog.artists.map(a => [a.id, a.name as string])) as Record<string, string>
  const relatedTitle: string = artist ? `Plus d’œuvres de ${artist?.name ?? ''}` : 'Plus d’œuvres'

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
            priority
            maxSize={720}
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

          <ArtworkPurchase
            artwork={{
              id: String(artwork.id),
              title: String(artwork.title),
              image: String((artwork as any).image ?? ''),
              price: Number(priceMin) || 0,
              artistId: String(artwork.artistId),
              formats: variants.map((v) => ({ id: v.id, label: v.label, price: v.price })),
            }}
          />

          <div className="mt-8">
            <Link href="/" className="text-sm hover:underline">
              ← Retour à l’accueil
            </Link>
          </div>
        </div>
      </div>

      {relatedItems.length > 0 && (
        <RelatedCarousel
          items={relatedItems}
          title={relatedTitle}
          artistsById={artistsById}
        />
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
