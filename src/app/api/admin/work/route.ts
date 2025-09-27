import { NextResponse, NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// --- Simple admin guard based on ADMIN_KEY (no shared import needed)
function withAdmin<T extends (req: NextRequest, ...rest: any[]) => Promise<Response>>(handler: T) {
  return async (req: NextRequest, ...rest: any[]) => {
    // Accept both server and public env keys (public used by admin client fetch)
    const expectedKeys = [process.env.ADMIN_KEY, process.env.NEXT_PUBLIC_ADMIN_KEY]
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim())

    if (expectedKeys.length === 0) {
      return NextResponse.json({ ok: false, error: 'Server misconfigured: no ADMIN_KEY set' }, { status: 500 })
    }

    // Extract provided key from multiple places
    const url = new URL(req.url)
    const fromHeader = (req.headers.get('x-admin-key') || '').trim()
    const fromAuth = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
    const fromCookie = (req.cookies?.get?.('admin_key')?.value || '').trim()
    const fromQuery = (url.searchParams.get('admin_key') || '').trim()

    const provided = fromHeader || fromAuth || fromCookie || fromQuery
    const ok = provided && expectedKeys.some((k) => k === provided)
    if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    return handler(req, ...rest)
  }
}

// ----------------- Types d'entrée normalisés -----------------
export type VariantIn = { id?: string; label: string; price: number; sku?: string | null; stock?: number | null }
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
    basePrice = variants.reduce((min, v) => (v.price > 0 && v.price < min ? v.price : min), Infinity)
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

// ----------------- Handlers -----------------
export const POST = withAdmin(async (req: NextRequest) => {
  const data = normalize(await req.json())

  if (!data.image) return NextResponse.json({ ok: false, error: 'image_required' }, { status: 400 })

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
        ...(data.variants && data.variants.length
          ? { variants: { create: data.variants.map((v) => ({ label: v.label, price: v.price })) } }
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
  if (!data.image) return NextResponse.json({ ok: false, error: 'image_required' }, { status: 400 })

  const artistResolvedId = await resolveArtistId(data.artistId)
  if (!artistResolvedId) return NextResponse.json({ ok: false, error: 'unknown_artist' }, { status: 400 })

  const work = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
    const incoming = data.variants ?? []
    const keepIds = incoming
      .filter((v) => typeof v.id === 'string' && v.id.trim().length > 0)
      .map((v) => v.id as string)

    // Supprimer celles retirées dans l'admin
    await tx.variant.deleteMany({ where: { workId: id, NOT: { id: { in: keepIds.length ? keepIds : ['__none__'] } } } })

    // Mettre à jour / Créer
    for (const v of incoming) {
      if (v.id && v.id.trim()) {
        await tx.variant.update({ where: { id: v.id }, data: { label: v.label, price: v.price } })
      } else {
        await tx.variant.create({ data: { workId: id, label: v.label, price: v.price } })
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

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.variant.deleteMany({ where: { workId: id } })
    return tx.work.delete({ where: { id }, select: { slug: true } })
  })

  // Revalidate public pages
  revalidatePath('/artworks')
  revalidatePath(`/artworks/${deleted.slug}`)

  return NextResponse.json({ ok: true })
})