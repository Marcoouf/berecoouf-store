'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminToolsPage() {
  const [loading, setLoading] = useState(false)
  const [dry, setDry] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const r = await fetch(`/api/admin/migrate-public-to-blob${dry ? '?dry=1' : ''}`, {
        method: 'POST',
        headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_CALL || '' },
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Erreur migration')
      setResult(j)
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-tight">Admin — Outils</h1>
        <Link href="/admin" className="text-sm underline underline-offset-4">← Retour admin</Link>
      </div>

      <div className="rounded-xl border p-4 space-y-4">
        <p className="text-sm">
          Cet outil migre les chemins locaux <code>/images/…</code> vers Vercel Blob et met à jour le catalogue.
        </p>

        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={dry} onChange={e => setDry(e.target.checked)} />
          Dry-run (simuler sans écrire)
        </label>

        <button
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-dark disabled:opacity-60"
        >
          {loading ? 'Migration…' : (dry ? 'Simuler la migration' : 'Lancer la migration')}
        </button>

        {error && <div className="text-sm text-red-600">{error}</div>}

        {result && (
          <pre className="mt-3 max-h-96 overflow-auto rounded-md border bg-neutral-50 p-3 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}