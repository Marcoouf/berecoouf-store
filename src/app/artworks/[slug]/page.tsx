// src/app/artworks/[slug]/page.tsx
import Link from 'next/link'
import Image from '@/components/SmartImage'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { headers } from 'next/headers'
import ArtworkPurchase from '@/components/ArtworkPurchase'
import { euro } from '@/lib/format';

// important : ne pas figer au build
export const dynamic = 'force-dynamic' // Next 13/14
// (équivalent possible : export const revalidate = 0)

type Catalog = {
  artists: { id: string; name: string; slug: string }[]
  artworks: {
    id: string
    slug: string
    title: string
    image: string
    artistId: string
    price: number
    description?: string
    year?: number
    technique?: string
    paper?: string
    size?: string
    edition?: string
    formats?: { id: string; label: string; price: number }[]
  }[]
}

function displayPriceFor(w: Catalog['artworks'][number]) {
  // Normalise "formats" pour éviter undefined
  const formats = Array.isArray(w.formats) ? w.formats : []

  // Convertit proprement en nombres
  const formatPrices = formats
    .map(f => Number(f.price))
    .filter(n => Number.isFinite(n))

  // Si on a des formats, on prend le min ; sinon, le prix de base
  const base = formatPrices.length > 0
    ? Math.min(...formatPrices)
    : (Number.isFinite(Number(w.price)) ? Number(w.price) : 0)

  return euro(base)
}

async function getCatalog(): Promise<Catalog> {
  // Construit une URL absolue fiable (dev, prod, Vercel) pour l'appel serveur → serveur
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const base = (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')) || `${proto}://${host}`

  const res = await fetch(`${base}/api/catalog`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('catalog fetch failed')
  return res.json()
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = params
  const catalog = await getCatalog()

  // on cherche l’œuvre côté runtime
  const artwork = catalog.artworks.find(a => a.slug === slug)
  if (!artwork) {
    // si rien => 404 propre
    notFound()
  }

  const artist = catalog.artists.find(a => a.id === artwork.artistId) ?? null
  const related = catalog.artworks
    .filter(w => w.artistId === artwork.artistId && w.id !== artwork.id)
    .slice(0, 3)

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
        <div className="relative overflow-hidden rounded-2xl border aspect-[4/5] min-h-[240px] sm:min-h-[320px] bg-neutral-50">
          <Image src={artwork.image} alt={artwork.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain" />
        </div>

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
              <ul className="grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
                {artwork.year && (
                  <li className="flex justify-between gap-3">
                    <span className="text-neutral-500">Année</span>
                    <span>{artwork.year}</span>
                  </li>
                )}
                {artwork.technique && (
                  <li className="flex justify-between gap-3">
                    <span className="text-neutral-500">Technique</span>
                    <span>{artwork.technique}</span>
                  </li>
                )}
                {artwork.paper && (
                  <li className="flex justify-between gap-3">
                    <span className="text-neutral-500">Papier</span>
                    <span>{artwork.paper}</span>
                  </li>
                )}
                {artwork.size && (
                  <li className="flex justify-between gap-3">
                    <span className="text-neutral-500">Dimensions</span>
                    <span>{artwork.size}</span>
                  </li>
                )}
                {artwork.edition && (
                  <li className="flex justify-between gap-3 md:col-span-2">
                    <span className="text-neutral-500">Édition</span>
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
                  <Link href={`/artworks/${w.slug}`} className="absolute inset-0" aria-label={`Voir ${w.title}`}>
                    <Image
                      src={w.image}
                      alt={w.title}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
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
<div className="text-sm tabular-nums">
  {displayPriceFor(w)}
</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}