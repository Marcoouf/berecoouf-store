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

  const artists = await prisma.artist.findMany({
    where: { id: { in: artistIds } },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      socials: true,
      image: true,
      portrait: true,
      contactEmail: true,
      handle: true,
      isOnVacation: true,
      isHidden: true,
    },
  })

  return NextResponse.json(
    artists.map((artist) => ({
      ...artist,
      socials: Array.isArray(artist.socials) ? artist.socials : [],
      isOnVacation: Boolean(artist.isOnVacation),
      isHidden: Boolean(artist.isHidden),
    })),
  )
}
