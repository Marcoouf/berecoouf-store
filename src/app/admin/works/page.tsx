"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import SmartImage from "@/components/SmartImage"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"

// ----------------- Helpers -----------------
const clsx = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ")

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })
const toCents = (val: string) => {
  const n = Number(String(val).replace(",", "."))
  if (!Number.isFinite(n)) return 0
  // On considère que l'admin saisit des euros → conversion centimes
  return Math.max(0, Math.round(n * 100))
}

const DEFAULT_FORMATS: VariantForm[] = [
  { label: "Format A3", price: "120", stock: "" },
  { label: "Format A2", price: "190", stock: "" },
]

// ----------------- Types -----------------
type ArtistOption = { id: string; name: string; slug: string }
type VariantForm = { id?: string; label: string; price: string; stock: string }
type WorkForm = {
  id?: string
  slug: string
  title: string
  artistId: string
  description: string
  technique: string
  year: string
  paper: string
  dimensions: string
  image: string
  mockup: string
  published: boolean
  variants: VariantForm[]
}

type CatalogWork = {
  id: string
  slug: string
  title: string
  artistId: string
  cover?: { url: string }
  image?: string
  mockup?: string
  price?: number
  priceMin?: number
  description?: string
  year?: number
  technique?: string
  paper?: string
  size?: string
  variants?: Array<{ id: string; label: string; price: number; stock?: number | null }>
}

type CatalogArtist = { id: string; name: string; slug: string }

