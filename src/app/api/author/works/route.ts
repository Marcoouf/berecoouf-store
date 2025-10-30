import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mapWorkDetail, mapWorkSummary, sanitizeUrl } from './utils'
import { uniqueSlug } from '@/lib/uniqueSlug'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const artistIds = Array.isArray(user.artistIds) ? user.artistIds : []
  if (artistIds.length === 0) {
    return NextResponse.json({ works: [], artists: [] })
  }

  const [artists, works] = await Promise.all([
    prisma.artist.findMany({
      where: { id: { in: artistIds } },
      select: { id: true, name: true, slug: true, isOnVacation: true, isHidden: true },
      orderBy: { name: 'asc' },
    }),
    prisma.work.findMany({
      where: { artistId: { in: artistIds }, deletedAt: null },
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        id: true,
        updatedAt: true,
        slug: true,
        title: true,
        artistId: true,
        published: true,
        deletedAt: true,
        basePrice: true,
        imageUrl: true,
        mockupUrl: true,
        artist: { select: { id: true, name: true, slug: true, isOnVacation: true } },
      },
    }),
  ])

  return NextResponse.json({
    works: works.map(mapWorkSummary),
    artists: artists.map((artist) => ({
      ...artist,
      isOnVacation: Boolean(artist.isOnVacation),
      isHidden: Boolean(artist.isHidden),
    })),
  })
}

export async function POST(req: Request) {
  const session = await getAuthSession()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const artistIds = Array.isArray(user.artistIds) ? user.artistIds : []
  if (artistIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'no_artist_access' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const rawTitle = typeof body.title === 'string' ? body.title.trim() : ''
  if (!rawTitle) {
    return NextResponse.json({ ok: false, error: 'title_required' }, { status: 400 })
  }

  const requestedArtist = typeof body.artistId === 'string' ? body.artistId : null
  const artistId = requestedArtist && artistIds.includes(requestedArtist) ? requestedArtist : artistIds[0]
  if (!artistId) {
    return NextResponse.json({ ok: false, error: 'invalid_artist' }, { status: 400 })
  }

  const slugSource =
    typeof body.slug === 'string' && body.slug.trim().length > 0 ? body.slug.trim() : rawTitle

  const existingSlugs = await prisma.work.findMany({
    select: { slug: true },
  })
  const slug = uniqueSlug(slugSource, new Set(existingSlugs.map((entry) => entry.slug)))

  const imageUrl = sanitizeUrl(body.image) ?? ''
  const mockupUrl = sanitizeUrl(body.mockup)

  const created = await prisma.work.create({
    data: {
      title: rawTitle,
      slug,
      artistId,
      imageUrl,
      mockupUrl: mockupUrl ?? null,
      published: false,
      createdById: user.id,
    },
    include: {
      artist: { select: { id: true, name: true, slug: true, isOnVacation: true } },
      variants: {
        orderBy: { order: 'asc' },
        select: { id: true, label: true, price: true, order: true },
      },
    },
  })

  return NextResponse.json(
    {
      ok: true,
      work: mapWorkSummary(created),
      detail: mapWorkDetail(created),
    },
    { status: 201 },
  )
}
