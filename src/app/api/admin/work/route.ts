import { NextResponse, NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { deleteBlobIfNeeded } from '@/lib/blob'
import { withAdmin } from '../_lib/withAdmin'

// ----------------- Types d'entrée normalisés -----------------
export type VariantIn = { id?: string; label: string; price: number; order?: number; sku?: string | null; stock?: number | null }
export type WorkIn = {
  id?: string
  slug: string
  title: string
  artistId: string // id OU slug
  description?: string | null
  technique?: string | null
  year?: number | null
  paper?: string | null
  dimensions?: string | null
  image: string // URL publique requise
  mockup?: string | null
  basePrice: number // CENTIMES
  published?: boolean
  variants?: VariantIn[] // PRIX EN CENTIMES
}

// ----------------- Helpers -----------------
const pickNumber = (v: any): number | null => {
  if (v === undefined || v === null || v === '') return null
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const toCents = (raw: number | null): number => {
  if (!raw) return 0
  // Si ça ressemble à des euros (< 10000), convertir, sinon on considère que c'est déjà des centimes
  return raw > 0 && raw < 10000 ? Math.round(raw * 100) : Math.round(raw)
}

async function resolveArtistId(key: string) {
  const k = String(key || '').trim()
  if (!k) return null
  const a = await prisma.artist.findFirst({ where: { OR: [{ id: k }, { slug: k }] }, select: { id: true } })
  return a?.id ?? null
}

function normalize(body: any): WorkIn {
  // Accepte `variants` (nouveau) OU `formats` (héritage admin)
  const rawVariants: any[] = Array.isArray(body?.variants)
    ? body.variants
    : Array.isArray(body?.formats)
    ? body.formats
    : []

  const variants: VariantIn[] = rawVariants.map((v) => {
    const raw = pickNumber(v?.price) ?? 0
    const priceCents = toCents(raw)
    return {
      id: v?.id || undefined,
      label: String(v?.label ?? '').trim(),
      price: priceCents,
      sku: v?.sku ?? null,
      stock: v?.stock ?? null,
    }
  })

  // base price: accepte `basePrice` (euros/centimes) OU `price` (euros), sinon min(variants)
  const rawBase = pickNumber(body?.basePrice)
  const rawPriceEuros = rawBase ?? pickNumber(body?.price)
  let basePrice = toCents(rawPriceEuros ?? 0)
  if (!basePrice && variants.length) {
    basePrice = variants.reduce((min, v) => (v.price > 0 && v.price < min ? v.price : min), Infinity as any)
    if (!Number.isFinite(basePrice)) basePrice = 0
  }

  const image = String(body?.image || body?.imageUrl || '').trim()
  const mockup = body?.mockup ? String(body.mockup).trim() : body?.mockupUrl ? String(body.mockupUrl).trim() : null

  return {
    id: body?.id ? String(body.id).trim() : undefined,
    slug: String(body?.slug || '').trim(),
    title: String(body?.title || '').trim(),
    artistId: String(body?.artistId || '').trim(),
    description: body?.description ?? null,
    technique: body?.technique ?? null,
    year: body?.year ? Number(body.year) : null,
    paper: body?.paper ?? null,
    dimensions: body?.dimensions ?? body?.size ?? null,
    image,
    mockup,
    basePrice,
    published: body?.published ?? true,
    variants,
  }
}

const sortVariantsAscending = (variants?: VariantIn[]): VariantIn[] => {
  if (!Array.isArray(variants)) return []
  return variants
    .slice()
    .sort((a, b) => (a.price || 0) - (b.price || 0))
    .map((variant, index) => ({ ...variant, order: index }))
}

// ----------------- Validation stricte (print only) -----------------
function ensureOnlyPrint(data: WorkIn, raw: any) {
  const errs: string[] = []

  if (!data.slug) errs.push('slug_required')
  if (!data.title) errs.push('title_required')
  if (!data.artistId) errs.push('artist_required')
  if (!data.image) errs.push('image_required')
  if (data.image.startsWith('/images/')) errs.push('image_must_be_remote')

  // variants
  if (!Array.isArray(data.variants) || data.variants.length === 0) errs.push('variants_required')

  // Si l'UI envoie un champ type, il doit être 'print'
  const list = Array.isArray(raw?.variants) ? raw.variants : Array.isArray(raw?.formats) ? raw.formats : []
  const invalidType = list.some((v: any) => {
    if (v == null || typeof v !== 'object') return false
    if (v.type == null) return false
    const t = String(v.type).toLowerCase().trim()
    return t !== 'print'
  })
  if (invalidType) errs.push('invalid_variant_type')

  for (const v of data.variants ?? []) {
    if (!v.label?.trim()) errs.push('variant_label_required')
    if (!Number.isFinite(v.price) || v.price <= 0) errs.push(`variant_price_invalid:${v.label || ''}`)
    if (v.stock != null && (!Number.isInteger(v.stock) || v.stock < 0)) errs.push(`variant_stock_invalid:${v.label || ''}`)
  }

  // basePrice: doit être > 0 ; sinon on le remplace par le min variant si possible
  if (!Number.isFinite(data.basePrice) || data.basePrice <= 0) {
    const min = (data.variants ?? []).reduce((acc, v) => (v.price > 0 && v.price < acc ? v.price : acc), Infinity)
    if (Number.isFinite(min)) {
      ;(data as any).basePrice = min
    } else {
      errs.push('base_price_invalid')
    }
  }

  if (errs.length) {
    const detail = Array.from(new Set(errs))
    const e: any = new Error('validation_failed')
    e.code = 'validation_failed'
    e.detail = detail
    throw e
  }
}

// ----------------- Handlers -----------------
export const POST = withAdmin(async (req: NextRequest) => {
  const raw = await req.json().catch(() => ({} as any))
  const data = normalize(raw)

  try {
    ensureOnlyPrint(data, raw)
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.code || 'validation_failed', detail: e?.detail || [e?.message] }, { status: 400 })
  }
  const sortedVariants = sortVariantsAscending(data.variants)

  const artistResolvedId = await resolveArtistId(data.artistId)
  if (!artistResolvedId) return NextResponse.json({ ok: false, error: 'unknown_artist' }, { status: 400 })

  const created = await prisma.work
    .create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        technique: data.technique,
        year: data.year,
        paper: data.paper,
        dimensions: data.dimensions,
        imageUrl: data.image,
        mockupUrl: data.mockup,
        basePrice: data.basePrice, // **CENTIMES**
        published: data.published ?? true,
        artist: { connect: { id: artistResolvedId } },
        ...(sortedVariants.length
          ? {
              variants: {
                create: sortedVariants.map((v) => ({ label: v.label, price: v.price, order: v.order ?? 0 })),
              },
            }
          : {}),
      },
      include: { variants: true, artist: true },
    })
    .catch((e: any) => (e?.code === 'P2002' ? null : Promise.reject(e)))

  if (!created) return NextResponse.json({ ok: false, error: 'slug_conflict' }, { status: 409 })

  // Revalidate public pages
  revalidatePath('/artworks')
  revalidatePath(`/artworks/${created.slug}`)

  return NextResponse.json({ ok: true, artwork: created }, { status: 201 })
})

