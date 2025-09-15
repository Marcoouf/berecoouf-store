// src/app/artists/page.tsx
import Link from 'next/link'
import SmartImage from '@/components/SmartImage'
import Breadcrumb from '@/components/Breadcrumb'
import { getCatalog } from '@/lib/getCatalog'
import type { Artist } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ArtistsPage() {
  // Récupère le catalogue (serveur)
  const data = await getCatalog()
  const artists: Artist[] = Array.isArray((data as any)?.artists)
    ? ((data as any).artists as Artist[])
    : []

  // Filtre les entrées incomplètes pour éviter un rendu cassé
  const safe = artists.filter(a => a && a.slug && a.name)

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 md:py-12">
      <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Artistes' }]} />
      <h1 className="text-2xl sm:text-3xl font-medium mt-4 mb-6">Tous les artistes</h1>

      {/* État vide clair */}
      {safe.length === 0 && (
        <div className="mt-10 rounded-xl border p-6 text-center text-neutral-600">
          <p className="text-sm sm:text-base">
            Aucun artiste à afficher pour le moment.
          </p>
          <p className="mt-2 text-xs sm:text-sm">
            Vérifie que <code>/api/catalog</code> retourne bien une clé <code>artists</code> non vide
            et que chaque artiste possède au minimum <code>id</code>, <code>slug</code>, <code>name</code>.
          </p>
          <div className="mt-4">
            <Link href="/" className="text-sm underline underline-offset-4">
              ← Retour à l’accueil
            </Link>
          </div>
        </div>
      )}

      {safe.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {safe.map((a, idx) => {
            // Fallback image léger pour éviter un rendu vide si cover manquant
            const cover = a.cover || '/images/placeholder.webp'
            return (
              <Link
                key={a.id}
                href={`/artists/${a.slug}`}
                prefetch={false}
                scroll
                className="group block"
                aria-label={`Voir la page de ${a.name}`}
              >
                <div className="relative overflow-hidden rounded-lg border aspect-[4/3]">
                  <SmartImage
                    src={cover}
                    alt={a.name}
                    fill
                    sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    priority={idx < 3}
                  />
                </div>
                <div className="mt-2 text-center text-sm sm:text-base font-medium group-hover:text-accent transition-colors">
                  {a.name}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}