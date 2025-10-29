'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { MoonIcon } from '@/components/icons'

type WorkSummary = {
  id: string
  title: string
  slug: string
  artistId: string
  artist?: {
    id: string
    name: string
    slug: string
    isOnVacation?: boolean
  } | null
  image?: string | null
  mockup?: string | null
  published: boolean
  basePriceCents: number | null
  updatedAt: string | null
  artistOnVacation?: boolean
}

type WorkDetail = WorkSummary & {
  description?: string | null
  year?: number | null
  technique?: string | null
  paper?: string | null
  dimensions?: string | null
  edition?: string | null
  variants: Array<{
    id: string
    label: string
    price: number
    order: number
  }>
}

type FormState = {
  title: string
  description: string
  year: string
  technique: string
  paper: string
  edition: string
  image: string
  mockup: string
  basePrice: string
  published: boolean
  variants: Array<{
    id?: string
    label: string
    price: string
  }>
}

type ArtistOption = {
  id: string
  name: string
  slug: string
  isOnVacation?: boolean
}

type WorksResponse = {
  works: WorkSummary[]
  artists: ArtistOption[]
}

type CreateFormState = {
  title: string
  artistId: string
  image: string
}

type StatusFilter = 'all' | 'published' | 'draft'
type ViewMode = 'gallery' | 'table'

function toEuros(cents: number | null | undefined) {
  if (!cents) return ''
  return (cents / 100).toString()
}

