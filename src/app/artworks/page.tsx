import Link from 'next/link'
import Image from 'next/image'
import { artworks, artists } from '@/lib/data'
import Breadcrumb from '@/components/Breadcrumb'

export default function ArtworksPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Œuvres' }]} />
      <h1 className="text-3xl font-medium mb-6">Toutes les œuvres</h1>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {artworks.map(w => {
          const artist = artists.find(a => a.id === w.artistId)
          return (
            <Link key={w.id} href={`/artworks/${w.slug}`} className="group block">
              <div className="aspect-[4/5] relative overflow-hidden rounded-lg border">
                <Image src={w.image} alt={w.title} fill className="object-cover transition-transform group-hover:scale-105" />
              </div>
              <div className="mt-2 text-sm font-medium">{w.title}</div>
              <div className="text-xs text-neutral-500">{artist?.name}</div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
