import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidateArtistPaths } from '@/lib/revalidate'

const trimString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const sanitizeUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed
}

const sanitizeSocials = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getAuthSession()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const artistIds = Array.isArray(user.artistIds) ? user.artistIds : []
  if (!artistIds.includes(params.id)) {
    return NextResponse.json({ ok: false, error: 'not_authorized' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const data: Record<string, any> = {}
  let hasUpdates = false

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = trimString(body.name)
    if (name) {
      data.name = name
      hasUpdates = true
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'bio')) {
    data.bio = trimString(body.bio)
    hasUpdates = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'contactEmail')) {
    const email = trimString(body.contactEmail)
    data.contactEmail = email
    hasUpdates = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'handle')) {
    const handle = trimString(body.handle)
    data.handle = handle
    hasUpdates = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'socials')) {
    data.socials = sanitizeSocials(body.socials)
    hasUpdates = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'image')) {
    data.image = sanitizeUrl(body.image)
    hasUpdates = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'portrait')) {
    data.portrait = sanitizeUrl(body.portrait)
    hasUpdates = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'isOnVacation')) {
    if (typeof body.isOnVacation === 'boolean') {
      data.isOnVacation = body.isOnVacation
      hasUpdates = true
    }
  }

  if (!hasUpdates) {
    return NextResponse.json({ ok: true, updated: false })
  }

  const updated = await prisma.artist.update({
    where: { id: params.id },
    data,
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
    },
  })

  await revalidateArtistPaths(updated.slug)

  return NextResponse.json({
    ok: true,
    artist: {
      ...updated,
      socials: Array.isArray(updated.socials) ? updated.socials : [],
      isOnVacation: Boolean(updated.isOnVacation),
    },
  })
}
