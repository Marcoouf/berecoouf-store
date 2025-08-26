'use client'
import { useState } from 'react'

export default function AdminLogin() {
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    if (res.ok) {
      const next = new URLSearchParams(location.search).get('next') || '/admin'
      location.href = next
    } else {
      const j = await res.json().catch(() => ({}))
      setError(j?.error ?? 'Échec de connexion')
    }
  }

  return (
    <div className="mx-auto max-w-sm p-8">
      <h1 className="text-xl font-medium mb-4">Connexion admin</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          className="w-full rounded border px-3 py-2"
          autoFocus
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="rounded bg-black px-3 py-2 text-white">Se connecter</button>
      </form>
    </div>
  )
}