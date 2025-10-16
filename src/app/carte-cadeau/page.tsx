import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'

export const metadata: Metadata = {
  title: 'Carte cadeau — Vague',
  description:
    'Offrez une carte cadeau Vague : crédit valable sur toutes les illustrations, tirages et fichiers numériques pendant 12 mois.',
  alternates: { canonical: '/carte-cadeau' },
}

export default function GiftCardPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-12">
      <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Carte cadeau' }]} />
      <h1 className="mt-4 text-3xl font-medium tracking-tight">Carte cadeau</h1>
      <p className="mt-4 text-neutral-600">
        Offrez la liberté de choisir : la carte cadeau Vague est valable sur l’ensemble de notre catalogue, au format numérique ou
        tirage. Après l’achat, vous recevez immédiatement un PDF personnalisé à imprimer ainsi qu’un lien partageable.
      </p>

      <section className="mt-8 space-y-6">
        <div className="rounded-2xl border border-neutral-200/60 bg-white/70 p-6">
          <h2 className="text-lg font-medium">Comment ça marche&nbsp;?</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-neutral-600">
            <li>Choisissez le montant (de 50€ à 500€) et ajoutez la carte au panier.</li>
            <li>Personnalisez le message et la date d’envoi lors du paiement.</li>
            <li>Le bénéficiaire reçoit un code unique valable 12 mois sur vague.art.</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-neutral-200/60 bg-white/70 p-6">
          <h2 className="text-lg font-medium">Avantages</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li>Utilisable en plusieurs fois jusqu’à épuisement du solde.</li>
            <li>Compatible avec les éditions limitées, cadres et licences numériques.</li>
            <li>Support client dédié pour toute question ou extension de validité.</li>
          </ul>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/artworks?sort=recent"
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Choisir un montant
        </Link>
        <Link href="/contact" className="text-sm text-accent underline-offset-4 hover:underline">
          Besoin d’une carte entreprise ?
        </Link>
      </div>
    </div>
  )
}
