import Link from 'next/link'
import Image from 'next/image'
import { artists } from '@/lib/data'
import Breadcrumb from '@/components/Breadcrumb'

export default function ArtistsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Artistes' }]} />
      <h1 className="text-3xl font-medium mb-6">Tous les artistes</h1>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {artists.map(a => (
          <Link key={a.id} href={`/artists/${a.slug}`} className="group block">
            <div className="aspect-[4/3] relative overflow-hidden rounded-lg border">
              <Image src={a.cover} alt={a.name} fill className="object-cover transition-transform group-hover:scale-105" />
            </div>
            <div className="mt-2 font-medium">{a.name}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
