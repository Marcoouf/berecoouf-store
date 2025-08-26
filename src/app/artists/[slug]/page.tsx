import Image from '@/components/SmartImage'
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
  const works = artworks.filter(w => w.artistId === artist.id)

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
        <div className="relative overflow-hidden rounded-2xl border aspect-[4/2] min-h-[180px] sm:min-h-[240px] md:min-h-[280px] bg-neutral-50">
          <Image src={artist.cover} alt={artist.name} fill sizes="100vw" className="object-cover" />
        </div>
        <div className="mt-6 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <Image src={artist.avatar} alt="" width={56} height={56} sizes="56px" className="rounded-full object-cover" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">{artist.name}</h1>
            <div className="text-sm text-neutral-500">{artist.handle}</div>
            <p className="mt-3 max-w-prose text-neutral-700">{artist.bio}</p>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200/60 py-8 sm:py-10 md:py-16">
        <h2 className="mb-6 text-xl font-medium tracking-tight">Œuvres</h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {works.map(w => (
            <div key={w.id} className="group">
              <div className="aspect-[4/5] relative overflow-hidden rounded-xl border">
                <Link href={`/artworks/${w.slug}`} scroll className="absolute inset-0">
                  <Image src={w.image} alt={w.title} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                </Link>
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">
                    <Link href={`/artworks/${w.slug}`} scroll>{w.title}</Link>
                  </div>
                  <div className="text-xs text-neutral-500">{artist.name}</div>
                </div>
                <div className="text-sm tabular-nums">€{w.price.toFixed(0)}</div>
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