// ----------------- API calls -----------------
async function fetchArtists(): Promise<ArtistOption[]> {
  const res = await fetch("/api/admin/artists", { cache: "no-store" })
  if (!res.ok) throw new Error("Impossible de charger les artistes.")
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function fetchCatalog(): Promise<{ artists: CatalogArtist[]; artworks: CatalogWork[] }> {
  const res = await fetch("/api/catalog", { cache: "no-store" })
  if (!res.ok) throw new Error("Impossible de charger le catalogue.")
  const data = await res.json()
  return {
    artists: Array.isArray(data?.artists) ? data.artists : [],
    artworks: Array.isArray(data?.artworks) ? data.artworks : [],
  }
}

async function uploadWithKind(file: File, kind: "artwork" | "mockup") {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("kind", kind)
  fd.append("originalName", file.name)
  const res = await fetch("/api/upload", { method: "POST", body: fd })
  const ct = res.headers.get("content-type") || ""
  const body = ct.includes("application/json") ? await res.json() : { error: await res.text() }
  if (!res.ok || !body?.url) throw new Error(body?.error || "Upload échoué")
  return body.url as string
}

// ----------------- Component -----------------
function emptyWork(): WorkForm {
  return {
    slug: "",
    title: "",
    artistId: "",
    description: "",
    technique: "",
    year: "",
    paper: "",
    dimensions: "",
    image: "",
    mockup: "",
    published: true,
    variants: [...DEFAULT_FORMATS],
  }
}

type Toast = { id: string; kind: "success" | "error" | "info"; message: string }

function formatPrice(cents?: number) {
  if (!cents) return ""
  return euro.format(cents / 100)
}

function firstImage(w: CatalogWork): string | null {
  const candidates = [
    w.cover?.url,
    typeof w.image === "string" ? w.image : null,
    typeof w.mockup === "string" ? w.mockup : null,
  ].filter(Boolean) as string[]
  return candidates.find(Boolean) || null
}

function workToForm(w: CatalogWork): WorkForm {
  return {
    id: w.id,
    slug: w.slug,
    title: w.title,
    artistId: w.artistId,
    description: w.description ?? "",
    technique: w.technique ?? "",
    year: w.year ? String(w.year) : "",
    paper: w.paper ?? "",
    dimensions: w.size ?? "",
    image: firstImage(w) || "",
    mockup: typeof w.mockup === "string" ? w.mockup : "",
    published: true,
    variants:
      Array.isArray(w.variants) && w.variants.length
        ? w.variants.map((v) => ({
            id: v.id,
            label: v.label || "",
            price: (v.price / 100).toString(),
            stock: v.stock == null ? "" : String(v.stock),
          }))
        : [...DEFAULT_FORMATS],
  }
}

function adaptApiWork(raw: any): CatalogWork {
  if (!raw) {
    return {
      id: "",
      slug: "",
      title: "",
      artistId: "",
      image: "",
      mockup: "",
      price: undefined,
      priceMin: undefined,
      variants: [],
    }
  }
  return {
    id: raw.id ?? "",
    slug: raw.slug ?? "",
    title: raw.title ?? "",
    artistId: raw.artistId ?? raw.artist?.id ?? "",
    image: raw.imageUrl ?? raw.image ?? raw.cover ?? undefined,
    mockup: raw.mockupUrl ?? raw.mockup ?? undefined,
    price: typeof raw.basePrice === "number" ? Math.round(raw.basePrice) : typeof raw.price === "number" ? Math.round(raw.price) : undefined,
    priceMin:
      typeof raw.basePrice === "number"
        ? Math.round(raw.basePrice)
        : typeof raw.priceMin === "number"
        ? Math.round(raw.priceMin)
        : typeof raw.price === "number"
        ? Math.round(raw.price)
        : undefined,
    description: raw.description ?? undefined,
    year: raw.year ?? undefined,
    technique: raw.technique ?? undefined,
    paper: raw.paper ?? undefined,
    size: raw.dimensions ?? raw.size ?? undefined,
    variants: Array.isArray(raw.variants)
      ? raw.variants.map((v: any) => ({
          id: v.id,
          label: v.label ?? "",
          price:
            typeof v.price === "number"
              ? Math.round(v.price)
              : typeof v.price === "string"
              ? toCents(v.price)
              : 0,
          stock: v.stock ?? v.availableStock ?? null,
        }))
      : [],
  }
}

export default function AdminWorksPage() {
  const [artists, setArtists] = useState<ArtistOption[]>([])
  const [works, setWorks] = useState<CatalogWork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<WorkForm>(emptyWork())
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<{ cover: boolean; mockup: boolean }>({ cover: false, mockup: false })
  const [toast, setToast] = useState<Toast | null>(null)
  const [filter, setFilter] = useState("")
  const toastRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [artistsRes, catalog] = await Promise.all([fetchArtists(), fetchCatalog()])
        if (!active) return
        setArtists(artistsRes)
        setWorks(catalog.artworks)
      } catch (e: any) {
        if (!active) return
        setError(e?.message || "Erreur de chargement")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 3500)
    if (toastRef.current) {
      toastRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    return () => window.clearTimeout(id)
  }, [toast])

  const addToast = (kind: Toast["kind"], message: string) => {
    setToast({ id: `${Date.now()}`, kind, message })
  }

  const grouped = useMemo(() => {
    const map = new Map<string, { artist: ArtistOption | null; items: CatalogWork[] }>()
    for (const w of works) {
      const artist = artists.find((a) => a.id === w.artistId) || null
      if (!map.has(w.artistId)) map.set(w.artistId, { artist, items: [] })
      map.get(w.artistId)!.items.push(w)
    }
    return Array.from(map.values()).map((g) => ({
      artist: g.artist,
      items: g.items.sort((a, b) => a.title.localeCompare(b.title)),
    }))
  }, [works, artists])

  const filteredGroups = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return grouped
    return grouped
      .map((g) => ({
        artist: g.artist,
        items: g.items.filter((w) => {
          const haystack = [w.title, w.slug, g.artist?.name || "", g.artist?.slug || ""].join(" ").toLowerCase()
          return haystack.includes(q)
        }),
      }))
      .filter((g) => g.items.length > 0)
  }, [grouped, filter])

  const handleSelect = (w: CatalogWork) => {
    setForm(workToForm(w))
    setToast(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDuplicate = (w: CatalogWork) => {
    const f = workToForm(w)
    delete f.id
    f.slug = `${f.slug}-copie`
    setForm(f)
    addToast("info", "Duplication prête (slug suffixé)")
  }

  const handleNew = () => {
    setForm(emptyWork())
    setToast(null)
  }

  const handleVariantChange = (index: number, key: keyof VariantForm, value: string) => {
    setForm((prev) => {
      const next = { ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, [key]: value } : v)) }
      return next
    })
  }

  const handleAddVariant = () => {
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { label: "", price: "", stock: "" }] }))
  }

  const handleRemoveVariant = (index: number) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }))
  }

  const handleUpload = async (file: File, target: "cover" | "mockup") => {
    try {
      setUploading((p) => ({ ...p, [target]: true }))
      const url = await uploadWithKind(file, target === "cover" ? "artwork" : "mockup")
      setForm((prev) => ({
        ...prev,
        image: target === "cover" ? url : prev.image,
        mockup: target === "mockup" ? url : prev.mockup,
      }))
      addToast("success", "Image envoyée ✅")
    } catch (err: any) {
      addToast("error", err?.message || "Upload impossible")
    } finally {
      setUploading((p) => ({ ...p, [target]: false }))
    }
  }

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    if (!form.title.trim() || !form.slug.trim() || !form.artistId) {
      addToast("error", "Titre, slug et artiste sont requis.")
      return
    }
    const variants = form.variants
      .map((v) => ({
        id: v.id,
        label: v.label.trim(),
        price: toCents(v.price),
        stock: v.stock === "" ? null : Math.max(0, Math.round(Number(v.stock))),
      }))
      .filter((v) => v.label && v.price > 0)

    if (!variants.length) {
      addToast("error", "Ajoute au moins un format avec un prix.")
      return
    }

    const basePrice = variants.reduce((min, v) => (v.price > 0 && v.price < min ? v.price : min), Infinity)
    const payload = {
      id: form.id,
      slug: form.slug.trim(),
      title: form.title.trim(),
      artistId: form.artistId,
      description: form.description || null,
      technique: form.technique || null,
      year: form.year ? Number(form.year) : null,
      paper: form.paper || null,
      dimensions: form.dimensions || null,
      image: form.image,
      mockup: form.mockup || null,
      published: form.published,
      basePrice: Number.isFinite(basePrice) ? basePrice : 0,
      variants,
    }

    setSaving(true)
    try {
      const isEdit = Boolean(form.id)
      const res = await fetch(isEdit ? `/api/admin/work?id=${encodeURIComponent(form.id || "")}` : "/api/admin/work", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Enregistrement impossible")
      addToast("success", isEdit ? "Œuvre mise à jour ✅" : "Œuvre créée ✅")
      const catalog = await fetchCatalog()
      setWorks(catalog.artworks)
      if (data?.artwork) {
        const normalized = adaptApiWork(data.artwork)
        setForm(workToForm(normalized))
      } else if (payload.slug) {
        const found = catalog.artworks.find((w) => w.slug === payload.slug)
        if (found) setForm(workToForm(found))
      }
    } catch (err: any) {
      addToast("error", err?.message || "Erreur inconnue")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <AdminPageHeader
        title="Œuvres"
        subtitle="Créer ou modifier une fiche œuvre, avec formats et stock."
        actions={[{ type: "link", href: "/admin", label: "← Tableau de bord" }]}
      />

      {toast && (
        <div
          ref={toastRef}
          className={clsx(
            "mb-4 rounded-lg border px-4 py-3 text-sm shadow-sm",
            toast.kind === "success" && "border-green-200 bg-green-50 text-green-800",
            toast.kind === "error" && "border-red-200 bg-red-50 text-red-800",
            toast.kind !== "success" && toast.kind !== "error" && "border-neutral-200 bg-neutral-50",
          )}
        >
          {toast.message}
        </div>
      )}

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <div className="grid items-start gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
            <input
              type="search"
              placeholder="Rechercher titre ou artiste…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleNew}
              className="rounded-md border border-accent-200 bg-accent-50 px-3 py-2 text-sm text-accent-700 hover:bg-accent-100"
            >
              + Nouvelle
            </button>
          </div>
          <div className="max-h-[calc(100vh-240px)] overflow-y-auto px-4 py-3">
            {loading && <div className="py-2 text-sm text-neutral-500">Chargement…</div>}
            {!loading && filteredGroups.length === 0 && (
              <div className="py-2 text-sm text-neutral-500">Aucune œuvre trouvée.</div>
            )}
            <div className="space-y-4">
              {filteredGroups.map((group, idx) => (
                <div key={group.artist?.id || `unknown-${idx}`} className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    {group.artist?.name || "Artiste"}
                  </div>
                  <div className="space-y-2">
                    {group.items.map((w) => {
                      const selected = form.id === w.id
                      const img = firstImage(w)
                      return (
                        <div
                          key={w.id}
                          className={clsx(
                            "relative overflow-hidden rounded-xl border",
                            selected ? "border-accent-200 bg-accent-50" : "border-neutral-200 bg-white",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelect(w)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left"
                          >
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-neutral-50">
                              {img ? (
                                <SmartImage src={img} alt={w.title} fill className="object-cover" sizes="64px" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">Aperçu</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{w.title}</div>
                              <div className="text-xs text-neutral-500">
                                {group.artist?.name || "?"} · {w.slug}
                              </div>
                              {w.priceMin ? (
                                <div className="text-xs text-neutral-600">{formatPrice(w.priceMin)}</div>
                              ) : null}
                            </div>
                          </button>
                          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-3 py-2">
                            <button
                              type="button"
                              onClick={() => handleDuplicate(w)}
                              className="text-xs text-neutral-500 hover:text-neutral-700"
                            >
                              Dupliquer
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0 rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6 p-5" autoComplete="off">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-neutral-500">Fiche</div>
                <h2 className="text-xl font-semibold">{form.id ? "Modifier l’œuvre" : "Nouvelle œuvre"}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
                  />
                  Publiée
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                >
                  {saving ? "Enregistrement…" : form.id ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="mon-oeuvre"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Artiste *</label>
                <select
                  value={form.artistId}
                  onChange={(e) => setForm((p) => ({ ...p, artistId: e.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner…</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.slug})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Année</label>
                  <input
                    type="text"
                    value={form.year}
                    onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="2024"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Technique</label>
                  <input
                    type="text"
                    value={form.technique}
                    onChange={(e) => setForm((p) => ({ ...p, technique: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Sérigraphie…"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Papier</label>
                  <input
                    type="text"
                    value={form.paper}
                    onChange={(e) => setForm((p) => ({ ...p, paper: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Hahnemühle…"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Dimensions</label>
              <input
                type="text"
                value={form.dimensions}
                onChange={(e) => setForm((p) => ({ ...p, dimensions: e.target.value }))}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="40x50 cm…"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Image principale *</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(file, "cover")
                    }}
                    disabled={uploading.cover}
                    className="w-full cursor-pointer text-sm file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-neutral-50"
                  />
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-neutral-50">
                  {form.image ? (
                    <SmartImage src={form.image} alt="Aperçu" fill className="object-contain" sizes="400px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-400">Aucune image</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Mockup (optionnel)</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(file, "mockup")
                    }}
                    disabled={uploading.mockup}
                    className="w-full cursor-pointer text-sm file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-neutral-50"
                  />
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-neutral-50">
                  {form.mockup ? (
                    <SmartImage src={form.mockup} alt="Mockup" fill className="object-contain" sizes="400px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-400">Aucun mockup</div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-neutral-800">Formats & stock</div>
                  <p className="text-xs text-neutral-500">Prix en euros (convertis en centimes côté API). Stock vide = illimité.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100"
                >
                  + Ajouter un format
                </button>
              </div>
              <div className="space-y-3">
                {form.variants.map((v, idx) => (
                  <div key={idx} className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-[2fr,1fr,1fr,auto] md:items-center">
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-500">Label</label>
                        <input
                          type="text"
                          value={v.label}
                          onChange={(e) => handleVariantChange(idx, "label", e.target.value)}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          placeholder="Format A3…"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-500">Prix (€)</label>
                        <input
                          type="text"
                          value={v.price}
                          onChange={(e) => handleVariantChange(idx, "price", e.target.value)}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          placeholder="120"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-500">Stock</label>
                        <input
                          type="text"
                          value={v.stock}
                          onChange={(e) => handleVariantChange(idx, "stock", e.target.value)}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          placeholder="illimité si vide"
                        />
                      </div>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
