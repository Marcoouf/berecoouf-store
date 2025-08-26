'use client'

import { useState, useEffect } from 'react'

export default function AdminLogin() {
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [next, setNext] = useState<string>('/admin')

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const n = q.get('next')
    if (n && n.startsWith('/')) setNext(n)
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!key) return

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })

    const data = await res.json().catch(() => ({}))
    if (res.ok && data?.ok) {
      window.location.href = next
    } else {
      setError(data?.error || 'Échec de la connexion')
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Connexion Admin</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Admin Key</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Saisis ta clé admin"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-dark"
        >
          Se connecter
        </button>
      </form>
    </div>
  )
}
