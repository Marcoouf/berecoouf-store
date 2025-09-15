import SmartImage from '@/components/SmartImage'
import Link from 'next/link'
import { getCatalog } from '@/lib/getCatalog'
import type { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { artists } = await getCatalog()
  const artist = artists.find(a => a.slug === params.slug)
  return {
    title: artist ? `${artist.name} — Point Bleu` : 'Artiste — Point Bleu',
    description: artist?.bio,
  }
}

export default async function ArtistPage({ params }: Props) {
  const { artists, artworks } = await getCatalog()
  const artist = artists.find(a => a.slug === params.slug)
  if (!artist) {
    return <div className="mx-auto max-w-3xl px-6 py-20">Artiste introuvable.</div>
  }
  const norm = (s: any) => String(s ?? '').trim().toLowerCase()
  const works = artworks.filter(w => {
    const byId   = norm(w.artistId) === norm(artist.id)
    const bySlug = norm((w as any).artistSlug) === norm(artist.slug)
    const byName = norm((w as any).artistName) === norm(artist.name)
    return byId || bySlug || byName
  })

  // Choose a hero image for the artist page without assuming a typed `image` field on Artist
  // 1) use optional artist.image if present in data
  // 2) otherwise try the first related artwork mockup or image
  const heroSrc: string | undefined =
    (artist as any)?.image
    ?? works.find(w => (w as any).mockup)?.mockup
    ?? works[0]?.image;

  const hasHero = Boolean(heroSrc);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="pt-6">
        <Breadcrumb
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Artistes', href: '/artists' },
            { label: artist.name },
          ]}
        />
      </div>

      <section className="py-6 sm:py-8 md:py-10">
        <div className="grid gap-6">
          {/* Bandeau image de l'artiste */}
          <div className="aspect-[21/9] relative overflow-hidden rounded-2xl border">
            {hasHero ? (
              <SmartImage
                src={heroSrc as string}
                alt={artist.name}
                fill
                sizes="(min-width:1024px) 1024px, 100vw"
                wrapperClass="absolute inset-0"
                imgClassName="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-neutral-100" />
            )}
          </div>

          {/* Infos artiste */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">{artist.name}</h1>
            <div className="text-sm text-neutral-500">{artist.handle}</div>
            <p className="mt-3 max-w-prose text-neutral-700">{artist.bio}</p>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200/60 py-8 sm:py-10 md:py-16">
        <h2 className="mb-6 text-xl font-medium tracking-tight">Œuvres</h2>
        <div className="mb-4 text-[11px] text-neutral-500">
          debug · artists={artists.length} · artworks={artworks.length} · artist.id={String(artist.id)} · artist.slug={artist.slug}
        </div>
          {works.length === 0 && (
            <div className="mb-6 text-sm text-neutral-500">Aucune œuvre trouvée pour cet artiste.</div>
          )}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {works.map(w => (
            <div key={w.id} className="group">
              <div className="aspect-[4/5] relative overflow-hidden rounded-xl border">
                <Link href={`/artworks/${w.slug}`} scroll className="absolute inset-0">
                  <SmartImage
                    src={w.image}
                    alt={w.title}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    wrapperClass="absolute inset-0"
                    imgClassName="object-cover transition-transform duration-500 group-hover:scale-[1.02] pointer-events-none select-none"
                    unoptimized
                  />
                </Link>
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">
                    <Link href={`/artworks/${w.slug}`} scroll>{w.title}</Link>
                  </div>
                  <div className="text-xs text-neutral-500">{artist.name}</div>
                </div>
                <div className="text-sm tabular-nums">{w.price.toFixed(0)} €</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link href="/" className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50">← Retour</Link>
        </div>
      </section>
    </div>
  )
}