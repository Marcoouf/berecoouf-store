import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// --- Simple admin guard based on ADMIN_KEY (no shared import needed)
function withAdmin<T extends (req: NextRequest, ...rest: any[]) => Promise<Response>>(handler: T) {
  return async (req: NextRequest, ...rest: any[]) => {
    const expected = String(process.env.ADMIN_KEY || '').trim();
    // Accept key via header, Authorization: Bearer, cookie or query param (for convenience in local)
    const url = new URL(req.url);
    const fromHeader = (req.headers.get('x-admin-key') || '').trim();
    const fromAuth = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const fromCookie = (req.cookies?.get?.('admin_key')?.value || '').trim();
    const fromQuery = (url.searchParams.get('admin_key') || '').trim();
    const key = fromHeader || fromAuth || fromCookie || fromQuery;

    if (!expected || !key || key !== expected) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, ...rest);
  };
}

type VariantIn = { id?: string; label: string; price: number; sku?: string | null; stock?: number | null }
type WorkIn = {
  id?: string
  slug: string
  title: string
  artistId: string
  description?: string | null
  technique?: string | null
  year?: number | null
  paper?: string | null
  dimensions?: string | null
  image: string
  mockup?: string | null
  basePrice: number
  published?: boolean
  variants?: VariantIn[]
}

async function resolveArtistId(key: string) {
  const k = String(key || '').trim();
  if (!k) return null;
  const a = await prisma.artist.findFirst({ where: { OR: [{ id: k }, { slug: k }] }, select: { id: true } });
  return a?.id ?? null;
}

function normalize(body: any): WorkIn {
  const rawBase = Number(body?.basePrice ?? 0)
  // Convert to cents if it looks like a euro amount (e.g. 160 -> 16000, 160.5 -> 16050)
  const basePriceCents = rawBase > 0 && rawBase < 10000 ? Math.round(rawBase * 100) : Math.round(rawBase)

  const vsIn = Array.isArray(body?.variants) ? (body.variants as VariantIn[]) : []

  return {
    id: body?.id ? String(body.id).trim() : undefined,
    slug: String(body?.slug || '').trim(),
    title: String(body?.title || '').trim(),
    artistId: String(body?.artistId || '').trim(),
    description: body?.description ?? null,
    technique: body?.technique ?? null,
    year: body?.year ? Number(body.year) : null,
    paper: body?.paper ?? null,
    dimensions: body?.dimensions ?? null,
    image: String(body?.image || '').trim(),
    mockup: body?.mockup ? String(body.mockup).trim() : null,
    basePrice: basePriceCents,
    published: body?.published ?? true,
    variants: vsIn.map((v) => {
      const raw = Number(v.price ?? 0)
      const priceCents = raw > 0 && raw < 10000 ? Math.round(raw * 100) : Math.round(raw)
      return {
        id: v.id,
        label: String(v.label ?? '').trim(),
        price: priceCents,
        sku: v.sku ?? null,
        stock: v.stock ?? null,
      }
    }),
  }
}

export const POST = withAdmin(async (req: NextRequest) => {
  const data = normalize(await req.json())
  const artistResolvedId = await resolveArtistId(data.artistId);
  if (!artistResolvedId) {
    return NextResponse.json({ ok: false, error: 'Artist inconnu (id ou slug)' }, { status: 400 });
  }
  // slug unique : message clair si conflit
  const created = await prisma.work.create({
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
      basePrice: data.basePrice,
      published: data.published ?? true,
      artist: { connect: { id: artistResolvedId } },
      variants: {
        create: (data.variants ?? []).map((v, i) => ({
          label: v.label,
          price: v.price,
          // order: i, // uncomment if you want to persist display order
        })),
      },
    },
    include: { variants: true, artist: true },
  }).catch((e: any) => {
    if (e?.code === 'P2002') return null
    throw e
  })

  if (!created) return NextResponse.json({ ok: false, error: 'Slug déjà utilisé' }, { status: 409 })
  return NextResponse.json({ ok: true, artwork: created }, { status: 201 })
})

export const PUT = withAdmin(async (req: NextRequest) => {
  const url = new URL(req.url)
  const id = url.searchParams.get('id') || (await req.clone().json()).id
  if (!id) return NextResponse.json({ ok: false, error: 'Missing work id' }, { status: 400 })
  const data = normalize(await req.json())
  const artistResolvedId = await resolveArtistId(data.artistId);
  if (!artistResolvedId) {
    return NextResponse.json({ ok: false, error: 'Artist inconnu (id ou slug)' }, { status: 400 });
  }

  const work = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // update champs principaux
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
        basePrice: data.basePrice,
        published: data.published ?? true,
        artist: { connect: { id: artistResolvedId } },
      },
    })

    // diff variants
    const incoming = data.variants ?? []
    const keepIds = incoming.filter(v => v.id).map(v => v.id!) // à garder/maj

    // delete celles retirées du form
    await tx.variant.deleteMany({
      where: { workId: id, NOT: { id: { in: keepIds.length ? keepIds : ['__none__'] } } },
    })

    // upsert / create
    for (const v of incoming) {
      if (v.id) {
        await tx.variant.update({
          where: { id: v.id },
          data: {
            label: v.label,
            price: v.price,
            // order: 0, // optionally set or compute an order index
          },
        })
      } else {
        await tx.variant.create({
          data: {
            workId: id,
            label: v.label,
            price: v.price,
            // order: 0,
          },
        })
      }
    }

    return tx.work.findUnique({ where: { id }, include: { variants: true, artist: true } })
  })

  if (!work) {
    return NextResponse.json({ ok: false, error: 'Work not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, artwork: work }, { status: 200 })
})