'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const params = useSearchParams()
  const callbackUrl = params?.get('callbackUrl') || '/dashboard'
  const error = params?.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    setSubmitting(true)
    setFormError(null)

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl,
    })

    setSubmitting(false)

    if (res?.error) {
      setFormError(res.error === 'invalid_credentials' ? 'Identifiants incorrects.' : 'Connexion impossible.')
      return
    }
    if (res?.ok) {
      window.location.href = res.url || callbackUrl
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur">
        <h1 className="text-xl font-semibold text-neutral-900">Connexion</h1>
        <p className="mt-1 text-sm text-neutral-500">Accède à ton espace auteur ou à l’admin.</p>

        {error === 'not_authorized' ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Ton compte n’est pas encore associé à un artiste. Contacte un administrateur.
          </div>
        ) : null}

        {formError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm text-neutral-600">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-neutral-600">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-4 text-xs text-neutral-400">
          Besoin d’un accès ? Contacte l’équipe pour recevoir un compte auteur ou un mot de passe.
        </p>
      </div>
    </div>
  )
}
