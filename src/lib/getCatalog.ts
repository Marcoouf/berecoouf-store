// src/lib/getCatalog.ts
// Lecture du catalogue depuis Prisma (DB) et normalisation pour l'UI

import { prisma } from '@/lib/prisma'

// DB shapes used locally — avoids coupling to generated Prisma types
type DbArtist = {
  id: string
  slug: string
  name: string
  handle: string | null
  bio: string | null
  avatarUrl: string | null
  coverUrl: string | null
}
type DbVariant = {
  id: string
  label: string
  price: number // stored in cents in DB
}
type DbWork = {
  id: string
  slug: string
  title: string
  imageUrl: string | null
  mockupUrl: string | null
  artistId: string
  basePrice: number | null
  description: string | null
  year: number | null
  technique: string | null
  paper: string | null
  dimensions: string | null
  edition: string | null
  variants: DbVariant[]
}

// --- Types minimaux consommés par l'UI ---
export type Artist = {
  id: string
  slug: string
  name: string
  handle?: string
  bio?: string
  avatar?: string
  cover?: string | { url: string }
}

export type Variant = {
  id: string
  label: string
  price: number // en euros pour l'UI
  type?: 'digital' | 'print'
  sku?: string
  stock?: number | null
}

export type Artwork = {
  id: string
  slug: string
  title: string
  // source hétérogène : on accepte image / images / mockup
  image?: string
  images?: Array<string | { url: string }>
  mockup?: string
  cover?: string | { url: string }
  artistId: string
  artist?: Pick<Artist, 'id' | 'slug' | 'name'>
  price?: number // prix par défaut si pas de variants (euros)
  description?: string
  year?: number
  technique?: string
  paper?: string
  size?: string
  edition?: string
  formats?: Array<{ id: string; label: string; price: number }>
  variants?: Variant[]
  priceMin?: number
}

// --- Helpers ---
function isArtist(x: any): x is Artist {
  return !!x && typeof x === 'object' && typeof x.id === 'string' && typeof x.slug === 'string' && typeof x.name === 'string'
}

function isArtwork(x: any): x is Artwork {
  return !!x && typeof x === 'object' && typeof x.id === 'string' && typeof x.slug === 'string' && typeof x.title === 'string' && typeof x.artistId === 'string'
}

function uniqBy<T>(arr: T[], key: (t: T) => string) {
  const seen = new Set<string>()
  const out: T[] = []
  for (const it of arr) {
    const k = key(it)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(it)
    }
  }
  return out
}

function toUrlString(x: unknown): string | null {
  if (!x) return null
  if (typeof x === 'string') return x
  if (typeof x === 'object' && x && 'url' in (x as any) && typeof (x as any).url === 'string') return (x as any).url as string
  return null
}

function asArray<T>(x: T | T[] | null | undefined): T[] {
  if (Array.isArray(x)) return x
  return x ? [x] : []
}

const fromCents = (n: number | null | undefined) => (typeof n === 'number' ? Math.round(n) / 100 : undefined)

// --- Normalisation d'une oeuvre ---
function normalizeArtwork(raw: Artwork, artistIndex: Map<string, Artist>): Artwork {
  const imagesCandidates: Array<string | { url: string }> = [
    ...(Array.isArray(raw.images) ? raw.images : []),
    ...asArray(raw.image),
    ...asArray(raw.mockup),
    ...asArray(raw.cover as any),
  ]
  const normalizedImages = imagesCandidates
    .map((it) => toUrlString(it as any))
    .filter((u): u is string => typeof u === 'string' && u.length > 0)

  const coverUrl = toUrlString(raw.cover) || normalizedImages[0] || null

  // Variants : on rétro-compatibilise `formats` → `variants`.
  let variants: Variant[] | undefined = undefined
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    variants = raw.variants
  } else if (Array.isArray(raw.formats) && raw.formats.length > 0) {
    variants = raw.formats.map((f) => ({ id: f.id, label: f.label, price: f.price, type: 'print' as const }))
  } else if (typeof raw.price === 'number') {
    variants = [{ id: `${raw.id}-digital`, label: 'Numérique', price: raw.price, type: 'digital' }]
  }

  const priceMin = Array.isArray(variants) && variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : raw.price ?? undefined

  const artist = artistIndex.get(raw.artistId)

  return {
    ...raw,
    images: normalizedImages.length > 0 ? normalizedImages.map((u) => ({ url: u })) : undefined,
    cover: coverUrl ? { url: coverUrl } : undefined,
    artist: artist ? { id: artist.id, slug: artist.slug, name: artist.name } : raw.artist,
    variants,
    priceMin,
  }
}

/**
 * getCatalog (DB → UI)
 * - lit artistes & œuvres via Prisma
 * - mappe les champs DB → UI
 * - normalise les œuvres (images[], cover{url}, artist embarqué, variants, priceMin)
 */
export async function getCatalog(): Promise<{ artists: Artist[]; artworks: Artwork[] }> {
  try {
    const [dbArtists, dbWorks] = (await Promise.all([
      prisma.artist.findMany({ orderBy: { name: 'asc' } }),
      prisma.work.findMany({
        include: { variants: true },
        orderBy: [{ year: 'desc' }, { title: 'asc' }],
      }),
    ])) as [DbArtist[], DbWork[]]

    const artists: Artist[] = dbArtists.map((a: DbArtist) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      handle: a.handle ?? undefined,
      bio: a.bio ?? undefined,
      avatar: a.avatarUrl ?? undefined,
      cover: a.coverUrl ?? undefined,
    }))

    const artworksRaw: Artwork[] = dbWorks.map((w) => ({
      id: w.id,
      slug: w.slug,
      title: w.title,
      image: w.imageUrl || undefined,
      mockup: w.mockupUrl || undefined,
      cover: w.imageUrl || undefined,
      artistId: w.artistId,
      price: fromCents(w.basePrice),
      description: w.description ?? undefined,
      year: w.year ?? undefined,
      technique: w.technique ?? undefined,
      paper: w.paper ?? undefined,
      size: w.dimensions ?? undefined,
      edition: w.edition ?? undefined,
      variants: (Array.isArray((w as any).variants) ? (w as any).variants : []).map((v: DbVariant) => ({ id: v.id, label: v.label, price: fromCents(v.price) ?? 0 })),
    }))

    // Fusion/dé-doublonnage (inutile ici, mais on garde la même sortie et normalisation)
    const artistIndex = new Map<string, Artist>(artists.map((a) => [a.id, a]))
    const artworksNormalized = artworksRaw.map((w) => normalizeArtwork(w, artistIndex)).filter(isArtwork)

    // Tri léger : par année décroissante puis titre (déjà ordonné en DB, ici on garantit)
    artworksNormalized.sort((a, b) => {
      const ya = typeof a.year === 'number' ? a.year : -Infinity
      const yb = typeof b.year === 'number' ? b.year : -Infinity
      if (yb !== ya) return yb - ya
      return (a.title || '').localeCompare(b.title || '')
    })

    return { artists, artworks: artworksNormalized }
  } catch (e) {
    console.error('getCatalog: prisma error', e)
    return { artists: [], artworks: [] }
  }
}