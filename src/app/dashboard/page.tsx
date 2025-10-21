import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LogoutButton from '@/components/LogoutButton'
import CopyPublicLinkButton from './components/CopyPublicLinkButton'
import Image from '@/components/SmartImage'
import { euro } from '@/lib/format'

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getAuthSession()
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard')
  }

  const { user } = session
  const isAdmin = user.role === 'admin'
  const artistIds = Array.isArray(user.artistIds) ? user.artistIds : []

  const artists = artistIds.length
    ? await prisma.artist.findMany({
        where: { id: { in: artistIds } },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          bio: true,
          portrait: true,
          image: true,
        },
      })
    : []

  const works = artistIds.length
    ? await prisma.work.findMany({
        where: { artistId: { in: artistIds } },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          updatedAt: true,
          published: true,
          artist: { select: { name: true } },
        },
      })
    : []

  const publishedCount = works.filter((w) => w.published).length
  const draftCount = works.length - publishedCount

  const loginEvents = await prisma.loginEvent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const heroArtist = artists[0] ?? null
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '') || 'https://point-bleu.vercel.app'
  const publicUrl = heroArtist ? `${baseUrl}/artists/${heroArtist.slug}` : baseUrl

  const recentActivities = works
    .slice(0, 6)
    .map((work) => ({
      id: `work-${work.id}`,
      date: work.updatedAt,
      label: `${work.title} · ${work.published ? 'publié' : 'brouillon'}`,
      description: work.artist?.name ?? '',
    }))

  const stats = [
    { id: 'published', label: 'Œuvres publiées', value: publishedCount.toString(), helper: 'Visibles sur point-bleu.fr' },
    { id: 'drafts', label: 'Brouillons', value: draftCount.toString(), helper: 'En cours de préparation' },
    {
      id: 'last-event',
      label: 'Dernière activité',
      value: loginEvents[0] ? formatDate(loginEvents[0].createdAt) : '—',
      helper: loginEvents[0]?.ip ? `IP ${loginEvents[0].ip}` : 'Aucune connexion récente',
    },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-10">
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-accent-100 via-white to-white p-6 sm:p-8">
        <div className="absolute right-6 top-6 hidden text-6xl opacity-20 sm:block">✶</div>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-white/70 bg-white shadow-lg">
            {heroArtist?.portrait || heroArtist?.image ? (
              <Image
                src={heroArtist.portrait || heroArtist.image || ''}
                alt={heroArtist?.name ?? 'Portrait artiste'}
                fill
                wrapperClassName="absolute inset-0"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-accent text-ink">{user.name?.[0] ?? 'A'}</div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-600">
              Auteur certifié
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              {user.name ?? heroArtist?.name ?? 'Espace auteur'}
            </h1>
            {heroArtist?.bio ? (
              <p className="max-w-2xl text-sm text-neutral-600 line-clamp-3">{heroArtist.bio}</p>
            ) : (
              <p className="text-sm text-neutral-500">Complète ton profil pour raconter ton univers et attirer les collectionneurs.</p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-ink/90"
              >
                ✏️ Mettre à jour mon profil
              </Link>
              <Link
                href="/dashboard/works"
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-4 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
              >
                🎨 Gérer mes œuvres
              </Link>
              <CopyPublicLinkButton url={publicUrl} />
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-neutral-400">Connecté en tant que {user.email ?? 'compte auteur'} • rôle {user.role}</div>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">En un coup d’œil</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {stats.map((card) => (
            <div key={card.id} className="rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-sm">
              <div className="text-xs uppercase tracking-[0.25em] text-neutral-400">{card.label}</div>
              <div className="mt-3 text-3xl font-semibold text-neutral-900">{card.value}</div>
              <p className="mt-2 text-xs text-neutral-500">{card.helper}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-neutral-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Activité récente</h2>
            <span className="text-xs text-neutral-400">{recentActivities.length ? 'Derniers événements' : 'Aucune activité'}</span>
          </div>
          <ul className="mt-4 space-y-4">
            {recentActivities.length === 0 ? (
              <li className="rounded-lg border border-dashed border-neutral-200 p-4 text-sm text-neutral-500">
                Ajoute une œuvre ou connecte-toi pour voir ton activité ici.
              </li>
            ) : (
              recentActivities.map((activity) => (
                <li key={activity.id} className="flex gap-3 rounded-xl border border-neutral-100 bg-white/70 p-4">
                  <div className="mt-0.5 text-lg">🗓️</div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900">{activity.label}</div>
                    <div className="text-xs text-neutral-500">{formatDate(activity.date)}</div>
                    {activity.description ? (
                      <div className="mt-1 text-xs text-neutral-500">{activity.description}</div>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Raccourcis</h2>
            <div className="mt-4 grid gap-3">
              <Link
                href="/dashboard/works?view=create"
                className="flex items-center justify-between rounded-2xl bg-accent-100 px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-accent-200"
              >
                <span>➕ Ajouter une nouvelle œuvre</span>
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/dashboard/works"
                className="flex items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                <span>🖼️ Mettre à jour un visuel</span>
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/dashboard/profile"
                className="flex items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                <span>📝 Mettre à jour ma bio</span>
                <span aria-hidden>→</span>
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="flex items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  <span>⚙️ Accéder à l’admin complète</span>
                  <span aria-hidden>→</span>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Mes artistes</h2>
            {artists.length === 0 ? (
              <p className="mt-3 text-xs text-amber-700">
                Aucun artiste n’est rattaché à ce compte. Contacte un administrateur pour débloquer l’accès.
              </p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm text-neutral-700">
                {artists.map((artist) => (
                  <li key={artist.id} className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-neutral-900">{artist.name}</div>
                      <Link href={`/artists/${artist.slug}`} className="text-xs text-accent underline underline-offset-4">
                        Voir la page publique
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <LogoutButton />
      </div>
    </div>
  )
}