function buildForm(detail: WorkDetail): FormState {
  const variants: FormState['variants'] =
    (detail.variants ?? []).map(
      (variant): FormState['variants'][number] => ({
        id: variant.id || undefined,
        label: variant.label,
        price: variant.price ? (variant.price / 100).toString() : '',
      }),
    ) || []

  if (variants.length === 0) {
    variants.push({ label: '', price: '' })
  }

  return {
    title: detail.title ?? '',
    description: detail.description ?? '',
    year: detail.year ? String(detail.year) : '',
    technique: detail.technique ?? '',
    paper: detail.paper ?? '',
    edition: detail.edition ?? '',
    image: detail.image ?? '',
    mockup: detail.mockup ?? '',
    basePrice: toEuros(detail.basePriceCents),
    published: detail.published,
    variants,
  }
}

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatPrice(cents: number | null | undefined) {
  if (typeof cents !== 'number' || Number.isNaN(cents)) return '—'
  return euroFormatter.format(cents / 100)
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
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

export default function AuthorWorksPage() {
  const [works, setWorks] = useState<WorkSummary[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [availableArtists, setAvailableArtists] = useState<ArtistOption[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateFormState>({ title: '', artistId: '', image: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('gallery')

  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null)
  const [detail, setDetail] = useState<WorkDetail | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingMockup, setUploadingMockup] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { filteredWorks, publishedCount, draftCount } = useMemo(() => {
    const published = works.filter((work) => work.published)
    const drafts = works.filter((work) => !work.published)

    let list: WorkSummary[] = works
    if (statusFilter === 'published') {
      list = published
    } else if (statusFilter === 'draft') {
      list = drafts
    }

    return {
      filteredWorks: list,
      publishedCount: published.length,
      draftCount: drafts.length,
    }
  }, [works, statusFilter])

  const selectedWork = useMemo(() => works.find((work) => work.id === selectedWorkId) ?? null, [works, selectedWorkId])
  const activeArtistId = detail?.artist?.id ?? selectedWork?.artistId ?? availableArtists[0]?.id ?? null
  const activeArtistOnVacation = activeArtistId
    ? Boolean(availableArtists.find((artist) => artist.id === activeArtistId)?.isOnVacation)
    : false

  useEffect(() => {
    let active = true
    async function load() {
      setLoadingList(true)
      setListError(null)
      try {
        const data = await fetchJSON<WorksResponse>('/api/author/works')
        if (!active) return
        const worksPayload = Array.isArray(data?.works) ? data.works : []
        const artistsPayload = Array.isArray(data?.artists) ? data.artists : []
        setWorks(worksPayload)
        setAvailableArtists(artistsPayload)
        if (worksPayload.length === 0) {
          setSelectedWorkId(null)
        } else {
          setSelectedWorkId((prev) => {
            if (prev && worksPayload.some((work) => work.id === prev)) return prev
            return worksPayload[0]?.id ?? null
          })
        }
      } catch (err: any) {
        if (!active) return
        setListError(err?.message || 'Impossible de charger vos œuvres')
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
    setCreateForm((prev) => {
      if (availableArtists.length === 0) {
        return { ...prev, artistId: '' }
      }
      if (prev.artistId && availableArtists.some((artist) => artist.id === prev.artistId)) {
        return prev
      }
      return { ...prev, artistId: availableArtists[0].id }
    })
  }, [availableArtists])

  useEffect(() => {
    if (filteredWorks.length === 0) {
      setSelectedWorkId(null)
      return
    }
    setSelectedWorkId((prev) => {
      if (prev && filteredWorks.some((work) => work.id === prev)) {
        return prev
      }
      return filteredWorks[0]?.id ?? null
    })
  }, [filteredWorks])

  useEffect(() => {
    if (!flash) return
    const timeout = window.setTimeout(() => setFlash(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [flash])

  useEffect(() => {
    if (!selectedWorkId) {
      setDetail(null)
      setForm(null)
       setLoadingDetail(false)
      return
    }

    let active = true
    setLoadingDetail(true)
    setError(null)
    setMessage(null)

    fetchJSON<WorkDetail>(`/api/author/works/${selectedWorkId}`)
      .then((data) => {
        if (!active) return
        setDetail(data)
        setForm(buildForm(data))
      })
      .catch((err: any) => {
        if (!active) return
        setError(err?.message || 'Impossible de charger cette œuvre')
      })
      .finally(() => {
        if (active) setLoadingDetail(false)
      })

    return () => {
      active = false
    }
  }, [selectedWorkId])

  const handleField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setMessage(null)
    setError(null)
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleVariantChange = (index: number, key: 'label' | 'price', value: string) => {
    setMessage(null)
    setError(null)
    setForm((prev) => {
      if (!prev) return prev
      const variants = [...prev.variants]
      variants[index] = { ...variants[index], [key]: value }
      return { ...prev, variants }
    })
  }

  const addVariant = () => {
    setMessage(null)
    setError(null)
    setForm((prev) =>
      prev
        ? {
            ...prev,
            variants: [...prev.variants, { id: undefined, label: '', price: '' }],
          }
        : prev,
    )
  }

  const removeVariant = (index: number) => {
    setMessage(null)
    setError(null)
    setForm((prev) => {
      if (!prev) return prev
      const next = prev.variants.filter((_, i) => i !== index)
      if (next.length === 0) next.push({ id: undefined, label: '', price: '' })
      return { ...prev, variants: next }
    })
  }

  const toggleCreatePanel = () => {
    if (showCreate) {
      setShowCreate(false)
      setCreateError(null)
      setCreateForm((form) => ({ ...form, title: '', image: '' }))
    } else {
      setShowCreate(true)
    }
  }

  const handleCreateField = <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => {
    setCreateError(null)
    setCreateForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreateWork(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (creating) return

    if (availableArtists.length === 0) {
      setCreateError("Aucun artiste n'est rattaché à ton compte pour le moment.")
      return
    }

    const title = createForm.title.trim()
    const artistId = (createForm.artistId || availableArtists[0]?.id || '').trim()

    if (!title) {
      setCreateError('Ajoute un titre pour créer une œuvre.')
      return
    }
    if (!artistId) {
      setCreateError('Sélectionne un artiste associé à ton compte.')
      return
    }

    setCreating(true)
    setCreateError(null)

    try {
      const payload = {
        title,
        artistId,
        image: createForm.image.trim() || undefined,
      }
      const res = await fetch('/api/author/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false || !data?.work) {
        const code = data?.error || 'Création impossible'
        if (code === 'no_artist_access') {
          setCreateError("Aucun artiste n'est rattaché à ton compte.")
        } else if (code === 'title_required') {
          setCreateError('Ajoute un titre pour créer une œuvre.')
        } else if (typeof code === 'string') {
          setCreateError(code)
        } else {
          setCreateError('Création impossible.')
        }
        return
      }

      const newWork = data.work as WorkSummary
      setWorks((prev) => [newWork, ...prev.filter((work) => work.id !== newWork.id)])
      setFlash('Nouvelle œuvre créée ✅')
      setShowCreate(false)
      setCreateForm({ title: '', artistId, image: '' })
      setCreateError(null)
      setDetail(null)
      setForm(null)
      setSelectedWorkId(newWork.id)
    } catch (err: any) {
      setCreateError(err?.message || 'Création impossible.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteWork() {
    if (!detail || deleting) return
    const confirmDelete = window.confirm('Supprimer définitivement cette œuvre ?')
    if (!confirmDelete) return

    setDeleting(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch(`/api/author/works/${detail.id}`, { method: 'DELETE' })
      let data: any = {}
      try {
        data = await res.json()
      } catch {
        data = {}
      }
      if (!res.ok || data?.ok === false) {
        const code = data?.error || 'delete_failed'
        if (code === 'work_has_orders') {
          setError('Impossible de supprimer cette œuvre car elle est liée à des commandes.')
        } else if (typeof code === 'string') {
          setError(code)
        } else {
          setError('Suppression impossible.')
        }
        return
      }

      setFlash('Œuvre supprimée ✅')
      setWorks((prev) => {
        const next = prev.filter((work) => work.id !== detail.id)
        if (next.length === 0) {
          setSelectedWorkId(null)
        } else if (!next.some((work) => work.id === selectedWorkId)) {
          setSelectedWorkId(next[0].id)
        }
        return next
      })
      setDetail(null)
      setForm(null)
      setLoadingDetail(false)
    } catch (err: any) {
      setError(err?.message || 'Suppression impossible.')
    } finally {
      setDeleting(false)
    }
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedWorkId || !form) return
    setSaving(true)
    setError(null)
    setMessage(null)

    if (!form.image.trim()) {
      setError('Ajoute une image principale avant de sauvegarder.')
      setSaving(false)
      return
    }

    const variantErrors: string[] = []
    const variantsPayload: Array<{ id?: string; label: string; price: number; order: number }> = []

    form.variants.forEach((variant, idx) => {
      const label = variant.label.trim()
      const priceStr = variant.price.trim()

      if (!label && !priceStr) {
        return
      }
      if (!label) {
        variantErrors.push(`Le format ${idx + 1} doit avoir un nom.`)
        return
      }

      const priceValue = priceStr ? Number(priceStr.replace(',', '.')) : NaN
      if (!Number.isFinite(priceValue) || priceValue <= 0) {
        variantErrors.push(`Prix invalide pour "${label}".`)
        return
      }

      variantsPayload.push({
        id: variant.id,
        label,
        price: priceValue,
        order: idx,
      })
    })

    if (variantErrors.length > 0) {
      setError(variantErrors[0])
      setSaving(false)
      return
    }

    if (variantsPayload.length === 0) {
      setError('Ajoute au moins un format avec un prix supérieur à 0 €.')
      setSaving(false)
      return
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      year: form.year.trim() ? Number(form.year) : null,
      technique: form.technique.trim() || null,
      paper: form.paper.trim() || null,
      edition: form.edition.trim() || null,
      image: form.image.trim(),
      mockup: form.mockup.trim() || null,
      basePrice: form.basePrice.trim() ? Number(form.basePrice.replace(',', '.')) : null,
      published: form.published,
      variants: variantsPayload,
    }

    try {
      const res = await fetch(`/api/author/works/${selectedWorkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as { ok?: boolean; work?: WorkDetail; error?: string }
      if (!res.ok || data?.ok === false || !data.work) {
        throw new Error(data?.error || 'Enregistrement impossible')
      }

      const updatedWork = data.work

      setMessage('Œuvre mise à jour ✅')
      setDetail(updatedWork)
      setForm(buildForm(updatedWork))
      setWorks((prev) =>
                prev.map((work) =>
                  work.id === selectedWorkId
                    ? {
                        ...work,
                        title: updatedWork.title,
                        image: updatedWork.image || null,
                        mockup: updatedWork.mockup || null,
                        published: updatedWork.published,
                        basePriceCents: updatedWork.basePriceCents ?? null,
                        updatedAt: updatedWork.updatedAt ?? new Date().toISOString(),
                        artist: updatedWork.artist
                          ? {
                              id: updatedWork.artist.id,
                              name: updatedWork.artist.name,
                              slug: updatedWork.artist.slug,
                              isOnVacation: updatedWork.artist.isOnVacation,
                            }
                          : work.artist,
                        artistOnVacation: updatedWork.artist?.isOnVacation ?? work.artistOnVacation ?? false,
                      }
                    : work,
                ),
              )
    } catch (err: any) {
      const raw = err?.message || 'Échec de la sauvegarde'
      if (raw === 'invalid_variants') {
        setError('Vérifie chaque format : intitulé et prix doivent être renseignés.')
      } else if (raw === 'variants_required') {
        setError('Ajoute au moins un format avec un prix supérieur à 0 €.')
      } else if (raw === 'invalid_variant_id') {
        setError('Format inconnu. Recharge la page pour repartir sur les valeurs à jour.')
      } else {
        setError(raw)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(kind: 'image' | 'mockup', file: File) {
    const hint = detail?.slug ? `${detail.slug}-${kind}` : kind
    try {
      setError(null)
      setMessage(null)
      if (kind === 'image') setUploadingCover(true)
      else setUploadingMockup(true)
      const url = await uploadImage(file, hint)
      handleField(kind === 'image' ? 'image' : 'mockup', url)
      setMessage(kind === 'image' ? 'Image mise à jour ✅' : 'Mockup mis à jour ✅')
    } catch (err: any) {
      setError(err?.message || 'Upload impossible')
    } finally {
      if (kind === 'image') setUploadingCover(false)
      else setUploadingMockup(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <AdminPageHeader
        title="Mes œuvres"
        subtitle="Modifie les informations et visuels de tes œuvres publiées."
        actions={[
          { type: 'link', href: '/dashboard/profile', label: 'Modifier mon profil' },
          { type: 'link', href: '/dashboard', label: '← Retour au tableau de bord' },
        ]}
      />

      {activeArtistOnVacation ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 shadow-sm">
          <MoonIcon className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
          <div>
            <div className="font-semibold">Mode vacances activé</div>
            <p className="mt-1 text-amber-700/90">
              Tes œuvres restent visibles mais les commandes sont désactivées jusqu’à ton retour.
            </p>
          </div>
        </div>
      ) : null}

      {flash ? (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {flash}
        </div>
      ) : null}

      {showCreate ? (
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Ajouter une nouvelle œuvre</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Renseigne un titre et l’artiste concerné. Tu pourras compléter les autres informations ensuite.
          </p>
          {createError ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {createError}
            </div>
          ) : null}
          {availableArtists.length === 0 ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Aucun artiste n’est rattaché à ton compte pour le moment. Contacte un administrateur pour en ajouter un.
            </div>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={handleCreateWork}>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Artiste <span className="ml-1 text-red-600">*</span>
                </label>
                <select
                  value={createForm.artistId}
                  onChange={(e) => handleCreateField('artistId', e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                  required
                >
                  {availableArtists.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Titre <span className="ml-1 text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => handleCreateField('title', e.target.value)}
                  placeholder="Titre de l’œuvre"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Image (URL optionnelle)</label>
                <input
                  type="url"
                  value={createForm.image}
                  onChange={(e) => handleCreateField('image', e.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-60"
                >
                  {creating ? 'Création…' : 'Créer l’œuvre'}
                </button>
                <button
                  type="button"
                  onClick={toggleCreatePanel}
                  className="text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-700"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {loadingList ? (
        <div className="grid gap-6">
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
              <div className="h-8 w-24 animate-pulse rounded-full bg-neutral-200" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`work-skeleton-${i}`} className="h-44 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm">
            <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
            <div className="mt-6 h-64 animate-pulse rounded-xl bg-neutral-100" />
          </div>
        </div>
      ) : listError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{listError}</div>
      ) : works.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-6 text-sm text-neutral-600">
          <div>Aucune œuvre n’est associée à ton compte pour le moment.</div>
          <button
            type="button"
            onClick={() => {
              setShowCreate(true)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
          >
            Ajouter une œuvre
          </button>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)]">
          <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition',
                    statusFilter === 'all'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                      : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400',
                  ].join(' ')}
                >
                  Toutes
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-700">
                    {works.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('published')}
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition',
                    statusFilter === 'published'
                      ? 'border-emerald-400 bg-emerald-100 text-emerald-700 shadow-sm'
                      : 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50',
                  ].join(' ')}
                >
                  Publiées
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-600">
                    {publishedCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('draft')}
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition',
                    statusFilter === 'draft'
                      ? 'border-amber-400 bg-amber-100 text-amber-700 shadow-sm'
                      : 'border-amber-200 bg-white text-amber-600 hover:bg-amber-50',
                  ].join(' ')}
                >
                  Brouillons
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-600">
                    {draftCount}
                  </span>
                </button>
              </div>
              <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 p-1 text-xs font-medium text-neutral-600">
                <button
                  type="button"
                  onClick={() => setViewMode('gallery')}
                  className={[
                    'rounded-full px-3 py-1 transition',
                    viewMode === 'gallery' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
                  ].join(' ')}
                >
                  Galerie
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={[
                    'rounded-full px-3 py-1 transition',
                    viewMode === 'table' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
                  ].join(' ')}
                >
                  Édition
                </button>
              </div>
            </div>

            <div className="mt-4">
              {filteredWorks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
                  Aucune œuvre ne correspond à ce filtre.
                </div>
              ) : viewMode === 'gallery' ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredWorks.map((work) => {
                    const isSelected = work.id === selectedWorkId
                    const onVacation = Boolean(work.artist?.isOnVacation ?? work.artistOnVacation)
                    return (
                      <button
                        key={work.id}
                        type="button"
                        onClick={() => setSelectedWorkId(work.id)}
                        className={[
                          'group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white text-left transition',
                          isSelected ? 'border-ink ring-2 ring-ink/20 shadow-sm' : 'border-neutral-200 hover:border-ink/50 hover:shadow-sm',
                        ].join(' ')}
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                          {work.image ? (
                            <Image
                              src={work.image}
                              alt={`Visuel ${work.title}`}
                              fill
                              sizes="(min-width: 1280px) 260px, (min-width: 640px) 50vw, 100vw"
                              className="object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                              Pas d’image
                            </div>
                          )}
                          <span
                            className={[
                              'absolute left-3 top-3 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                              work.published ? 'bg-emerald-500/90 text-white' : 'bg-amber-400/90 text-white',
                            ].join(' ')}
                          >
                            {work.published ? 'Publié' : 'Brouillon'}
                          </span>
                          {onVacation ? (
                            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-100/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                              <MoonIcon className="h-3 w-3" />
                              Vacances
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-4">
                          <div className="text-sm font-semibold text-neutral-900">{work.title}</div>
                          <div className="text-xs text-neutral-500">{work.artist?.name ?? `Artiste ${work.artistId}`}</div>
                          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                            <span className="font-medium text-neutral-900">{formatPrice(work.basePriceCents)}</span>
                            <span>{formatUpdatedAt(work.updatedAt)}</span>
                          </div>
                          {onVacation ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                              <MoonIcon className="h-3 w-3" />
                              En vacances
                            </span>
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
                  <table className="min-w-full divide-y divide-neutral-200 text-sm">
                    <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left">
                          Œuvre
                        </th>
                        <th scope="col" className="px-4 py-3 text-left">
                          Statut
                        </th>
                        <th scope="col" className="px-4 py-3 text-left">
                          Prix min
                        </th>
                        <th scope="col" className="px-4 py-3 text-left">
                          Modifiée le
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 bg-white">
                      {filteredWorks.map((work) => {
                        const isSelected = work.id === selectedWorkId
                        const onVacation = Boolean(work.artist?.isOnVacation ?? work.artistOnVacation)
                        return (
                          <tr
                            key={work.id}
                            onClick={() => setSelectedWorkId(work.id)}
                            className={[
                              'cursor-pointer transition',
                              isSelected ? 'bg-ink/5 ring-1 ring-inset ring-ink/20' : 'hover:bg-neutral-50',
                            ].join(' ')}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 overflow-hidden rounded-md bg-neutral-100">
                                  {work.image ? (
                                    <Image
                                      src={work.image}
                                      alt={`Visuel ${work.title}`}
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wide text-neutral-400">
                                      Pas d’image
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-neutral-900">{work.title}</div>
                                  <div className="text-xs text-neutral-500">
                                    {work.artist?.name ?? `Artiste ${work.artistId}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={[
                                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                    work.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                                  ].join(' ')}
                                >
                                  {work.published ? 'Publié' : 'Brouillon'}
                                </span>
                                {onVacation ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                    <MoonIcon className="h-3 w-3" />
                                    Vacances
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium text-neutral-900">{formatPrice(work.basePriceCents)}</td>
                            <td className="px-4 py-3 text-neutral-500">{formatUpdatedAt(work.updatedAt)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm">
            {loadingDetail ? (
              <div className="text-sm text-neutral-500">Chargement…</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : detail && form ? (
              <form className="space-y-6" onSubmit={onSave}>
                {message ? (
                  <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {message}
                  </div>
                ) : null}

                <div>
                  <label className="block text-sm font-medium text-neutral-700">
                    Titre <span className="ml-1 text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleField('title', e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Année</label>
                    <input
                      type="number"
                      value={form.year}
                      onChange={(e) => handleField('year', e.target.value)}
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                      min={1900}
                      max={2100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Prix de base (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.basePrice}
                      onChange={(e) => handleField('basePrice', e.target.value)}
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Technique</label>
                    <input
                      type="text"
                      value={form.technique}
                      onChange={(e) => handleField('technique', e.target.value)}
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Papier</label>
                    <input
                      type="text"
                      value={form.paper}
                      onChange={(e) => handleField('paper', e.target.value)}
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700">Édition</label>
                  <input
                    type="text"
                    value={form.edition}
                    onChange={(e) => handleField('edition', e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleField('description', e.target.value)}
                    rows={5}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                  />
                </div>

                <div className="rounded-lg border border-neutral-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-700">Formats / variantes</h3>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                    >
                      + Ajouter un format
                    </button>
                  </div>

                  <div className="space-y-3">
                    {form.variants.map((variant, idx) => (
                      <div
                        key={variant.id ?? `new-${idx}`}
                        className="grid gap-3 rounded-md border border-neutral-200 p-3 md:grid-cols-[1fr_140px_auto]"
                      >
                        <div>
                          <label className="block text-xs font-medium uppercase text-neutral-500">
                            Intitulé <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={variant.label}
                            onChange={(e) => handleVariantChange(idx, 'label', e.target.value)}
                            placeholder="Ex. A3 — 297×420 mm"
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium uppercase text-neutral-500">
                            Prix (€) <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern="^[0-9]+(?:[.,][0-9]{0,2})?$"
                            value={variant.price}
                            onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                            placeholder="0"
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => removeVariant(idx)}
                            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-neutral-500">
                    Ajoute un intitulé clair (format, dimensions) et un prix TTC en euros. Supprime une ligne pour retirer un format.
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-200 p-4">
                  <h3 className="text-sm font-semibold text-neutral-700">Image principale</h3>
                  <p className="mt-1 text-xs text-neutral-500">Poids max 2,5&nbsp;Mo.</p>
                  {form.image ? (
                    <div className="relative mt-3 h-40 w-full overflow-hidden rounded-lg">
                      <Image
                        src={form.image}
                        alt={`Image principale ${form.title || ''}`.trim()}
                        fill
                        sizes="(min-width: 1024px) 420px, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-neutral-500">Aucune image définie pour le moment.</p>
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

                <div className="rounded-lg border border-neutral-200 p-4">
                  <h3 className="text-sm font-semibold text-neutral-700">Mockup (optionnel)</h3>
                  <p className="mt-1 text-xs text-neutral-500">Poids max 2,5&nbsp;Mo.</p>
                  {form.mockup ? (
                    <div className="relative mt-3 h-40 w-full overflow-hidden rounded-lg">
                      <Image
                        src={form.mockup}
                        alt={`Mockup ${form.title || ''}`.trim()}
                        fill
                        sizes="(min-width: 1024px) 420px, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-neutral-500">Aucun mockup défini.</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input
                      type="url"
                      placeholder="https://…"
                      value={form.mockup}
                      onChange={(e) => handleField('mockup', e.target.value)}
                      className="w-full flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload('mockup', file)
                        }}
                      />
                      {uploadingMockup ? 'Upload…' : 'Téléverser'}
                    </label>
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => handleField('published', e.target.checked)}
                  />
                  Œuvre publiée et visible sur le site
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-60"
                  >
                    {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                  </button>
                  {detail.slug ? (
                    <Link
                      href={`/artworks/${detail.slug}`}
                      className="text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
                    >
                      Voir la fiche publique
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleDeleteWork}
                    disabled={deleting}
                    className="ml-auto rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    {deleting ? 'Suppression…' : 'Supprimer cette œuvre'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-sm text-neutral-500">Sélectionne une œuvre dans la liste.</div>
            )}
          </section>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (!showCreate) {
            setShowCreate(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }}
        className={[
          'fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-ink/30 transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
          showCreate ? 'pointer-events-none opacity-0' : 'opacity-100',
        ].join(' ')}
        aria-label="Ajouter une œuvre"
      >
        <span className="text-base leading-none">+</span>
        Ajouter une œuvre
      </button>
    </div>
  )
}
