export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function formatUser(label?: { name?: string | null; email?: string | null }) {
  if (!label) return 'Compte supprimé'
  if (label.name && label.email) return `${label.name} (${label.email})`
  return label.email ?? label.name ?? 'Utilisateur inconnu'
}

function truncate(text: string | null | undefined, max = 90) {
  if (!text) return '—'
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

export default async function AdminLogsPage() {
  const session = await getAuthSession()

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/logs')
  }
  if (session.user.role !== 'admin') {
    redirect('/admin?error=not_authorized')
  }

  const events = await prisma.loginEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  const totalEvents = events.length
  const uniqueUsers = new Set(events.map((evt) => evt.userId)).size
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <AdminPageHeader
        title="Historique des connexions"
        subtitle="Liste des 200 dernières connexions auteurs et administrateurs, avec IP et agent."
        actions={[{ type: 'link', href: '/admin', label: '← Retour admin' }]}
      />

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Connexions suivies</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{totalEvents}</p>
          <p className="mt-1 text-xs text-neutral-500">Dernières entrées affichées</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Comptes distincts</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{uniqueUsers}</p>
          <p className="mt-1 text-xs text-neutral-500">Utilisateurs sur cette période</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Actualisation</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {events[0] ? formatter.format(events[0].createdAt) : '—'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Dernière connexion enregistrée</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white/70 p-6 text-sm text-neutral-500">
          Aucun événement enregistré pour le moment. Les connexions apparaîtront ici dès la prochaine authentification.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white/90 shadow-sm">
          <div className="max-h-[600px] overflow-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Utilisateur</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-700">{formatter.format(event.createdAt)}</td>
                    <td className="px-4 py-3 text-neutral-900">{formatUser(event.user)}</td>
                    <td className="px-4 py-3 text-neutral-700">{event.ip ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{truncate(event.userAgent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
            {totalEvents >= 200
              ? 'Affichage limité aux 200 dernières entrées. Utilise Prisma ou SQL pour un historique complet.'
              : 'Historique complet pour la période enregistrée.'}
          </div>
        </div>
      )}
    </div>
  )
}
