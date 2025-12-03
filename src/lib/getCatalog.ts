// src/lib/getCatalog.ts
// Lecture du catalogue depuis Prisma (DB) et normalisation pour l'UI

import { prisma } from '@/lib/prisma'
import { euro } from '@/lib/format'
import { unstable_noStore as noStore } from 'next/cache'

// === Shapes minimalistes (décorrélées des types Prisma générés) ===
type DbArtist = {
  id: string
  slug: string
  name: string
  bio: string | null
  image: string | null        // cover/hero
  portrait: string | null     // avatar rond
  contactEmail: string | null
  socials?: string[] | null
  handle?: string | null
  isArchived?: boolean
  isOnVacation?: boolean
  isHidden?: boolean
}

type DbVariant = {
  id: string
  label: string
  price: number // centimes
  stock: number | null
}

type DbWork = {
  id: string
  slug: string
  title: string
  imageUrl: string | null
  mockupUrl: string | null
  artistId: string
  basePrice: number | null    // centimes
  description: string | null
  year: number | null
  technique: string | null
  paper: string | null
  dimensions: string | null
  edition: string | null
  variants: DbVariant[]
}

export type Artist = {
  id: string
  slug: string
  name: string
  handle?: string
  bio?: string
  portrait?: string
  image?: string
  contactEmail?: string
  isOnVacation?: boolean
  isHidden?: boolean
}

export type Variant = {
  id: string
  label: string
  price: number // centimes
  type?: 'digital' | 'print'
  sku?: string
  stock?: number | null      // stock restant (si limité)
  availableStock?: number | null
}

export type Artwork = {
  id: string
  slug: string
  title: string
  image?: string
  images?: Array<string | { url: string }>
  mockup?: string
  cover?: string | { url: string }
  artistId: string
  artist?: Pick<Artist, 'id' | 'slug' | 'name' | 'isOnVacation'>
  price?: number // centimes
  description?: string
  year?: number
  technique?: string
  paper?: string
  size?: string
  edition?: string
  formats?: Array<{ id: string; label: string; price: number }>
  variants?: Variant[]
  priceMin?: number
  priceMinFormatted?: string
  artistOnVacation?: boolean
}

// --- Helpers ---
function isArtwork(x: any): x is Artwork {
  return !!x && typeof x === 'object' && typeof x.id === 'string' && typeof x.slug === 'string' && typeof x.title === 'string' && typeof x.artistId === 'string'
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

// DB stocke en centimes → on renvoie des centimes (identité)
const fromCents = (n: number | null | undefined) => (typeof n === 'number' ? Math.round(n) : undefined)

const normalizeSlug = (slug: string | null | undefined) =>
  typeof slug === 'string' && slug.length > 0 ? slug.trim().toLowerCase() : ''


// --- Normalisation d'une œuvre ---
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

  // Variants : on prend uniquement celles issues de la DB
  const variants: Variant[] = Array.isArray(raw.variants) ? raw.variants : []
  const purchasableVariants = variants.filter((v) => v.stock == null || v.stock > 0)

  // Prix minimal en centimes (base + variants), en ignorant 0
  const pool: number[] = []
  if (typeof raw.price === 'number' && raw.price > 0) pool.push(raw.price)
  for (const v of purchasableVariants) if (typeof v.price === 'number' && v.price > 0) pool.push(v.price)
  const priceMin = pool.length ? Math.min(...pool) : undefined
  const priceMinFormatted = typeof priceMin === 'number' ? euro(priceMin) : undefined

  const artist = artistIndex.get(raw.artistId)

  return {
    ...raw,
    images: normalizedImages.length > 0 ? normalizedImages.map((u) => ({ url: u })) : undefined,
    cover: coverUrl ? { url: coverUrl } : undefined,
    artist: artist ? { id: artist.id, slug: artist.slug, name: artist.name, isOnVacation: artist.isOnVacation } : raw.artist,
    variants,
    priceMin,
    priceMinFormatted,
    artistOnVacation: artist?.isOnVacation ?? false,
  }
}

function isRemoteUrl(u: string): boolean {
  return /^(https?:)?\/\//.test(u)
}

