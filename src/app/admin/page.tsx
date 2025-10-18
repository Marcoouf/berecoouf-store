'use client'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

const cards = [
  {
    title: 'Gérer les œuvres',
    description: 'Créer une nouvelle fiche, modifier les formats, mettre à jour les visuels.',
    href: '/admin/works',
  },
  {
    title: 'Gérer les artistes',
    description: 'Met à jour la bio, la photo de profil, la couverture et les réseaux sociaux.',
    href: '/admin/artists',
  },
  {
    title: 'Comptes auteurs',
    description: 'Création des accès, réinitialisation des mots de passe et rattachement artistes.',
    href: '/admin/authors',
  },
  {
    title: 'Outils & maintenance',
    description: 'Scripts utilitaires (ex. migration vers Blob) et opérations ponctuelles.',
    href: '/admin/tools',
  },
]

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <AdminPageHeader
        title="Administration"
        subtitle="Choisis une section pour éditer les œuvres, les artistes ou les comptes auteurs."
        actions={[
          { type: 'link', href: '/', label: '← Retour au site' },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-2">
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-neutral-200 bg-white/70 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-neutral-900">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              {card.description}
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-accent group-hover:text-accent-dark">
              Accéder à la section →
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-10 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
        <p>
          Besoin d’un autre compte auteur ? Crée-le via <strong>Comptes auteurs</strong>,
          puis rattache-le à l’artiste correspondant pour lui donner accès à son espace.
        </p>
        <p>
          Pour gérer les visuels (portrait ou couverture), rends-toi sur la page <strong>Artistes</strong> :
          chaque modification se reflète automatiquement sur la page publique de l’artiste.
        </p>
      </section>
    </div>
  )
}
