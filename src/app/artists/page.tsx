import Link from 'next/link'
import Image from 'next/image'
import { artists } from '@/lib/data'
import Breadcrumb from '@/components/Breadcrumb'

export default function ArtistsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Artistes' }]} />
      <h1 className="text-2xl sm:text-3xl font-medium mb-4 sm:mb-6">Tous les artistes</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {artists.map(a => (
          <Link key={a.id} href={`/artists/${a.slug}`} className="group block">
            <div className="relative overflow-hidden rounded-lg border aspect-[4/3]">
              <Image
                src={a.cover}
                alt={a.name}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="mt-2 text-sm sm:text-base font-medium group-hover:text-accent transition-colors">{a.name}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