function primaryImageUrl(a: Artwork): string | null {
  const candidates: Array<string | null> = [
    toUrlString(a.cover as any),
    typeof a.image === 'string' ? a.image : null,
    typeof a.mockup === 'string' ? a.mockup : null,
    ...(Array.isArray(a.images) ? a.images.map((it: any) => toUrlString(it)) : []),
  ]
  return candidates.find((u) => !!u) || null
}

/**
 * getCatalog (DB → UI)
 */
export async function getCatalog(): Promise<{ artists: Artist[]; artworks: Artwork[] }> {
  noStore()
  try {
    // On tape explicitement les `select` pour obtenir exactement les shapes souhaités (et éviter les cast hasardeux).
    const [dbArtists, dbWorks] = await Promise.all([
  prisma.artist.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      image: true,      // cover/hero
      portrait: true,   // avatar
      contactEmail: true,
      socials: true,
      handle: true,
      isArchived: true,
      isHidden: true,
      isOnVacation: true,
    },
  }),
  prisma.work.findMany({
    where: { published: true, deletedAt: null, artist: { isArchived: false, isHidden: false, deletedAt: null } },
    orderBy: [{ year: 'desc' }, { title: 'asc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
      mockupUrl: true,
      artistId: true,
      basePrice: true,
      description: true,
      year: true,
      technique: true,
      paper: true,
      dimensions: true,
      edition: true,
      variants: {
        select: { id: true, label: true, price: true, stock: true }, // <= nested select
      },
    },
  }),
] as const)

    // Stock déjà vendu/réservé (commandes pending ou paid)
    const allVariantIds = dbWorks.flatMap((w: any) => (Array.isArray(w?.variants) ? w.variants : []).map((v: any) => v.id)).filter(Boolean)
    const variantStockUsage = allVariantIds.length
      ? await prisma.orderItem.groupBy({
          by: ['variantId'],
          where: { variantId: { in: allVariantIds }, order: { status: { in: ['pending', 'paid'] } } },
          _sum: { qty: true },
        })
      : []
    const usedQty = new Map<string, number>(variantStockUsage.map((v) => [v.variantId, Number(v._sum?.qty ?? 0)]))

    // Artistes actifs uniquement
    const artists: Artist[] = (dbArtists as unknown as DbArtist[])
      .filter((a) => !a.isArchived && !a.isHidden)
      .map((a) => {
        const portrait = toUrlString(a.portrait) ?? toUrlString(a.image) ?? undefined
        const cover = toUrlString(a.image) ?? toUrlString(a.portrait) ?? undefined
        const email = typeof a.contactEmail === 'string' ? a.contactEmail.trim() : ''
        return {
          id: a.id,
          slug: normalizeSlug(a.slug),
          name: a.name,
          handle: a.handle ?? undefined,
          bio: a.bio ?? undefined,
          portrait,
          image: cover,
          contactEmail: email || undefined,
          isOnVacation: Boolean(a.isOnVacation),
          isHidden: Boolean(a.isHidden),
        }
      })

    const artworksRaw: Artwork[] = (dbWorks as unknown as DbWork[]).map((w) => ({
      id: w.id,
      slug: normalizeSlug(w.slug),
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
      variants: (Array.isArray(w.variants) ? w.variants : []).map((v) => {
        const totalStock = v.stock == null ? null : Math.max(0, Number(v.stock))
        const alreadyUsed = usedQty.get(v.id) ?? 0
        const remaining = totalStock == null ? null : Math.max(0, totalStock - alreadyUsed)
        return {
          id: v.id,
          label: v.label,
          price: fromCents(v.price) ?? 0,
          stock: remaining,
          availableStock: remaining,
        }
      }),
    }))

    const artistIndex = new Map<string, Artist>(artists.map((a) => [a.id, a]))
    const artworksNormalized = artworksRaw
      .filter((w) => artistIndex.has(w.artistId))
      .map((w) => normalizeArtwork(w, artistIndex))
      .filter(isArtwork)

    const artworksFiltered = artworksNormalized.filter((a) => {
      const url = primaryImageUrl(a)
      if (!url) return false
      if (url === 'about:blank') return false
      return isRemoteUrl(url)
    })

    artworksFiltered.sort((a, b) => (a.title || '').localeCompare(b.title || ''))

    return { artists, artworks: artworksFiltered }
  } catch (e) {
    console.error('getCatalog: prisma error', e)
    return { artists: [], artworks: [] }
  }
}
