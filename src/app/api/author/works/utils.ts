export type VariantInput = {
  id?: string
  label: string
  price: number
  order: number
}

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const normalized = trimmed.replace(',', '.')
    const n = Number(normalized)
    return Number.isFinite(n) ? n : null
  }
  if (value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function sanitizeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed
}

export function toCents(raw: number | null): number | null {
  if (raw === null) return null
  const abs = Math.abs(raw)
  if (abs >= 10000) return Math.round(raw)
  return Math.round(raw * 100)
}

export function normalizeVariants(raw: unknown): { variants: VariantInput[]; errors: string[] } {
  if (!Array.isArray(raw)) return { variants: [], errors: [] }

  const errors: string[] = []
  const variants: VariantInput[] = []

  raw.forEach((entry, index) => {
    const idValue = typeof (entry as any)?.id === 'string' ? (entry as any).id : undefined
    const label = typeof (entry as any)?.label === 'string' ? (entry as any).label.trim() : ''
    const priceRaw = parseNumber((entry as any)?.price)

    if (!label) {
      errors.push(`variant_${index}_label`)
      return
    }
    if (priceRaw === null || priceRaw <= 0) {
      errors.push(`variant_${index}_price`)
      return
    }

    const price = toCents(priceRaw)
    if (price === null || price <= 0) {
      errors.push(`variant_${index}_price`)
      return
    }

    variants.push({
      id: idValue,
      label,
      price,
      order: index,
    })
  })

  return { variants, errors }
}

export type WorkDetailRecord = {
  id: string
  slug: string
  title: string
  description: string | null
  year: number | null
  technique: string | null
  paper: string | null
  dimensions: string | null
  edition: string | null
  imageUrl: string | null
  mockupUrl: string | null
  basePrice: number | null
  published: boolean
  artist: { id: string; name: string; slug: string; isOnVacation: boolean } | null
  variants: Array<{ id: string; label: string; price: number; order: number }>
  updatedAt: Date
}

export function mapWorkDetail(work: WorkDetailRecord) {
  return {
    id: work.id,
    slug: work.slug,
    title: work.title,
    description: work.description,
    year: work.year,
    technique: work.technique,
    paper: work.paper,
    dimensions: work.dimensions,
    edition: work.edition,
    image: work.imageUrl,
    mockup: work.mockupUrl,
    basePriceCents: work.basePrice ?? null,
    published: work.published,
    artist: work.artist
      ? {
          id: work.artist.id,
          name: work.artist.name,
          slug: work.artist.slug,
          isOnVacation: work.artist.isOnVacation,
        }
      : null,
    updatedAt: work.updatedAt?.toISOString() ?? null,
    variants: work.variants
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((variant) => ({
        id: variant.id,
        label: variant.label,
        price: variant.price,
        order: variant.order,
      })),
  }
}

export type WorkSummaryRecord = {
  id: string
  slug: string
  title: string
  artistId: string
  published: boolean
  basePrice: number | null
  imageUrl: string | null
  mockupUrl: string | null
  artist: { id: string; name: string; slug: string; isOnVacation: boolean } | null
  updatedAt: Date
}

export function mapWorkSummary(work: WorkSummaryRecord) {
  return {
    id: work.id,
    slug: work.slug,
    title: work.title,
    artistId: work.artistId,
    artist: work.artist
      ? {
          id: work.artist.id,
          name: work.artist.name,
          slug: work.artist.slug,
          isOnVacation: work.artist.isOnVacation,
        }
      : null,
    published: work.published,
    image: work.imageUrl,
    mockup: work.mockupUrl,
    basePriceCents: work.basePrice ?? null,
    updatedAt: work.updatedAt?.toISOString() ?? null,
    artistOnVacation: work.artist?.isOnVacation ?? false,
  }
}
