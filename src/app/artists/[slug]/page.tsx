import Image from 'next/image'
import Link from 'next/link'
import { findArtistBySlug, artworksByArtist } from '@/lib/data'
import type { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = findArtistBySlug(params.slug)
  return {
    title: artist ? `${artist.name} — Berecoouf` : 'Artiste — Berecoouf',
    description: artist?.bio,
  }
}

export default function ArtistPage({ params }: Props) {
  const artist = findArtistBySlug(params.slug)
  if (!artist) {
    return <div className="mx-auto max-w-3xl px-6 py-20">Artiste introuvable.</div>
  }
  const works = artworksByArtist(artist.id)

  return (
    <div className="mx-auto max-w-6xl px-6">
<div className="pt-6">
  <Breadcrumb
    items={[
      { label: 'Accueil', href: '/' },
      { label: 'Artistes', href: '/artists' },
      { label: artist.name },
    ]}
  />
</div>

      <section className="py-6 md:py-10">
        <div className="aspect-[4/2] relative overflow-hidden rounded-2xl border">
          <Image src={artist.cover} alt={artist.name} fill className="object-cover" />
        </div>
        <div className="mt-6 flex items-start gap-4">
          <Image src={artist.avatar} alt="" width={56} height={56} className="rounded-full object-cover" />
          <div>
            <h1 className="text-3xl font-medium tracking-tight">{artist.name}</h1>
            <div className="text-sm text-neutral-500">{artist.handle}</div>
            <p className="mt-3 max-w-prose text-neutral-700">{artist.bio}</p>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200/60 py-10 md:py-16">
        <h2 className="mb-6 text-xl font-medium tracking-tight">Œuvres</h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {works.map(w => (
            <div key={w.id} className="group">
              <div className="aspect-[4/5] relative overflow-hidden rounded-xl border">
                <Link href={`/artworks/${w.slug}`} className="absolute inset-0">
                  <Image src={w.image} alt={w.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                </Link>
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">
                    <Link href={`/artworks/${w.slug}`}>{w.title}</Link>
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
