// src/app/artists/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumb from '@/components/Breadcrumb'
import { getCatalog } from '@/lib/getCatalog'
import type { Artist } from '@/lib/types'

export const dynamic = 'force-dynamic' // évite le pre-render pour /api/catalog

export default async function ArtistsPage() {
  const data = await getCatalog()
  const artists: Artist[] = Array.isArray((data as any)?.artists) ? (data as any).artists as Artist[] : []

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 md:py-12">
      <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Artistes' }]} />

      <h1 className="text-2xl sm:text-3xl font-medium mt-4 mb-6">Tous les artistes</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {artists.map(a => (
          <Link key={a.id} href={`/artists/${a.slug}`} scroll className="group block">
            <div className="relative overflow-hidden rounded-lg border aspect-[4/3]">
              <Image
                src={a.cover}
                alt={a.name}
                fill
                sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                priority={false}
              />
            </div>
            <div className="mt-2 text-sm sm:text-base font-medium group-hover:text-accent transition-colors">
              {a.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}