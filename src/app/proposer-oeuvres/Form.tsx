'use client'

import { useState, type FormEvent } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

type ArtistFormData = {
  name: string
  email: string
  portfolio: string
  social: string
  city: string
  works: string
  message: string
}

const initialForm: ArtistFormData = {
  name: '',
  email: '',
  portfolio: '',
  social: '',
  city: '',
  works: '',
  message: '',
}

export default function ArtistApplyForm() {
  const [form, setForm] = useState<ArtistFormData>(initialForm)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const update = (key: keyof ArtistFormData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (status === 'loading') return
    setStatus('loading')
    setError(null)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (file) fd.append('portfolioFile', file)

      const res = await fetch('/api/artist-apply', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Impossible d’envoyer le formulaire. Réessayez plus tard.')
      }
      setStatus('success')
      setForm(initialForm)
      setFile(null)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Erreur inattendue. Réessayez plus tard.')
    }
  }

  return (
    <section className="rounded-3xl bg-white/90 px-6 py-8 shadow-lg ring-1 ring-neutral-200/70 backdrop-blur">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-800" htmlFor="name">
              Nom et prénom *
            </label>
            <input
              id="name"
              name="name"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="Ex. Camille Dupont"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-800" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="vous@domaine.fr"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-800" htmlFor="portfolio">
              Portfolio / site
            </label>
            <input
              id="portfolio"
              name="portfolio"
              value={form.portfolio}
              onChange={(e) => update('portfolio', e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="https://votre-portfolio.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-800" htmlFor="social">
              Réseaux (Instagram, Behance…)
            </label>
            <input
              id="social"
              name="social"
              value={form.social}
              onChange={(e) => update('social', e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="@votreprofil ou lien direct"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-800" htmlFor="city">
              Ville / pays d’envoi
            </label>
            <input
              id="city"
              name="city"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="Ex. Lyon, France"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-800" htmlFor="works">
              Types d’œuvres / techniques
            </label>
            <input
              id="works"
              name="works"
              value={form.works}
              onChange={(e) => update('works', e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="Illustration, photo, gravure..."
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-800" htmlFor="portfolioFile">
            Joindre un PDF (portfolio)
          </label>
          <input
            id="portfolioFile"
            name="portfolioFile"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-800"
          />
          <p className="text-xs text-neutral-600">PDF uniquement, 5 Mo max.</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-800" htmlFor="message">
            Présentez votre démarche et ce que vous souhaitez vendre *
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            placeholder="Quelques lignes sur votre travail, vos attentes et vos délais d’envoi."
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
        ) : null}
        {status === 'success' ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Merci ! Votre demande a bien été envoyée. Nous revenons vers vous dès que possible.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === 'loading' ? 'Envoi en cours...' : 'Envoyer ma demande'}
          </button>
          <p className="text-xs text-neutral-600">
            Vous pouvez aussi écrire directement à{' '}
            <a className="font-semibold text-neutral-900" href="mailto:contact@vague-galerie.store">
              contact@vague-galerie.store
            </a>
            .
          </p>
        </div>
      </form>
    </section>
  )
}