export const PUT = withAdmin(async (req: NextRequest) => {
  // On ne lit le body qu'une seule fois
  const url = new URL(req.url)
  const body = await req.json().catch(() => ({} as any))
  const id = url.searchParams.get('id') || body.id
  if (!id) return NextResponse.json({ ok: false, error: 'missing_id' }, { status: 400 })

  const data = normalize(body)

  try {
    ensureOnlyPrint(data, body)
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.code || 'validation_failed', detail: e?.detail || [e?.message] }, { status: 400 })
  }

  const artistResolvedId = await resolveArtistId(data.artistId)
  if (!artistResolvedId) return NextResponse.json({ ok: false, error: 'unknown_artist' }, { status: 400 })
  const sortedVariants = sortVariantsAscending(data.variants)

  const work = await prisma.$transaction(async (tx: any) => {
    await tx.work.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        technique: data.technique,
        year: data.year,
        paper: data.paper,
        dimensions: data.dimensions,
        imageUrl: data.image,
        mockupUrl: data.mockup,
        basePrice: data.basePrice, // **CENTIMES**
        published: data.published ?? true,
        artist: { connect: { id: artistResolvedId } },
      },
    })

    // Sync variants
    const incoming = sortedVariants
    const keepIds = incoming
      .filter((v) => typeof v.id === 'string' && v.id.trim().length > 0)
      .map((v) => v.id as string)

    // Supprimer celles retirées dans l'admin
    await tx.variant.deleteMany({ where: { workId: id, NOT: { id: { in: keepIds.length ? keepIds : ['__none__'] } } } })

    // Mettre à jour / Créer
    for (const v of incoming) {
      if (v.id && v.id.trim()) {
        await tx.variant.update({
          where: { id: v.id },
          data: { label: v.label, price: v.price, order: v.order ?? 0 },
        })
      } else {
        await tx.variant.create({
          data: { workId: id, label: v.label, price: v.price, order: v.order ?? 0 },
        })
      }
    }

    return tx.work.findUnique({ where: { id }, include: { variants: true, artist: true } })
  })

  if (!work) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

  // Revalidate public pages
  revalidatePath('/artworks')
  revalidatePath(`/artworks/${work.slug}`)

  return NextResponse.json({ ok: true, artwork: work }, { status: 200 })
})

export const DELETE = withAdmin(async (req: NextRequest) => {
  const url = new URL(req.url)
  const id = url.searchParams.get('id') || ''
  if (!id) return NextResponse.json({ ok: false, error: 'missing_id' }, { status: 400 })

  const work = await prisma.work.findUnique({
    where: { id },
    select: { slug: true, published: true, deletedAt: true, imageUrl: true, mockupUrl: true },
  })
  if (!work || work.deletedAt) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

  const linkedOrders = await prisma.orderItem.count({ where: { workId: id } })
  const imageUrl = work.imageUrl ?? null
  const mockupUrl = work.mockupUrl ?? null

  if (linkedOrders > 0) {
    const archivedSlug = `${work.slug}-archive-${Date.now()}`.slice(0, 60)
    await prisma.work.update({
      where: { id },
      data: {
        published: false,
        slug: archivedSlug,
        deletedAt: new Date(),
      },
    })
    await Promise.all([deleteBlobIfNeeded(imageUrl), deleteBlobIfNeeded(mockupUrl)])
    revalidatePath('/artworks')
    revalidatePath(`/artworks/${work.slug}`)
    return NextResponse.json({ ok: true, softDeleted: true })
  }

  const deleted = await prisma.$transaction(async (tx: any) => {
    await tx.variant.deleteMany({ where: { workId: id } })
    return tx.work.delete({ where: { id }, select: { slug: true } })
  })
  await Promise.all([deleteBlobIfNeeded(imageUrl), deleteBlobIfNeeded(mockupUrl)])

  // Revalidate public pages
  revalidatePath('/artworks')
  revalidatePath(`/artworks/${deleted.slug}`)

  return NextResponse.json({ ok: true })
})
