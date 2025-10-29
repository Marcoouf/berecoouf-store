'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { MailIcon, GlobeIcon, InstagramIcon, PaletteIcon, MoonIcon } from '@/components/icons'

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
  isOnVacation: boolean
}

type FormState = {
  name: string
  bio: string
  contactEmail: string
  handle: string
  socials: string[]
  image: string
  portrait: string
  isOnVacation: boolean
}

type Toast = {
  id: string
  message: string
  kind: 'success' | 'error' | 'info'
}

type UploadMeta = {
  name: string
  sizeLabel: string
}

type SectionKey = 'identite' | 'biographie' | 'visuels' | 'reseaux'

function createSectionsState(): Record<SectionKey, boolean> {
  return {
    identite: true,
    biographie: false,
    visuels: true,
    reseaux: false,
  }
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
    isOnVacation: Boolean(artist.isOnVacation),
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

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 ko'
  const units = ['octets', 'ko', 'Mo', 'Go']
  let size = bytes
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return index === 0 ? `${Math.round(size)} ${units[index]}` : `${size.toFixed(1)} ${units[index]}`
}

function initialsFromName(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  return initials || '??'
}

function socialLabel(url: string) {
  try {
    const { hostname } = new URL(url)
    return hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function AccordionSection({
  title,
  description,
  open,
  onToggle,
  children,
}: {
  title: string
  description?: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white/80">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition hover:bg-neutral-50"
        aria-expanded={open}
      >
        <div>
          <div className="text-sm font-semibold text-neutral-800">{title}</div>
          {description ? <p className="mt-1 text-xs text-neutral-500">{description}</p> : null}
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm">
          <svg
            className={`h-4 w-4 text-neutral-600 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open ? <div className="border-t border-neutral-100 px-6 py-5">{children}</div> : null}
    </div>
  )
}

function ImageUploadField({
  id,
  label,
  previewKind,
  value,
  onChange,
  onUpload,
  uploading,
  meta,
  placeholder,
  help,
}: {
  id: 'portrait' | 'image'
  label: string
  previewKind: 'portrait' | 'cover'
  value: string
  onChange: (value: string) => void
  onUpload: (file: File) => void
  uploading: boolean
  meta?: UploadMeta
  placeholder: string
  help?: string
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      const file = fileList?.[0]
      if (file) {
        onUpload(file)
      }
    },
    [onUpload],
  )

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files)
    // Reset the input so the same file can be selected again if needed
    event.target.value = ''
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      fileInputRef.current?.click()
    }
  }

  const previewWrapperClass =
    previewKind === 'cover' ? 'h-48 w-full' : 'h-44 w-44 mx-auto'

  const dropZoneClass = [
    'group relative flex w-full flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/80 p-5 text-center transition',
    isDragging ? 'border-ink bg-ink/5' : 'hover:border-neutral-300',
  ].join(' ')

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-sm font-semibold text-neutral-700">{label}</div>
        <div className="text-xs text-neutral-500">Poids max 2,5&nbsp;Mo.</div>
      </div>
      <div
        role="button"
        tabIndex={0}
        className={dropZoneClass}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className={['relative overflow-hidden rounded-xl border border-neutral-200 bg-white', previewWrapperClass].join(' ')}
        >
          {value ? (
            <Image
              src={value}
              alt=""
              fill
              sizes={previewKind === 'cover' ? '600px' : '200px'}
              className="object-cover object-center"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-neutral-400">
              <PaletteIcon className="h-8 w-8 text-neutral-300" />
              <span className="text-base font-medium">Glisse ton image ici</span>
              <span className="text-xs text-neutral-400">PNG ou JPG recommandé</span>
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-neutral-300 border-t-ink" />
            </div>
          ) : null}
        </div>
        <div className="mt-3 text-xs text-neutral-500">
          Glisse-dépose un fichier ou <span className="font-medium text-ink">clique pour téléverser</span>.
        </div>
        {meta ? (
          <div className="mt-2 text-xs text-neutral-500">
            {meta.name} · {meta.sizeLabel}
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Importer une image
        </button>
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
          >
            Voir en plein écran
          </a>
        ) : null}
      </div>
      <input
        ref={fileInputRef}
        id={`${id}-file-input`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
      />
      {help ? <p className="text-xs text-neutral-400">{help}</p> : null}
    </div>
  )
}

function CompletionCard({
  percent,
  items,
}: {
  percent: number
  items: Array<{ key: string; label: string; done: boolean }>
}) {
  const safePercent = Math.round(Math.min(100, Math.max(0, percent)))
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const dashoffset = circumference * (1 - safePercent / 100)

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase text-neutral-500">Profil complété</div>
          <p className="mt-1 text-sm text-neutral-600">
            Continue jusqu’à 100&nbsp;% pour rassurer tes visiteurs.
          </p>
        </div>
        <div className="relative grid h-16 w-16 place-items-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r={radius} stroke="#e5e5e5" strokeWidth="4" fill="none" />
            <circle
              cx="20"
              cy="20"
              r={radius}
              stroke="#0a0a0a"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
            />
          </svg>
        </div>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${safePercent}%` }} />
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2">
            <span
              className={[
                'flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors',
                item.done ? 'border-green-500 bg-green-500 text-white' : 'border-neutral-300 text-neutral-400',
              ].join(' ')}
            >
              {item.done ? '✓' : ''}
            </span>
            <span className={item.done ? 'text-neutral-500' : 'text-neutral-700'}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PublicPreview({ form, onPick }: { form: FormState; onPick: (kind: 'portrait' | 'image') => void }) {
  const socials = form.socials.filter((entry) => entry.trim().length > 0).slice(0, 4)
  const handle = form.handle.trim().replace(/^@+/, '')

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white/80 shadow-sm">
      <div className="relative h-40 w-full bg-neutral-200">
        {form.image ? (
          <Image src={form.image} alt="" fill sizes="400px" className="object-cover object-center" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-neutral-400">
            <PaletteIcon className="h-8 w-8 text-neutral-300" />
            <div>Image de couverture manquante</div>
            <button
              type="button"
              onClick={() => onPick('image')}
              className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-white transition hover:bg-ink/90"
            >
              Ajouter une image
            </button>
          </div>
        )}
      </div>
      <div className="-mt-12 flex justify-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-neutral-100 shadow">
          {form.portrait ? (
            <Image src={form.portrait} alt="" fill sizes="120px" className="object-cover object-center" />
          ) : (
            <button
              type="button"
              onClick={() => onPick('portrait')}
              className="group flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-400"
            >
              <PaletteIcon className="h-6 w-6 text-neutral-300 transition group-hover:text-ink" />
              <span className="text-xs font-medium">{initialsFromName(form.name || 'Artiste')}</span>
              <span className="text-[10px] uppercase tracking-wide text-neutral-400 group-hover:text-ink">
                Ajouter
              </span>
            </button>
          )}
        </div>
      </div>
      <div className="px-6 pb-6 pt-4 text-center">
        <div className="text-lg font-semibold text-neutral-900">{form.name || 'Nom de l’artiste'}</div>
        {handle ? <div className="text-sm text-neutral-500">@{handle}</div> : null}
        {form.isOnVacation ? (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            <MoonIcon className="h-4 w-4" />
            En vacances
          </div>
        ) : null}
        <p
          className="mt-3 whitespace-pre-line text-sm text-neutral-600"
          style={{ maxHeight: '7.5rem', overflow: 'hidden' }}
        >
          {form.bio || 'Ajoute une biographie pour raconter ton univers.'}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {socials.length > 0 ? (
            socials.map((url) => (
              <span
                key={url}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600"
                title={url}
              >
                {socialLabel(url)}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-dashed border-neutral-300 px-3 py-1 text-xs text-neutral-400">
              Ajoute tes réseaux sociaux
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-neutral-400">
          <MailIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{form.contactEmail ? form.contactEmail : 'Renseigne ton email de contact.'}</span>
        </div>
      </div>
    </div>
  )
}

export default function AuthorProfilePage() {
  const [artists, setArtists] = useState<ArtistProfile[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedArtist = useMemo(() => artists.find((a) => a.id === selectedId) ?? null, [artists, selectedId])

  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPortrait, setUploadingPortrait] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadMeta, setUploadMeta] = useState<{ portrait?: UploadMeta; image?: UploadMeta }>({})
  const [sectionsOpen, setSectionsOpen] = useState<Record<SectionKey, boolean>>(createSectionsState)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastTimeouts = useRef<number[]>([])
  const previousArtistId = useRef<string | null>(null)

  const pushToast = useCallback((message: string, kind: Toast['kind'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [...prev, { id, message, kind }])
    const timeout = window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
      toastTimeouts.current = toastTimeouts.current.filter((value) => value !== timeout)
    }, 4500)
    toastTimeouts.current.push(timeout)
  }, [])

  useEffect(() => {
    return () => {
      toastTimeouts.current.forEach((timeout) => window.clearTimeout(timeout))
      toastTimeouts.current = []
    }
  }, [])

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
      setUploadMeta({})
      previousArtistId.current = null
      return
    }

    setForm(buildForm(selectedArtist))
    if (previousArtistId.current !== selectedArtist.id) {
      setUploadMeta({})
      setSectionsOpen(createSectionsState())
    }
    previousArtistId.current = selectedArtist.id
  }, [selectedArtist])

  const handleField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }, [])

  const handleSocialChange = useCallback((index: number, value: string) => {
    setForm((prev) => {
      if (!prev) return prev
      const socials = prev.socials.slice()
      socials[index] = value
      return { ...prev, socials }
    })
  }, [])

  const addSocial = useCallback(() => {
    setForm((prev) => {
      if (!prev) return prev
      return { ...prev, socials: [...prev.socials, ''] }
    })
  }, [])

  const removeSocial = useCallback((index: number) => {
    setForm((prev) => {
      if (!prev) return prev
      const socials = prev.socials.filter((_, i) => i !== index)
      return { ...prev, socials: socials.length > 0 ? socials : [''] }
    })
  }, [])

  const toggleSection = useCallback((key: SectionKey) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const openAssetPicker = useCallback((kind: 'portrait' | 'image') => {
    const input = document.getElementById(`${kind}-file-input`) as HTMLInputElement | null
    input?.click()
  }, [])

  async function handleUpload(kind: 'portrait' | 'image', file: File) {
    if (!selectedArtist) return
    const hint = `${selectedArtist.slug}-${kind}`
    setUploadMeta((prev) => ({
      ...prev,
      [kind]: { name: file.name, sizeLabel: formatFileSize(file.size) },
    }))
    try {
      if (kind === 'portrait') setUploadingPortrait(true)
      else setUploadingCover(true)
      const url = await uploadImage(file, hint)
      handleField(kind, url)
      pushToast(kind === 'portrait' ? 'Portrait mis à jour ✅' : 'Image de couverture mise à jour ✅', 'success')
    } catch (err: any) {
      pushToast(err?.message || 'Upload impossible', 'error')
    } finally {
      if (kind === 'portrait') setUploadingPortrait(false)
      else setUploadingCover(false)
    }
  }

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedArtist || !form) return
    setSaving(true)

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
      isOnVacation: form.isOnVacation,
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
      setArtists((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)))
      setForm(buildForm(updated))
      pushToast('Profil mis à jour ✅', 'success')
    } catch (err: any) {
      pushToast(err?.message || 'Enregistrement impossible', 'error')
    } finally {
      setSaving(false)
    }
  }

  const completion = useMemo(() => {
    if (!form) return { percent: 0, items: [] as Array<{ key: string; label: string; done: boolean }> }
    const socialCount = form.socials.filter((entry) => entry.trim().length > 0).length
    const items = [
      { key: 'name', label: 'Nom affiché', done: form.name.trim().length > 0 },
      { key: 'bio', label: 'Biographie détaillée', done: form.bio.trim().length > 0 },
      { key: 'portrait', label: 'Portrait', done: form.portrait.trim().length > 0 },
      { key: 'cover', label: 'Image de couverture', done: form.image.trim().length > 0 },
      { key: 'contact', label: 'Email de contact', done: form.contactEmail.trim().length > 0 },
      { key: 'social', label: 'Au moins un réseau social', done: socialCount > 0 },
    ]
    const percent = Math.round((items.filter((item) => item.done).length / items.length) * 100)
    return { percent, items }
  }, [form])

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-[6.5rem] z-[140] flex justify-end px-4 sm:top-[6rem] sm:px-6">
        <div className="flex flex-col gap-3">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={[
                'pointer-events-auto rounded-md px-4 py-3 text-sm text-white shadow-lg',
                toast.kind === 'success' ? 'bg-green-600' : '',
                toast.kind === 'error' ? 'bg-red-600' : '',
                toast.kind === 'info' ? 'bg-neutral-800' : '',
              ].join(' ')}
              role="status"
              aria-live="polite"
            >
              {toast.message}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <AdminPageHeader
          title="Mon profil artiste"
          subtitle="Mets à jour les informations publiques affichées sur ta page artiste."
          actions={[{ type: 'link', href: '/dashboard', label: '← Retour au tableau de bord' }]}
        />

        {loadingList ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
              <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
              <div className="mt-4 flex flex-wrap gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`artist-skeleton-${i}`} className="h-12 w-44 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100" />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm">
              <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`form-skeleton-${i}`} className="h-14 animate-pulse rounded-md bg-neutral-100" />
                ))}
              </div>
              <div className="mt-6 h-24 animate-pulse rounded-xl bg-neutral-100" />
            </div>
          </div>
        ) : listError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {listError}
          </div>
        ) : artists.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-600 shadow-sm">
            Aucun artiste n’est associé à ton compte pour le moment. Contacte un administrateur pour obtenir un accès.
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-6">
            <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
              <div className="mb-3 text-xs font-semibold uppercase text-neutral-500">Artistes</div>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto sm:pr-2">
                {artists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => setSelectedId(artist.id)}
                    className={[
                      'rounded-lg border px-3 py-2 text-left text-sm transition',
                      'sm:flex-shrink-0 sm:min-w-[220px]',
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
            </div>

            <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white/80 shadow-sm">
              {form ? (
                <div className="grid gap-0 xl:grid-cols-[320px_1fr]">
                  <div className="flex flex-col gap-6 border-b border-neutral-100 bg-neutral-50/60 p-6 xl:border-b-0 xl:border-r">
                    <CompletionCard percent={completion.percent} items={completion.items} />
                    <PublicPreview form={form} onPick={openAssetPicker} />
                  </div>

                  <form className="relative flex flex-col gap-6 p-6 pb-28" onSubmit={onSave}>
                    <AccordionSection
                      title="Identité"
                      description="Nom, contact et pseudo affichés au public."
                      open={sectionsOpen.identite}
                      onToggle={() => toggleSection('identite')}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700">Nom affiché</label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => handleField('name', e.target.value)}
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700">Contact</label>
                          <div className="mt-1 flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 transition focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10">
                            <MailIcon className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                            <input
                              type="email"
                              value={form.contactEmail}
                              onChange={(e) => handleField('contactEmail', e.target.value)}
                              placeholder="artiste@example.com"
                              className="w-full border-0 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
                            />
                          </div>
                          <p className="mt-1 text-xs text-neutral-400">
                            Adresse utilisée pour les notifications de ventes.
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700">Handle / pseudo</label>
                          <div className="mt-1 flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 transition focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10">
                            <GlobeIcon className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                            <input
                              type="text"
                              value={form.handle}
                              onChange={(e) => handleField('handle', e.target.value)}
                              placeholder="Ex. @vague"
                              className="w-full border-0 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                              <MoonIcon className="h-4 w-4 text-amber-500" aria-hidden="true" />
                              Mode vacances
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">
                              Active cette option pour rendre toutes tes œuvres indisponibles pendant ton absence.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleField('isOnVacation', !form.isOnVacation)}
                            className={[
                              'inline-flex items-center justify-between rounded-full px-2 py-1 text-xs font-semibold transition sm:min-w-[140px]',
                              form.isOnVacation
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-white text-neutral-600 border border-neutral-200 hover:border-amber-300',
                            ].join(' ')}
                          >
                            <span className="px-2 py-1">
                              {form.isOnVacation ? 'Activé' : 'Désactivé'}
                            </span>
                            <span
                              className={[
                                'ml-2 flex h-6 w-6 items-center justify-center rounded-full border',
                                form.isOnVacation ? 'border-white/70 bg-white/20' : 'border-neutral-200 bg-white',
                              ].join(' ')}
                            >
                              {form.isOnVacation ? '✓' : ''}
                            </span>
                          </button>
                        </div>
                      </div>
                    </AccordionSection>

                    <AccordionSection
                      title="Biographie"
                      description="Explique ton univers artistique et ton parcours."
                      open={sectionsOpen.biographie}
                      onToggle={() => toggleSection('biographie')}
                    >
                      <label className="block text-sm font-medium text-neutral-700">Biographie</label>
                      <textarea
                        value={form.bio}
                        onChange={(e) => handleField('bio', e.target.value)}
                        rows={6}
                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                      />
                      <p className="mt-1 text-xs text-neutral-400">
                        Cette description apparaît sur ta page artiste. Ajoute de la matière pour donner confiance.
                      </p>
                    </AccordionSection>

                    <AccordionSection
                      title="Visuels"
                      description="Portrait carré et image de couverture 16:9."
                      open={sectionsOpen.visuels}
                      onToggle={() => toggleSection('visuels')}
                    >
                      <div className="grid gap-6 lg:grid-cols-2">
                        <ImageUploadField
                          id="portrait"
                          label="Portrait"
                          previewKind="portrait"
                          value={form.portrait}
                          onChange={(value) => handleField('portrait', value)}
                          onUpload={(file) => handleUpload('portrait', file)}
                          uploading={uploadingPortrait}
                          meta={uploadMeta.portrait}
                          placeholder="https://…"
                          help="Portrait carré recommandé (800×800px minimum)."
                        />
                        <ImageUploadField
                          id="image"
                          label="Image de couverture"
                          previewKind="cover"
                          value={form.image}
                          onChange={(value) => handleField('image', value)}
                          onUpload={(file) => handleUpload('image', file)}
                          uploading={uploadingCover}
                          meta={uploadMeta.image}
                          placeholder="https://…"
                          help="Image horizontale (16:9) pour la bannière de ta page."
                        />
                      </div>
                    </AccordionSection>

                    <AccordionSection
                      title="Réseaux sociaux"
                      description="Ajoute tes liens pour que les fans puissent te suivre."
                      open={sectionsOpen.reseaux}
                      onToggle={() => toggleSection('reseaux')}
                    >
                      <div className="space-y-3">
                        {form.socials.map((entry, index) => {
                          const slug = entry.trim().toLowerCase()
                          const IconComponent =
                            slug.includes('insta') || slug.includes('ig')
                              ? InstagramIcon
                              : slug.includes('mailto')
                              ? MailIcon
                              : GlobeIcon

                          return (
                            <div key={`social-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                              <div className="flex flex-1 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 transition focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10">
                                <IconComponent className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                                <input
                                  type="url"
                                  value={entry}
                                  onChange={(e) => handleSocialChange(index, e.target.value)}
                                  placeholder="https://instagram.com/monprofil"
                                  className="w-full border-0 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSocial(index)}
                                className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
                              >
                                Retirer
                              </button>
                            </div>
                          )
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={addSocial}
                        className="mt-4 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
                      >
                        + Ajouter un lien
                      </button>
                    </AccordionSection>

                    <div className="sticky bottom-0 left-0 right-0 -mx-6 -mb-6 mt-2 border-t border-neutral-200 bg-white/95 px-6 py-4 shadow-[0_-10px_30px_rgba(10,10,10,0.08)] backdrop-blur">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-neutral-500">
                          Vérifie les informations puis enregistre pour mettre à jour ton profil public.
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {selectedArtist ? (
                            <Link
                              href={`/artists/${selectedArtist.slug}`}
                              target="_blank"
                              className="rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
                            >
                              Voir la page publique
                            </Link>
                          ) : null}
                          <button
                            type="submit"
                            disabled={saving}
                            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {saving ? 'Enregistrement…' : 'Enregistrer mes modifications'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-6 text-sm text-neutral-500">Sélectionne un artiste à modifier.</div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  )
}
