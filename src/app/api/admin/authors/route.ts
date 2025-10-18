import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

function assertAdmin() {
  // TODO: brancher ta vraie auth admin (middleware + cookies déjà en place)
}

const authorCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional().nullable(),
  password: z.string().min(8, 'Mot de passe trop court (min 8 caractères)'),
  artistIds: z.array(z.string().min(1)).optional().default([]),
})

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

export async function GET() {
  assertAdmin()
  const users = await prisma.user.findMany({
    where: { role: 'author' },
    orderBy: { email: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      artists: {
        include: {
          artist: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  })

  const authors = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    artistIds: user.artists.map((aa) => aa.artistId),
    artists: mapArtistAuthors(user.artists),
  }))

  return NextResponse.json(authors)
}

export async function POST(req: Request) {
  try {
    assertAdmin()
    const payload = await req.json()
    const parsed = authorCreateSchema.parse(payload)

    const email = parsed.email.trim().toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10)

    const author = await prisma.user.create({
      data: {
        email,
        name: parsed.name?.trim() || null,
        passwordHash,
        role: 'author',
        artists: parsed.artistIds.length
          ? {
              create: parsed.artistIds.map((artistId) => ({
                artist: { connect: { id: artistId } },
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        artists: {
          include: { artist: { select: { id: true, name: true, slug: true } } },
        },
      },
    })

    return NextResponse.json(
      {
        id: author.id,
        email: author.email,
        name: author.name,
        artistIds: author.artists.map((aa) => aa.artistId),
        artists: mapArtistAuthors(author.artists),
      },
      { status: 201 },
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(', ') }, { status: 400 })
    }
    return NextResponse.json({ error: error?.message || 'Erreur serveur' }, { status: 400 })
  }
}
