// src/app/artists/page.tsx
import Link from 'next/link'
import SmartImage from '@/components/SmartImage'
import Breadcrumb from '@/components/Breadcrumb'
import { prisma } from '@/lib/prisma'

const PLACEHOLDER_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="810">
       <rect width="100%" height="100%" fill="#f3f4f6"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
             font-size="32" fill="#9ca3af">Aperçu indisponible</text>
     </svg>`
  );

export const dynamic = 'force-dynamic'

export default async function ArtistsPage() {
  // Récupère les artistes directement via Prisma
  const artists = await prisma.artist.findMany({
    where: { deletedAt: null, isArchived: false, isHidden: false },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      portrait: true,
      bio: true,
      socials: true,
    },
  });

  // Filtre les entrées incomplètes pour éviter un rendu cassé
  const safe = artists.filter(a => a && a.slug && a.name)

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Artistes' }]} />
      <header className="mt-6 mb-8">
        <h1 className="mt-3 text-3xl sm:text-[2.4rem] font-semibold tracking-tight text-accent-300">Nos Artistes</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Rencontres, inspirations et profils mis à jour en continu. Chaque artiste bénéficie d’un espace dédié pour raconter son univers et présenter ses œuvres disponibles.
        </p>
      </header>

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
        <ul className="space-y-6">
          {safe.map((a) => {
            const portrait = a.portrait || a.image || PLACEHOLDER_DATA_URL
            const rawBio = typeof (a as any).bio === 'string' ? (a as any).bio.trim() : ''
            const bio = rawBio.length > 0 ? rawBio : 'Biographie à venir.'
            return (
              <li key={a.id}>
                <Link
                  href={`/artists/${a.slug}`}
                  className="group block rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-[#f9fbff] via-white to-[#edf3ff] shadow-[0_18px_28px_rgba(15,23,42,0.10)] transition-transform hover:-translate-y-[2px] hover:shadow-[0_26px_40px_rgba(15,23,42,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-label={`Voir la page de ${a.name}`}
                >
                  <div className="flex min-h-[176px] flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
                    <div className="relative w-full overflow-hidden rounded-[18px] border border-accent/40 bg-white/80 shadow-inner sm:w-[220px] sm:flex-none">
                      <div className="relative aspect-square w-full sm:aspect-[4/5]">
                        <SmartImage
                          src={portrait}
                          alt={`Portrait de ${a.name}`}
                          fill
                          sizes="(min-width: 640px) 220px, 100vw"
                          className="object-contain"
                          wrapperClassName="relative h-full w-full"
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 text-neutral-600">
                      <h2 className="text-lg font-semibold text-neutral-900 transition-colors group-hover:text-accent">{a.name}</h2>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-neutral-600 line-clamp-3">
                        {bio}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3 text-right sm:min-w-[180px]">
                      <span className="text-[11px] uppercase tracking-[0.28em] text-accent-900">Découvrir</span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-accent/60 bg-white/80 px-3 py-1 text-sm font-semibold text-accent shadow-sm transition group-hover:bg-accent group-hover:text-neutral-900">Voir le profil<span aria-hidden>→</span></span>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
