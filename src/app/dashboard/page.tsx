import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import LogoutButton from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getAuthSession()
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard')
  }

  const { user } = session
  const isAdmin = user.role === 'admin'

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Bonjour{user.name ? ` ${user.name}` : ''}! Vous êtes connecté en tant que <strong>{user.role}</strong>.
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-6 space-y-4">
        {user.artistSlugs.length > 0 ? (
          <div className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold uppercase text-neutral-500">Vos artistes</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
              {user.artistSlugs.map((slug) => (
                <li key={slug}>
                  <Link href={`/artists/${slug}`} className="underline underline-offset-4">
                    {slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Aucun artiste n&apos;est encore rattaché à votre compte. Contactez un administrateur pour obtenir l&apos;accès.
          </div>
        )}

        {user.artistSlugs.length > 0 ? (
          <div className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold uppercase text-neutral-500">Gérer mes œuvres</h2>
            <p className="mt-2 text-sm text-neutral-700">
              Mets à jour les visuels et les informations des œuvres associées à tes artistes.
            </p>
            <Link
              href="/dashboard/works"
              className="mt-3 inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
            >
              Ouvrir l’éditeur
            </Link>
          </div>
        ) : null}

        {isAdmin ? (
          <div className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold uppercase text-neutral-500">Raccourcis admin</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
              <li>
                <Link href="/admin" className="underline underline-offset-4">
                  Ouvrir le back-office complet
                </Link>
              </li>
              <li>
                <Link href="/admin/artists" className="underline underline-offset-4">
                  Gérer les artistes
                </Link>
              </li>
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
