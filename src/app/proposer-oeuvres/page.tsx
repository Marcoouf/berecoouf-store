import Link from 'next/link'
import ArtistApplyForm from './Form'

export const metadata = {
  title: 'Proposer vos œuvres | VAGUE',
  description:
    'Formulaire pour les artistes qui souhaitent proposer leurs œuvres sur VAGUE et rejoindre une sélection à taille humaine.',
}

export default function ProposerOeuvresPage() {
  return (
    <main className="relative overflow-hidden bg-neutral-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-8 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-[6%] bottom-10 h-72 w-72 rounded-full bg-ink/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-14 sm:py-18 space-y-12">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Proposer vos œuvres
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight text-neutral-900">
            Rejoindre la sélection VAGUE
          </h1>
          <p className="max-w-3xl text-base text-neutral-600">
            Un formulaire rapide pour présenter votre travail, partager vos liens et expliquer ce que vous souhaitez proposer. Nous revenons
            vers vous dès que possible.
          </p>
        </header>

        <ArtistApplyForm />

        <div className="rounded-2xl bg-white/80 px-6 py-5 shadow-lg ring-1 ring-neutral-200/70 backdrop-blur flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">Envie d’en savoir plus avant de proposer vos œuvres ?</p>
            <p className="text-sm text-neutral-700">Relisez la démarche complète et le cadre contractuel.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/notre-demarche-auteurs"
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              Découvrir la démarche
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-900 px-5 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
