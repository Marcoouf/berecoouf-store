'use client'

import { useEffect, useMemo, useState } from 'react'

type ArtistOption = { id: string; name: string; slug: string }
type AuthorRow = {
  id: string
  email: string
  name?: string | null
  artistIds: string[]
  artists: { id: string; name: string; slug: string }[]
}

type AuthorForm = {
  id?: string
  email: string
  name: string
  password: string
  confirm: string
  artistIds: string[]
}

async function fetchAuthors(): Promise<AuthorRow[]> {
  const res = await fetch('/api/admin/authors', { cache: 'no-store' })
  if (!res.ok) throw new Error('Impossible de charger les auteurs.')
  return res.json()
}

async function fetchAuthor(id: string): Promise<AuthorRow> {
  const res = await fetch(`/api/admin/authors/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Auteur introuvable.')
  return res.json()
}

async function fetchArtists(): Promise<ArtistOption[]> {
  const res = await fetch('/api/admin/artists', { cache: 'no-store' })
  if (!res.ok) throw new Error('Impossible de charger les artistes.')
  const data = await res.json()
  return Array.isArray(data)
    ? data.map((a: any) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
      }))
    : []
}

async function createAuthor(payload: { email: string; name?: string; password: string; artistIds: string[] }) {
  const res = await fetch('/api/admin/authors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Création impossible')
  return data as AuthorRow
}

async function updateAuthor(id: string, payload: Partial<{ name: string | null; password: string; artistIds: string[] }>) {
  const res = await fetch(`/api/admin/authors/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Mise à jour impossible')
  return data
}

async function deleteAuthor(id: string) {
  const res = await fetch(`/api/admin/authors/${encodeURIComponent(id)}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Suppression impossible')
  return data
}

const emptyForm = (email = ''): AuthorForm => ({
  id: undefined,
  email,
  name: '',
  password: '',
  confirm: '',
  artistIds: [],
})

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<AuthorRow[]>([])
  const [artists, setArtists] = useState<ArtistOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AuthorForm | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const [authorsList, artistsList] = await Promise.all([fetchAuthors(), fetchArtists()])
        if (!active) return
        setAuthors(authorsList)
        setArtists(artistsList)
        setError(null)
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Erreur de chargement')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const isEditing = Boolean(editing?.id)

  const selectedArtists = useMemo(() => {
    const map = new Map(artists.map((a) => [a.id, a]))
    return editing?.artistIds.map((id) => map.get(id)?.name || id) ?? []
  }, [editing?.artistIds, artists])

  const openCreate = () => {
    setEditing(emptyForm())
  }

  const openEdit = async (id: string) => {
    try {
      const detail = await fetchAuthor(id)
      setEditing({
        id: detail.id,
        email: detail.email,
        name: detail.name ?? '',
        password: '',
        confirm: '',
        artistIds: detail.artistIds || [],
      })
    } catch (err: any) {
      alert(err?.message || 'Impossible de charger cet auteur')
    }
  }

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    if (!editing) return
    if (!editing.email || !editing.email.includes('@')) {
      alert('Email invalide.')
      return
    }
    if (!isEditing && editing.password.length < 8) {
      alert('Mot de passe trop court (8 caractères minimum).')
      return
    }
    if (editing.password !== editing.confirm) {
      alert('Les mots de passe ne correspondent pas.')
      return
    }
    try {
      setSaving(true)
      if (isEditing && editing.id) {
        const payload: any = {
          name: editing.name?.trim() || null,
          artistIds: editing.artistIds,
        }
        if (editing.password) payload.password = editing.password
        await updateAuthor(editing.id, payload)
        const updated = await fetchAuthors()
        setAuthors(updated)
        setEditing(null)
        alert('Auteur mis à jour.')
      } else {
        await createAuthor({
          email: editing.email.trim().toLowerCase(),
          name: editing.name?.trim() || undefined,
          password: editing.password,
          artistIds: editing.artistIds,
        })
        const updated = await fetchAuthors()
        setAuthors(updated)
        setEditing(null)
        alert('Auteur créé.')
      }
    } catch (err: any) {
      alert(err?.message || 'Échec de l’enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce compte auteur ?')) return
    try {
      await deleteAuthor(id)
      setAuthors((prev) => prev.filter((a) => a.id !== id))
      if (editing?.id === id) setEditing(null)
    } catch (err: any) {
      alert(err?.message || 'Suppression impossible')
    }
  }

  const toggleArtist = (artistId: string) => {
    setEditing((prev) => {
      if (!prev) return prev
      const set = new Set(prev.artistIds)
      if (set.has(artistId)) set.delete(artistId)
      else set.add(artistId)
      return { ...prev, artistIds: Array.from(set) }
    })
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-medium">Admin · Comptes auteurs</h1>
        <button onClick={openCreate} className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-50">
          + Ajouter un auteur
        </button>
      </div>

      {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-neutral-500">Chargement…</div>
        ) : authors.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-neutral-600">Aucun auteur pour le moment.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Nom</th>
                  <th className="px-3 py-2">Artistes</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {authors.map((author) => (
                  <tr key={author.id} className="border-t text-sm">
                    <td className="px-3 py-2 font-medium">{author.email}</td>
                    <td className="px-3 py-2">{author.name || <span className="text-neutral-400">—</span>}</td>
                    <td className="px-3 py-2">
                      {author.artists.length > 0 ? (
                        <div className="flex flex-wrap gap-1 text-xs text-neutral-600">
                          {author.artists.map((a) => (
                            <span key={a.id} className="rounded-full border px-2 py-0.5">
                              {a.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-xs">Aucun artiste lié</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-xs underline" onClick={() => openEdit(author.id)}>
                          Modifier
                        </button>
                        <button className="text-xs text-red-600 underline" onClick={() => handleDelete(author.id)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => !saving && setEditing(null)}>
          <div className="w-full max-w-xl rounded-xl border bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{isEditing ? 'Modifier un auteur' : 'Nouvel auteur'}</h2>
              <button className="rounded border px-2 py-1 text-xs" onClick={() => setEditing(null)} disabled={saving}>
                Fermer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-neutral-600">Email</label>
                <input
                  type="email"
                  required
                  value={editing.email}
                  disabled={isEditing || saving}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
                  className="mt-1 w-full rounded border px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-600">Nom affiché</label>
                <input
                  type="text"
                  value={editing.name}
                  disabled={saving}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                  className="mt-1 w-full rounded border px-2 py-1 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-neutral-600">{isEditing ? 'Nouveau mot de passe' : 'Mot de passe'}</label>
                  <input
                    type="password"
                    value={editing.password}
                    disabled={saving}
                    onChange={(e) =>
                      setEditing((prev) => (prev ? { ...prev, password: e.target.value } : prev))
                    }
                    className="mt-1 w-full rounded border px-2 py-1 text-sm"
                    placeholder={isEditing ? 'Laisser vide pour conserver' : '8 caractères minimum'}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-600">Confirmation</label>
                  <input
                    type="password"
                    value={editing.confirm}
                    disabled={saving}
                    onChange={(e) => setEditing((prev) => (prev ? { ...prev, confirm: e.target.value } : prev))}
                    className="mt-1 w-full rounded border px-2 py-1 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-neutral-600">Artistes associés</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {artists.map((artist) => {
                    const checked = editing.artistIds.includes(artist.id)
                    return (
                      <label
                        key={artist.id}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                          checked ? 'border-black bg-black text-white' : 'border-neutral-300 bg-white text-neutral-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={checked}
                          onChange={() => toggleArtist(artist.id)}
                          disabled={saving}
                        />
                        {artist.name}
                      </label>
                    )
                  })}
                  {artists.length === 0 && (
                    <div className="text-xs text-neutral-500">Ajoute d’abord des artistes pour les associer.</div>
                  )}
                </div>
              </div>

              {selectedArtists.length > 0 && (
                <div className="text-xs text-neutral-500">
                  Artistes sélectionnés : {selectedArtists.join(', ')}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded border px-3 py-1.5 text-sm"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                >
                  {saving ? 'Enregistrement…' : isEditing ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
