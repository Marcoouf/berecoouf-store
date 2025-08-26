'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AdminLoginPage() {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [show, setShow] = useState(false)
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') || '/admin'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    try {
      const maskedKey = key.length > 2 ? '*'.repeat(key.length - 2) + key.slice(-2) : key
      console.log('Tentative de connexion avec la clé :', maskedKey)

      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      const j = await r.json().catch(() => ({}))
      console.log('Réponse API:', { status: r.status, body: j })
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || `HTTP ${r.status}`)
      }
      router.replace(next)
    } catch (e: any) {
      setErr(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-medium tracking-tight">Connexion admin</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Clé admin</label>
          <div className="flex items-center">
            <input
              type={show ? 'text' : 'password'}
              className="w-full rounded-md border px-3 py-2 text-sm"
              autoFocus
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="Entrez la clé…"
              autoComplete="off"
              spellCheck={false}
              required
              aria-invalid={!!err}
              aria-describedby={err ? 'login-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="ml-2 rounded border px-2 py-1 text-sm select-none"
              aria-label={show ? 'Masquer la clé' : 'Afficher la clé'}
            >
              {show ? '🙈' : '👁'}
            </button>
          </div>
        </div>
        {err && (
          <p id="login-error" role="alert" aria-live="polite" className="text-sm text-red-600">
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !key}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink disabled:opacity-50 hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}