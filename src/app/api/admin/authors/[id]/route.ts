import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { assertAdmin } from '@/lib/adminAuth'

const authorUpdateSchema = z.object({
  name: z.string().trim().optional().nullable(),
  password: z.string().min(8).optional(),
  artistIds: z.array(z.string().min(1)).optional(),
})

type Params = { params: { id: string } }

function mapArtistAuthors(
  items: Array<{
    artistId: string
    artist: { id: string; name: string; slug: string } | null
  }>,
) {
  return items
    .map((aa) =>
      aa.artist
        ? {
            id: aa.artist.id,
            name: aa.artist.name,
            slug: aa.artist.slug,
          }
        : null,
    )
    .filter((entry): entry is { id: string; name: string; slug: string } => Boolean(entry))
}

export async function GET(req: Request, { params }: Params) {
  const denied = await assertAdmin(req)
  if (denied) return denied
  const id = params.id
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      artists: {
        include: { artist: { select: { id: true, name: true, slug: true } } },
      },
    },
  })
  if (!user || user.role !== 'author') {
    return NextResponse.json({ error: 'Auteur introuvable' }, { status: 404 })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    artistIds: user.artists.map((aa) => aa.artistId),
    artists: mapArtistAuthors(user.artists),
  })
}

export async function PATCH(req: Request, { params }: Params) {
  const denied = await assertAdmin(req)
  if (denied) return denied
  try {
    const id = params.id

    const payload = await req.json()
    const parsed = authorUpdateSchema.parse(payload)

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } })
    if (!user || user.role !== 'author') {
      return NextResponse.json({ error: 'Auteur introuvable' }, { status: 404 })
    }

    const updates: Record<string, any> = {}
    if (typeof parsed.name === 'string') updates.name = parsed.name.trim()
    if (parsed.name === null) updates.name = null
    if (parsed.password) {
      updates.passwordHash = await bcrypt.hash(parsed.password, 10)
    }

    const artistIds = parsed.artistIds
    await prisma.$transaction(async (tx) => {
      if (Object.keys(updates).length > 0) {
        await tx.user.update({ where: { id }, data: updates })
      }

      if (Array.isArray(artistIds)) {
        await tx.artistAuthor.deleteMany({ where: { userId: id } })
        if (artistIds.length) {
          await tx.artistAuthor.createMany({
            data: artistIds.map((artistId) => ({
              userId: id,
              artistId,
            })),
          })
        }
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(', ') }, { status: 400 })
    }
    return NextResponse.json({ error: error?.message || 'Erreur serveur' }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const denied = await assertAdmin(req)
  if (denied) return denied
  const id = params.id
  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } })
    if (!user || user.role !== 'author') {
      return NextResponse.json({ error: 'Auteur introuvable' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erreur serveur' }, { status: 400 })
  }
}
