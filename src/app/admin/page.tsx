'use client'
export const dynamic = 'force-dynamic'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type FormatRow = { id: string; label: string; price: number }

type ArtworkDraft = {
  id: string
  slug: string
  title: string
  artistId: string
  image: string
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

export default function AdminPage() {
  const isDev = process.env.NODE_ENV === 'development'
  const adminEnabled = process.env.NEXT_PUBLIC_ADMIN_ENABLED === 'true'
  if (!isDev && !adminEnabled) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-2xl font-medium tracking-tight">Admin désactivée</h1>
        <p className="mt-2 text-neutral-600">
          Cette interface n’est pas disponible en production.
        </p>
      </div>
    )
  }
  const searchParams = useSearchParams()
  const adminKey =
    searchParams.get('adminkey') || process.env.NEXT_PUBLIC_ADMIN_KEY || ''

  const [value, set] = useState<ArtworkDraft>({
    id: uid(),
    slug: '',
    title: '',
    artistId: artistsForSelect[0].value,
    image: '',
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

  const setField = <K extends keyof ArtworkDraft>(k: K, v: ArtworkDraft[K]) =>
    set(prev => ({ ...prev, [k]: v }))

  const derivedSlug = useMemo(() => {
    if (value.slug?.trim()) return value.slug
    return safeSlug(value.title || value.id)
  }, [value.slug, value.title, value.id])

  // Upload image -> appelle /api/upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function chooseFile() {
    fileRef.current?.click()
  }
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await r.json()
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'Upload failed')
      setField('image', json.path as string) // ex: /images/artworks/xxx.webp
    } catch (err: any) {
      setUploadError(err?.message || 'Erreur upload')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
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
    if (!canSubmit) return

    const payload: ArtworkDraft = {
      ...value,
      slug: derivedSlug,
      price:
        value.price && value.price > 0
          ? value.price
          : (value.formats?.[0]?.price ?? 0),
      formats:
        (value.formats ?? [])
          .filter(f => f.label.trim())
          .map(f => ({ ...f, price: Number(f.price || 0) })) || undefined,
    }

    try {
      const url = `/api/admin/save-artwork?adminkey=${encodeURIComponent(adminKey)}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`)

      alert('Œuvre enregistrée ✅')

      // reset
      set({
        id: uid(),
        slug: '',
        title: '',
        artistId: artistsForSelect[0].value,
        image: '',
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
    } catch (err: any) {
      alert(`Échec enregistrement ❌ — ${err?.message || err}`)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-tight">Admin — Nouvelle œuvre</h1>
        <Link href="/" className="text-sm underline underline-offset-4">← Retour au site</Link>
      </div>

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
                  if (found) set(found as any)
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
                const ok = confirm('Supprimer définitivement cette œuvre ?')
                if (!ok) return
                const url = new URL('/api/admin/save-artwork', window.location.origin)
                if (adminKey) url.searchParams.set('adminkey', adminKey)
                url.searchParams.set('id', editingId)
                const res = await fetch(url.toString(), { method: 'DELETE' })
                const j = await res.json().catch(() => ({}))
                if (!res.ok || !j?.ok) {
                  alert('Suppression échouée')
                  return
                }
                setExisting(prev => prev.filter(x => x.id !== editingId))
                setEditingId(null)
                set({
                  id: uid(),
                  slug: '',
                  title: '',
                  artistId: artistsForSelect[0].value,
                  image: '',
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
                alert('Œuvre supprimée ✅')
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
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
            {value.image && (
              <p className="break-all text-xs text-neutral-500">Chemin : {value.image}</p>
            )}
          </div>

          <div className="w-44 shrink-0 rounded-xl border">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
              {value.image ? (
                <Image src={value.image} alt="" fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-xs text-neutral-500">
                  Aucun visuel
                </div>
              )}
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
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Formats</div>
            <button
              type="button"
              onClick={addFormat}
              className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50"
            >
              + Ajouter un format
            </button>
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
            disabled={!canSubmit}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            Enregistrer l’œuvre
          </button>
        </div>
      </form>
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