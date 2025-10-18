import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parseNumber(value: unknown): number | null {
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

function sanitizeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed
}

function toCents(raw: number | null): number | null {
  if (raw === null) return null
  const abs = Math.abs(raw)
  if (abs >= 10000) return Math.round(raw)
  return Math.round(raw * 100)
}

type VariantInput = {
  id?: string
  label: string
  price: number
  order: number
}

function normalizeVariants(raw: unknown): { variants: VariantInput[]; errors: string[] } {
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

function mapWorkResponse(work: {
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
  artist: { id: string; name: string; slug: string } | null
  variants: Array<{ id: string; label: string; price: number; order: number }>
}) {
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
    artist: work.artist,
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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAuthSession()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const artistIds = Array.isArray(user.artistIds) ? user.artistIds : []
  if (artistIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'not_authorized' }, { status: 403 })
  }

  const work = await prisma.work.findUnique({
    where: { id: params.id },
    include: {
      artist: { select: { id: true, name: true, slug: true } },
      variants: {
        orderBy: { order: 'asc' },
        select: { id: true, label: true, price: true, order: true },
      },
    },
  })

  if (!work || !artistIds.includes(work.artistId)) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json(mapWorkResponse(work))
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getAuthSession()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const artistIds = Array.isArray(user.artistIds) ? user.artistIds : []
  if (artistIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'not_authorized' }, { status: 403 })
  }

  const work = await prisma.work.findUnique({
    where: { id: params.id },
    select: { id: true, artistId: true },
  })

  if (!work || !artistIds.includes(work.artistId)) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, any> = {}
  let hasUpdates = false
  let variantsSync: VariantInput[] | undefined

  if (typeof body.title === 'string') {
    const title = body.title.trim()
    if (title.length > 0) {
      updates.title = title
      hasUpdates = true
    }
  }

  if (body.description === null || typeof body.description === 'string') {
    updates.description = body.description ? body.description.trim() : null
    hasUpdates = true
  }
  if (body.technique === null || typeof body.technique === 'string') {
    updates.technique = body.technique ? body.technique.trim() : null
    hasUpdates = true
  }
  if (body.paper === null || typeof body.paper === 'string') {
    updates.paper = body.paper ? body.paper.trim() : null
    hasUpdates = true
  }
  if (body.dimensions === null || typeof body.dimensions === 'string') {
    updates.dimensions = body.dimensions ? body.dimensions.trim() : null
    hasUpdates = true
  }
  if (body.edition === null || typeof body.edition === 'string') {
    updates.edition = body.edition ? body.edition.trim() : null
    hasUpdates = true
  }

  if (body.year === null || body.year === '' || typeof body.year === 'number' || typeof body.year === 'string') {
    const year = parseNumber(body.year)
    updates.year = year === null ? null : Math.round(year)
    hasUpdates = true
  }

  if (body.basePrice === null || body.basePrice === '' || typeof body.basePrice === 'number' || typeof body.basePrice === 'string') {
    const euros = parseNumber(body.basePrice)
    updates.basePrice = euros != null ? toCents(euros) : null
    hasUpdates = true
  }

  if (typeof body.published === 'boolean') {
    updates.published = body.published
    hasUpdates = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'image')) {
    updates.imageUrl = sanitizeUrl(body.image)
    hasUpdates = true
  }
  if (Object.prototype.hasOwnProperty.call(body, 'mockup')) {
    updates.mockupUrl = sanitizeUrl(body.mockup)
    hasUpdates = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'variants')) {
    const { variants, errors } = normalizeVariants(body.variants)
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, error: 'invalid_variants', detail: errors }, { status: 400 })
    }
    if (variants.length === 0) {
      return NextResponse.json({ ok: false, error: 'variants_required' }, { status: 400 })
    }
    variantsSync = variants
  }

  if (!hasUpdates && variantsSync === undefined) {
    return NextResponse.json({ ok: true, updated: false })
  }

  let result
  try {
    result = await prisma.$transaction(async (tx) => {
      if (hasUpdates) {
        await tx.work.update({
          where: { id: params.id },
          data: updates,
        })
      }

      if (variantsSync !== undefined) {
        const existing = await tx.variant.findMany({
          where: { workId: params.id },
          select: { id: true },
        })
        const existingIds = new Set(existing.map((v) => v.id))
        const incomingIds = new Set(variantsSync.filter((v) => v.id).map((v) => v.id as string))
        const toDelete = existing
          .filter((variant) => !incomingIds.has(variant.id))
          .map((variant) => variant.id)

        if (toDelete.length > 0) {
          await tx.variant.deleteMany({ where: { id: { in: toDelete }, workId: params.id } })
        }

        for (const variant of variantsSync) {
          if (variant.id) {
            if (!existingIds.has(variant.id)) {
              throw new Error('invalid_variant_id')
            }
            await tx.variant.update({
              where: { id: variant.id },
              data: {
                label: variant.label,
                price: variant.price,
                order: variant.order,
              },
            })
          } else {
            await tx.variant.create({
              data: {
                workId: params.id,
                label: variant.label,
                price: variant.price,
                order: variant.order,
              },
            })
          }
        }
      }

      const fresh = await tx.work.findUnique({
        where: { id: params.id },
        include: {
          artist: { select: { id: true, name: true, slug: true } },
          variants: {
            orderBy: { order: 'asc' },
            select: { id: true, label: true, price: true, order: true },
          },
        },
      })

      if (!fresh) throw new Error('work_not_found_after_update')
      return fresh
    })
  } catch (error: any) {
    if (error?.message === 'invalid_variant_id') {
      return NextResponse.json({ ok: false, error: 'invalid_variant_id' }, { status: 400 })
    }
    throw error
  }

  return NextResponse.json({ ok: true, work: mapWorkResponse(result) })
}
