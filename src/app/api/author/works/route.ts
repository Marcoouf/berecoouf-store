import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const artistIds = Array.isArray(user.artistIds) ? user.artistIds : []
  if (artistIds.length === 0) {
    return NextResponse.json([])
  }

  const works = await prisma.work.findMany({
    where: { artistId: { in: artistIds } },
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      artistId: true,
      published: true,
      basePrice: true,
      updatedAt: true,
      createdAt: true,
      imageUrl: true,
      mockupUrl: true,
      artist: { select: { id: true, name: true, slug: true } },
    },
  })

  const payload = works.map((work) => ({
    id: work.id,
    slug: work.slug,
    title: work.title,
    artistId: work.artistId,
    artist: work.artist,
    published: work.published,
    image: work.imageUrl,
    mockup: work.mockupUrl,
    basePriceCents: work.basePrice ?? null,
    updatedAt: work.updatedAt,
    createdAt: work.createdAt,
  }))

  return NextResponse.json(payload)
}
