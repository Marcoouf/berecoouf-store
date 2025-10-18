'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

type ArtistProfile = {
  id: string
  name: string
  slug: string
  bio: string | null
  socials: string[]
  image: string | null
  portrait: string | null
  contactEmail: string | null
  handle: string | null
}

type FormState = {
  name: string
  bio: string
  contactEmail: string
  handle: string
  socials: string[]
  image: string
  portrait: string
}

function buildForm(artist: ArtistProfile): FormState {
  return {
    name: artist.name ?? '',
    bio: artist.bio ?? '',
    contactEmail: artist.contactEmail ?? '',
    handle: artist.handle ?? '',
    socials: Array.isArray(artist.socials) && artist.socials.length > 0 ? artist.socials.slice() : [''],
    image: artist.image ?? '',
    portrait: artist.portrait ?? '',
  }
}

async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json()
}

async function uploadImage(file: File, hint: string) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('hint', hint)
  const res = await fetch('/api/author/uploads', {
    method: 'POST',
    body: fd,
  })
  const data = await res.json()
  if (!res.ok || !data?.ok || !data?.url) {
    throw new Error(data?.error || 'Upload échoué')
  }
  return data.url as string
}

export default function AuthorProfilePage() {
  const [artists, setArtists] = useState<ArtistProfile[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedArtist = useMemo(() => artists.find((a) => a.id === selectedId) ?? null, [artists, selectedId])

  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadingPortrait, setUploadingPortrait] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setLoadingList(true)
      setListError(null)
      try {
        const data = await fetchJSON<ArtistProfile[] | { ok?: boolean; error?: string }>('/api/author/artists')
        if (!active) return

        if (Array.isArray(data)) {
          setArtists(data)
          setSelectedId((current) => {
            if (current && data.some((artist) => artist.id === current)) return current
            return data[0]?.id ?? null
          })
        } else {
          throw new Error((data as any)?.error || 'Impossible de charger les artistes')
        }
      } catch (err: any) {
        if (!active) return
        setListError(err?.message || 'Impossible de charger les artistes')
      } finally {
        if (active) setLoadingList(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedArtist) {
      setForm(null)
      return
    }
    setForm(buildForm(selectedArtist))
    setMessage(null)
    setError(null)
  }, [selectedArtist])

  const handleField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setMessage(null)
    setError(null)
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSocialChange = (index: number, value: string) => {
    setMessage(null)
    setError(null)
    setForm((prev) => {
      if (!prev) return prev
      const socials = prev.socials.slice()
      socials[index] = value
      return { ...prev, socials }
    })
  }

  const addSocial = () => {
    setForm((prev) => {
      if (!prev) return prev
      return { ...prev, socials: [...prev.socials, ''] }
    })
  }

  const removeSocial = (index: number) => {
    setForm((prev) => {
      if (!prev) return prev
      const socials = prev.socials.filter((_, i) => i !== index)
      return { ...prev, socials: socials.length > 0 ? socials : [''] }
    })
  }

  async function handleUpload(kind: 'portrait' | 'image', file: File) {
    if (!selectedArtist) return
    const hint = `${selectedArtist.slug}-${kind}`
    try {
      setError(null)
      setMessage(null)
      if (kind === 'portrait') setUploadingPortrait(true)
      else setUploadingCover(true)
      const url = await uploadImage(file, hint)
      handleField(kind, url)
      setMessage(kind === 'portrait' ? 'Portrait mis à jour ✅' : 'Image de couverture mise à jour ✅')
    } catch (err: any) {
      setError(err?.message || 'Upload impossible')
    } finally {
      if (kind === 'portrait') setUploadingPortrait(false)
      else setUploadingCover(false)
    }
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedArtist || !form) return
    setSaving(true)
    setError(null)
    setMessage(null)

    const socials = form.socials
      .map((entry) => entry.trim())
      .filter((entry, index, array) => entry.length > 0 && array.indexOf(entry) === index)

    const payload = {
      name: form.name.trim(),
      bio: form.bio.trim() || null,
      contactEmail: form.contactEmail.trim() || null,
      handle: form.handle.trim() || null,
      socials,
      image: form.image.trim() || null,
      portrait: form.portrait.trim() || null,
    }

    try {
      const res = await fetch(`/api/author/artists/${selectedArtist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || data?.ok === false || !data?.artist) {
        throw new Error(data?.error || 'Enregistrement impossible')
      }

      const updated = data.artist as ArtistProfile
      setMessage('Profil enregistré ✅')
      setArtists((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)))
      setForm(buildForm(updated))
    } catch (err: any) {
      setError(err?.message || 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <AdminPageHeader
        title="Mon profil artiste"
        subtitle="Mets à jour les informations publiques affichées sur ta page artiste."
        actions={[
          { type: 'link', href: '/dashboard', label: '← Retour au tableau de bord' },
        ]}
      />

      {loadingList ? (
        <div className="rounded-lg border p-4 text-sm text-neutral-500">Chargement de tes artistes…</div>
      ) : listError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{listError}</div>
      ) : artists.length === 0 ? (
        <div className="rounded-lg border p-4 text-sm text-neutral-600">
          Aucun artiste n’est associé à ton compte pour le moment. Contacte un administrateur pour obtenir un accès.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
            <div className="mb-3 text-xs font-semibold uppercase text-neutral-500">Artistes</div>
            <div className="flex flex-col gap-2">
              {artists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => setSelectedId(artist.id)}
                  className={[
                    'rounded-md border px-3 py-2 text-left text-sm transition',
                    artist.id === selectedId
                      ? 'border-ink bg-ink text-white shadow'
                      : 'border-neutral-200 bg-white hover:border-neutral-300',
                  ].join(' ')}
                >
                  <div className="font-medium">{artist.name}</div>
                  <div className="text-xs text-neutral-400">@{artist.slug}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm">
            {form ? (
              <form className="space-y-6" onSubmit={onSave}>
                {message ? (
                  <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {message}
                  </div>
                ) : null}
                {error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Nom affiché</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleField('name', e.target.value)}
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Contact</label>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => handleField('contactEmail', e.target.value)}
                      placeholder="artiste@example.com"
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                    />
                    <p className="mt-1 text-xs text-neutral-400">
                      Adresse utilisée pour les notifications de ventes.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Handle / pseudo</label>
                    <input
                      type="text"
                      value={form.handle}
                      onChange={(e) => handleField('handle', e.target.value)}
                      placeholder="Ex. @vague"
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Réseaux sociaux</label>
                    <div className="space-y-2">
                      {form.socials.map((entry, index) => (
                        <div key={`social-${index}`} className="flex items-center gap-2">
                          <input
                            type="url"
                            value={entry}
                            onChange={(e) => handleSocialChange(index, e.target.value)}
                            placeholder="https://instagram.com/monprofil"
                            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                          />
                          <button
                            type="button"
                            onClick={() => removeSocial(index)}
                            className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                          >
                            Retirer
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addSocial}
                      className="mt-2 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                    >
                      + Ajouter un lien
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700">Biographie</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => handleField('bio', e.target.value)}
                    rows={6}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                  />
                  <p className="mt-1 text-xs text-neutral-400">
                    Cette description apparaît sur ta page artiste.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-neutral-200 p-4">
                    <h3 className="text-sm font-semibold text-neutral-700">Portrait</h3>
                    {form.portrait ? (
                      <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                        <Image
                          src={form.portrait}
                          alt=""
                          width={320}
                          height={320}
                          className="h-32 w-32 rounded-lg object-cover"
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-neutral-500">Aucun portrait défini.</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <input
                        type="url"
                        placeholder="https://…"
                        value={form.portrait}
                        onChange={(e) => handleField('portrait', e.target.value)}
                        className="w-full flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                      />
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUpload('portrait', file)
                          }}
                        />
                        {uploadingPortrait ? 'Upload…' : 'Téléverser'}
                      </label>
                    </div>
                  </div>

                  <div className="rounded-lg border border-neutral-200 p-4">
                    <h3 className="text-sm font-semibold text-neutral-700">Image de couverture</h3>
                    {form.image ? (
                      <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                        <Image
                          src={form.image}
                          alt=""
                          width={600}
                          height={340}
                          className="h-32 w-full rounded-lg object-cover"
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-neutral-500">Aucune image de couverture définie.</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <input
                        type="url"
                        placeholder="https://…"
                        value={form.image}
                        onChange={(e) => handleField('image', e.target.value)}
                        className="w-full flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                      />
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUpload('image', file)
                          }}
                        />
                        {uploadingCover ? 'Upload…' : 'Téléverser'}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-60"
                  >
                    {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                  </button>
                  {selectedArtist ? (
                    <Link
                      href={`/artists/${selectedArtist.slug}`}
                      className="text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
                    >
                      Voir la page publique
                    </Link>
                  ) : null}
                </div>
              </form>
            ) : (
              <div className="text-sm text-neutral-500">Sélectionne un artiste à modifier.</div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
