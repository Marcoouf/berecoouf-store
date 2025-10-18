'use client'
export const dynamic = 'force-dynamic'

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

type Toast = { id: string; kind: 'success' | 'error' | 'info'; msg: string }
type FormatRow = { id: string; label: string; price: number }

type ArtworkDraft = {
  id: string
  slug: string
  title: string
  artistId: string
  image: string
  mockup?: string
  price: number
  description?: string
  year?: number
  technique?: string
  paper?: string
  size?: string
  edition?: string
  formats?: FormatRow[]
}

const artistsForSelect = [
  { value: 'a-Couf', label: 'Marcouf Lebar' },
  { value: 'b-Béré', label: 'Bérénice Duchemain' },
  { value: 'c-Cam',  label: 'Camille Dubois' },
]

function safeSlug(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function uid(prefix = 'w') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function AdminPageInner() {
  // Accès sécurisé côté serveur via middleware + cookie HttpOnly (voir /admin/login et middleware)

  const [value, set] = useState<ArtworkDraft>({
    id: uid(),
    slug: '',
    title: '',
    artistId: artistsForSelect[0].value,
    image: '',
    mockup: '',
    price: 0,
    description: '',
    year: undefined,
    technique: '',
    paper: '',
    size: '',
    edition: '',
    formats: [
      { id: uid('f'), label: 'A3 — 297×420mm', price: 120 },
      { id: uid('f'), label: 'A2 — 420×594mm', price: 180 },
      { id: uid('f'), label: 'A1 — 594×841mm', price: 220 },
    ],
  })

  const [existing, setExisting] = useState<ArtworkDraft[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Toasts + progression upload
  const [toasts, setToasts] = useState<Toast[]>([])
  const [imgProgress, setImgProgress] = useState(0)
  const [mockProgress, setMockProgress] = useState(0)

function addToast(kind: Toast['kind'], msg: string) {
  const id = Math.random().toString(36).slice(2, 8)
  setToasts(t => [...t, { id, kind, msg }])
  setTimeout(() => {
    setToasts(t => t.filter(x => x.id !== id))
  }, 4000)
}

  // Admin key helpers (client)
  function getAdminKey() {
    const k = process.env.NEXT_PUBLIC_ADMIN_KEY as string | undefined
    return (k && k.trim().length > 0) ? k : undefined
  }
  function adminHeaders(extra: Record<string, string> = {}) {
    const k = getAdminKey()
    return {
      ...extra,
      ...(k ? { 'x-admin-key': k } : {}),
    }
  }

  useEffect(() => {
    let active = true
    fetch('/api/catalog')
      .then(r => r.json())
      .then(data => {
        if (!active) return
        const arr = Array.isArray(data?.artworks) ? data.artworks : []
        setExisting(arr)
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  // ------ helper: recharger la liste depuis /api/catalog ------
  async function refreshExisting() {
    try {
      const r = await fetch('/api/catalog', { cache: 'no-store' })
      const data = await r.json()
      const arr = Array.isArray(data?.artworks) ? data.artworks : []
      setExisting(arr)
    } catch {}
  }

  const setField = <K extends keyof ArtworkDraft>(k: K, v: ArtworkDraft[K]) =>
    set(prev => ({ ...prev, [k]: v }))

  const derivedSlug = useMemo(() => {
    if (value.slug?.trim()) return value.slug
    return safeSlug(value.title || value.id)
  }, [value.slug, value.title, value.id])

  // Upload image -> appelle /api/upload
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadWithProgress(
  file: File,
  kind: 'artwork' | 'mockup',
  onProgress: (p: number) => void
) {
  return new Promise<{ ok: boolean; url?: string; path?: string; error?: string }>((resolve) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    fd.append('originalName', file.name || 'image')

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload', true)
    // Pass admin auth to the API (header) and mark as XHR
    const adminKey = getAdminKey()
    if (!adminKey) {
      addToast('error', 'Clé admin manquante côté client (NEXT_PUBLIC_ADMIN_KEY)')
    } else {
      xhr.setRequestHeader('x-admin-key', adminKey)
    }
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
    // Ask XHR to parse JSON for us when supported
    try { xhr.responseType = 'json' } catch {}
    xhr.withCredentials = true
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const p = Math.round((evt.loaded / evt.total) * 100)
        onProgress(p)
      }
    }
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        try {
          const res: any = (xhr.responseType === 'json' ? xhr.response : JSON.parse(xhr.responseText || '{}')) || {}
          if (xhr.status >= 200 && xhr.status < 300 && (res?.url || res?.path)) {
            resolve({ ok: true, url: res.url, path: res.path })
          } else {
            const msg = res?.error || res?.message || (xhr.status ? `HTTP ${xhr.status}` : 'Réponse invalide')
            resolve({ ok: false, error: msg })
          }
        } catch (e) {
          resolve({ ok: false, error: 'Réponse invalide' })
        }
      }
    }
    xhr.onerror = () => resolve({ ok: false, error: 'Erreur réseau' })
    xhr.send(fd)
  })
}
  
  function chooseFile() {
    fileRef.current?.click()
  }
async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const f = e.target.files?.[0]
  if (!f) return
  setUploading(true)
  setUploadError(null)
  setImgProgress(0)
  try {
    const json = await uploadWithProgress(f, 'artwork', setImgProgress)
    if (!json?.ok || !json.url) throw new Error(json?.error || "Upload failed (pas d'URL)")
    setField('image', json.url)
    addToast('success', 'Image envoyée ✅')
  } catch (err: any) {
    const msg = err?.message || 'Erreur upload'
    setUploadError(msg)
    addToast('error', msg)
  } finally {
    setUploading(false)
    setTimeout(() => setImgProgress(0), 600)
    if (fileRef.current) fileRef.current.value = ''
  }
}

  // Upload mockup (optionnel) -> /api/upload
  const mockupRef = useRef<HTMLInputElement>(null)
  const [uploadingMockup, setUploadingMockup] = useState(false)
  const [uploadErrorMockup, setUploadErrorMockup] = useState<string | null>(null)

  function chooseMockup() {
    mockupRef.current?.click()
  }
async function onMockupChange(e: React.ChangeEvent<HTMLInputElement>) {
  const f = e.target.files?.[0]
  if (!f) return
  setUploadingMockup(true)
  setUploadErrorMockup(null)
  setMockProgress(0)
  try {
    const json = await uploadWithProgress(f, 'mockup', setMockProgress)
    if (!json?.ok || !json.url) throw new Error(json?.error || "Upload failed (pas d'URL)")
    setField('mockup', json.url)
    addToast('success', 'Mockup envoyé ✅')
  } catch (err: any) {
    const msg = err?.message || 'Erreur upload'
    setUploadErrorMockup(msg)
    addToast('error', msg)
  } finally {
    setUploadingMockup(false)
    setTimeout(() => setMockProgress(0), 600)
    if (mockupRef.current) mockupRef.current.value = ''
  }
}

  // Formats
  function addFormat() {
    set(prev => ({
      ...prev,
      formats: [...(prev.formats ?? []), { id: uid('f'), label: '', price: 0 }],
    }))
  }
  function setFormat(idx: number, patch: Partial<FormatRow>) {
    set(prev => {
      const arr = [...(prev.formats ?? [])]
      arr[idx] = { ...arr[idx], ...patch }
      return { ...prev, formats: arr }
    })
  }
  function delFormat(idx: number) {
    set(prev => {
      const arr = (prev.formats ?? []).filter((_, i) => i !== idx)
      return { ...prev, formats: arr }
    })
  }

  const canSubmit =
    value.title.trim().length > 0 &&
    (value.slug.trim().length > 0 || derivedSlug.length > 0) &&
    value.artistId &&
    value.image &&
    ((value.price ?? 0) > 0 || (value.formats ?? []).some(f => (f.price ?? 0) > 0))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (uploading || uploadingMockup) {
      alert('Upload en cours — patiente avant d’enregistrer.')
      return
    }
    if (!canSubmit) return

    // ---- Route unique admin /api/admin/work ----
    // L'API accepte image/mockup/price (euros) et formats[]
    const payloadForApi = {
      id: editingId ? String(value.id) : undefined,
      title: value.title,
      slug: derivedSlug,
      artistId: value.artistId,
      image: value.image || '',
      mockup: value.mockup || null,
      // prix de base en euros si aucun format, sinon on le laisse vide (le serveur prendra min(formats))
      price: (value.price && value.price > 0 ? Number(value.price) : undefined),
      description: value.description || null,
      year: value.year ?? null,
      technique: value.technique || null,
      paper: value.paper || null,
      size: value.size || null,
      edition: value.edition || null,
      published: true,
      formats: (value.formats ?? [])
        .filter(f => f.label.trim())
        .map(f => ({
          id: String(f.id || '').startsWith('f-') ? undefined : f.id,
          label: f.label,
          price: Number(f.price || 0),
        })),
    }

    const endpoint = editingId
      ? `/api/admin/work?id=${encodeURIComponent(String(value.id))}`
      : '/api/admin/work'
    const method = editingId ? 'PUT' : 'POST'

    try {
      const res = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: adminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payloadForApi),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j?.ok === false) {
        throw new Error(j?.error || `HTTP ${res.status}`)
      }

      addToast('success', editingId ? 'Œuvre mise à jour ✅' : 'Œuvre enregistrée ✅')

      // Recharge la liste et garde le contexte
      await refreshExisting()
      if (editingId) {
        // on reste sur l'œuvre éditée
        setEditingId(value.id)
      } else {
        // reset uniquement en création
        set({
          id: uid(),
          slug: '',
          title: '',
          artistId: artistsForSelect[0].value,
          image: '',
          mockup: '',
          price: 0,
          description: '',
          year: undefined,
          technique: '',
          paper: '',
          size: '',
          edition: '',
          formats: [
            { id: uid('f'), label: 'A3 — 297×420mm', price: 120 },
            { id: uid('f'), label: 'A2 — 420×594mm', price: 180 },
            { id: uid('f'), label: 'A1 — 594×841mm', price: 220 },
          ],
        })
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Échec enregistrement')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <AdminPageHeader
        title="Œuvres"
        subtitle="Créer une nouvelle fiche ou modifier une œuvre existante."
        actions={[
          { type: 'link', href: '/admin/authors', label: 'Comptes auteurs' },
        ]}
      />

      {!getAdminKey() && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Attention : <code>NEXT_PUBLIC_ADMIN_KEY</code> n&apos;est pas défini côté client. Les appels d&apos;API d&apos;admin risquent d&apos;échouer (401).
        </div>
      )}

      <div className="mb-6 rounded-xl border p-4">
        <div className="text-sm font-medium mb-2">Mode</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Choisir une œuvre existante</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={editingId ?? ''}
              onChange={(e) => {
                const id = e.target.value || null
                setEditingId(id)
                if (!id) {
                  // reset nouveau brouillon
                  set({
                    id: uid(),
                    slug: '',
                    title: '',
                    artistId: artistsForSelect[0].value,
                    image: '',
                    mockup: '',
                    price: 0,
                    description: '',
                    year: undefined,
                    technique: '',
                    paper: '',
                    size: '',
                    edition: '',
                    formats: [
                      { id: uid('f'), label: 'A3 — 297×420mm', price: 120 },
                      { id: uid('f'), label: 'A2 — 420×594mm', price: 180 },
                      { id: uid('f'), label: 'A1 — 594×841mm', price: 220 },
                    ],
                  })
                } else {
                  const found = existing.find(x => x.id === id)
                  if (found) {
                    const formats = (Array.isArray((found as any).formats) && (found as any).formats.length > 0)
                      ? (found as any).formats
                      : (Array.isArray((found as any).variants) && (found as any).variants.length > 0)
                        ? (found as any).variants.map((v: any) => ({ id: v.id || uid('f'), label: v.label, price: Number(v.price) || 0 }))
                        : [
                            { id: uid('f'), label: 'A3 — 297×420mm', price: 120 },
                            { id: uid('f'), label: 'A2 — 420×594mm', price: 180 },
                            { id: uid('f'), label: 'A1 — 594×841mm', price: 220 },
                          ]
                    set({
                      ...found,
                      id: String(found.id),
                      formats,
                      image: String((found as any).image || (found as any).imageUrl || ''),
                      mockup: (found as any).mockup || (found as any).mockupUrl || '',
                    } as any)
                  }
                }
              }}
            >
              <option value="">— Nouvelle œuvre</option>
              {existing.map(w => (
                <option key={w.id} value={w.id}>{w.title} — {w.slug}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-neutral-500">Sélectionne une œuvre pour l’éditer, ou laisse vide pour créer.</p>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!editingId) return
                const found = existing.find(x => x.id === editingId)
                if (!found) return
                set({
                  ...found,
                  id: uid(),
                  slug: '',
                  title: `${found.title} (copie)`,
                } as any)
                setEditingId(null)
              }}
              className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
              disabled={!editingId}
            >
              Dupliquer
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!editingId) return
                const found = existing.find(x => x.id === editingId)
                const title = found?.title || '(sans titre)'
                const slug = (found as any)?.slug || ''
                const ok = confirm(
                  `Supprimer définitivement cette œuvre ?\n\n` +
                  `Titre : ${title}\n` +
                  `Slug : ${slug}\n\n` +
                  `Cette action est irréversible.`
                )
                if (!ok) return
                const res = await fetch(`/api/admin/work?id=${encodeURIComponent(editingId)}`, {
                  method: 'DELETE',
                  credentials: 'include',
                  headers: adminHeaders(),
                })
                const j = await res.json().catch(() => ({}))
                if (!res.ok || !j?.ok) {
                  alert('Suppression échouée')
                  return
                }
                setExisting(prev => prev.filter(x => x.id !== editingId))
                await refreshExisting()
                setEditingId(null)
                set({
                  id: uid(),
                  slug: '',
                  title: '',
                  artistId: artistsForSelect[0].value,
                  image: '',
                  mockup: '',
                  price: 0,
                  description: '',
                  year: undefined,
                  technique: '',
                  paper: '',
                  size: '',
                  edition: '',
                  formats: [
                    { id: uid('f'), label: 'A3 — 297×420mm', price: 120 },
                    { id: uid('f'), label: 'A2 — 420×594mm', price: 180 },
                    { id: uid('f'), label: 'A1 — 594×841mm', price: 220 },
                  ],
                })
                addToast('success', 'Œuvre supprimée ✅')
              }}
              className="rounded-md border px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              disabled={!editingId}
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Upload + aperçu */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
          <div className="flex-1 space-y-3">
            <label className="block text-sm font-medium">Fichier image</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={chooseFile}
                className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-ink hover:bg-accent-dark disabled:opacity-60"
                disabled={uploading}
              >
                {uploading ? 'Upload…' : 'Uploader vers le serveur'}
              </button>
              {uploadError && <span className="text-sm text-red-600">{uploadError}</span>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="url"
                placeholder="Coller une URL d’image (https://…)"
                className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = (e.currentTarget as HTMLInputElement).value.trim()
                    if (v) {
                      setField('image', v)
                      addToast('success', 'URL image appliquée ✅')
                    }
                  }
                }}
              />
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
                onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                  const v = input?.value?.trim()
                  if (v) {
                    setField('image', v)
                    addToast('success', 'URL image appliquée ✅')
                  }
                }}
              >
                Utiliser cette URL
              </button>
              {value.image && (
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => setField('image', '')}
                  title="Retirer l’image actuelle"
                >
                  Retirer l’image
                </button>
              )}
            </div>
            {imgProgress > 0 && (
  <div className="mt-2 h-2 w-full rounded bg-neutral-100">
    <div
      className="h-2 rounded bg-accent transition-[width]"
      style={{ width: `${imgProgress}%` }}
      aria-label={`Progression upload image ${imgProgress}%`}
    />
  </div>
)}
            <div className="mt-1">
              {uploading ? (
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700">
                  Upload de l’image en cours…
                </span>
              ) : value.image?.startsWith('http') ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] text-green-700">
                  Image prête ✅
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                  Aucune image
                </span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="hidden"
              onChange={onFileChange}
            />
            {value.image && (
              <p className="break-all text-xs text-neutral-500">Chemin : {value.image}</p>
            )}

            <div className="mt-6">
              <label className="block text-sm font-medium">Fichier mockup (optionnel)</label>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={chooseMockup}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
                  disabled={uploadingMockup}
                >
                  {uploadingMockup ? 'Upload…' : 'Uploader le mockup'}
                </button>
                {uploadErrorMockup && (
                  <span className="text-sm text-red-600">{uploadErrorMockup}</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="url"
                  placeholder="Coller une URL de mockup (https://…)"
                  className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = (e.currentTarget as HTMLInputElement).value.trim()
                      if (v) {
                        setField('mockup', v)
                        addToast('success', 'URL mockup appliquée ✅')
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
                  onClick={(e) => {
                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                    const v = input?.value?.trim()
                    if (v) {
                      setField('mockup', v)
                      addToast('success', 'URL mockup appliquée ✅')
                    }
                  }}
                >
                  Utiliser cette URL
                </button>
                {value.mockup && (
                  <button
                    type="button"
                    className="rounded-md border px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => setField('mockup', '')}
                    title="Retirer le mockup actuel"
                  >
                    Retirer le mockup
                  </button>
                )}
              </div>
              {mockProgress > 0 && (
  <div className="mt-2 h-2 w-full rounded bg-neutral-100">
    <div
      className="h-2 rounded bg-accent transition-[width]"
      style={{ width: `${mockProgress}%` }}
      aria-label={`Progression upload mockup ${mockProgress}%`}
    />
  </div>
)}
              <div className="mt-1">
                {uploadingMockup ? (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700">
                    Upload du mockup en cours…
                  </span>
                ) : value.mockup?.startsWith('http') ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] text-green-700">
                    Mockup prêt ✅
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                    Aucun mockup
                  </span>
                )}
              </div>
              <input
                ref={mockupRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                className="hidden"
                onChange={onMockupChange}
              />
              {value.mockup && (
                <p className="mt-2 break-all text-xs text-neutral-500">Chemin mockup : {value.mockup}</p>
              )}
            </div>
          </div>

          <div className="w-44 shrink-0 space-y-3">
            <div className="rounded-xl border">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                {value.image ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={value.image} alt="Aperçu image" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-white/80 px-2 py-0.5 shadow backdrop-blur supports-[backdrop-filter]:bg-white/60">
                      <button
                        type="button"
                        className="text-[11px] underline underline-offset-2"
                        onClick={() => {
                          navigator.clipboard?.writeText(value.image).then(() => addToast('info', 'URL copiée'))
                        }}
                      >
                        Copier l’URL
                      </button>
                      <span className="mx-1 text-neutral-400">•</span>
                      <a href={value.image} target="_blank" rel="noreferrer" className="text-[11px] underline underline-offset-2">
                        Ouvrir
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-xs text-neutral-500">Aucun visuel</div>
                )}
              </div>
            </div>
            <div className="rounded-xl border">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                {value.mockup ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={value.mockup} alt="Aperçu mockup" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-white/80 px-2 py-0.5 shadow backdrop-blur supports-[backdrop-filter]:bg-white/60">
                      <button
                        type="button"
                        className="text-[11px] underline underline-offset-2"
                        onClick={() => {
                          navigator.clipboard?.writeText(value.mockup!).then(() => addToast('info', 'URL copiée'))
                        }}
                      >
                        Copier l’URL
                      </button>
                      <span className="mx-1 text-neutral-400">•</span>
                      <a href={value.mockup} target="_blank" rel="noreferrer" className="text-[11px] underline underline-offset-2">
                        Ouvrir
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-[10px] text-neutral-500">Aucun mockup</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Infos principales */}
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Titre *"
            value={value.title}
            onChange={v => setField('title', v)}
            placeholder="ex : Mono Field 02"
            required
          />
          <Select
            label="Artiste *"
            value={value.artistId}
            onChange={v => setField('artistId', v)}
            options={artistsForSelect}
          />
          <Field
            label="Slug"
            value={value.slug}
            onChange={v => setField('slug', v)}
            placeholder={`(auto) ${derivedSlug}`}
          />
          <Field
            label="Prix de base (€)"
            type="number"
            value={String(value.price || 0)}
            onChange={v => setField('price', Number(v || 0))}
            desc="Utilisé si aucun format n’est renseigné, ou comme fallback."
          />
        </div>

        {/* Métadonnées impression */}
        <div className="rounded-xl border p-4">
          <div className="mb-3 text-sm font-medium">Détails d’impression</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Année" type="number" value={String(value.year ?? '')} onChange={v => setField('year', v ? Number(v) : undefined)} />
            <Field label="Technique" value={value.technique ?? ''} onChange={v => setField('technique', v)} />
            <Field label="Papier" value={value.paper ?? ''} onChange={v => setField('paper', v)} />
            <Field label="Dimensions (texte)" value={value.size ?? ''} onChange={v => setField('size', v)} />
            <Field label="Édition" className="md:col-span-2" value={value.edition ?? ''} onChange={v => setField('edition', v)} />
          </div>
        </div>

        {/* Formats (dimension + prix) */}
        <div className="rounded-xl border p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium">Formats</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addFormat}
                className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50"
              >
                + Ajouter un format
              </button>
              <button
                type="button"
                onClick={() => set(prev => ({
                  ...prev,
                  formats: [
                    { id: uid('f'), label: 'A3 — 297×420mm', price: 120 },
                    { id: uid('f'), label: 'A2 — 420×594mm', price: 180 },
                    { id: uid('f'), label: 'A1 — 594×841mm', price: 220 },
                  ],
                }))}
                className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50"
              >
                Préremplir A3/A2/A1
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(value.formats ?? []).map((f, idx) => (
              <div key={f.id} className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-lg border p-3">
                <div className="col-span-2 grid gap-2 sm:col-span-1">
                  <SmallField
                    label="Libellé (ex : A3 — 297×420mm)"
                    value={f.label}
                    onChange={v => setFormat(idx, { label: v })}
                    placeholder="ex : A2 — 420×594mm"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-1">
                  <SmallField
                    label="Prix (€)"
                    type="number"
                    value={String(f.price ?? 0)}
                    onChange={v => setFormat(idx, { price: Number(v || 0) })}
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => delFormat(idx)}
                    className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
            {(value.formats ?? []).length === 0 && (
              <div className="col-span-2 text-sm text-neutral-500">
                Aucun format. Le prix de base sera utilisé.
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm"
            rows={4}
            value={value.description ?? ''}
            onChange={e => setField('description', e.target.value)}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit || uploading || uploadingMockup}
            title={uploading || uploadingMockup ? 'Veuillez attendre la fin des uploads' : undefined}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading || uploadingMockup ? 'Patiente…' : (editingId ? 'Mettre à jour' : 'Enregistrer l’œuvre')}
          </button>
        </div>
      </form>
      {/* Toasts */}
<div className="fixed bottom-4 right-4 z-50 space-y-2">
  {toasts.map(t => (
    <div
      key={t.id}
      className={[
        'rounded-md px-3 py-2 text-sm shadow',
        t.kind === 'success' ? 'bg-green-600 text-white' : '',
        t.kind === 'error' ? 'bg-red-600 text-white' : '',
        t.kind === 'info' ? 'bg-neutral-800 text-white' : '',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      {t.msg}
    </div>
  ))}
</div>
    </div>
  )
}

/* ---------- Petits inputs réutilisables ---------- */

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  className = '',
  desc,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'number'
  placeholder?: string
  required?: boolean
  className?: string
  desc?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        className="w-full rounded-md border px-3 py-2 text-sm"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {desc && <p className="mt-1 text-xs text-neutral-500">{desc}</p>}
    </div>
  )
}

function SmallField(props: React.ComponentProps<typeof Field>) {
  return <Field {...props} />
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <select
        className="w-full rounded-md border px-3 py-2 text-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Chargement…</div>}>
      <AdminPageInner />
    </Suspense>
  )
}
