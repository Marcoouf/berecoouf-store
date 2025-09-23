// src/app/api/catalog/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { euro } from '@/lib/format'

export const dynamic = 'force-dynamic'

type ArtistRow = {
  id: string
  name: string
  slug: string
  handle: string | null
  bio: string | null
  avatarUrl: string | null
  coverUrl: string | null
}

type VariantRow = {
  id: string
  label: string
  price: number
  order: number
}

type WorkRow = {
  id: string
  title: string
  slug: string
  description: string | null
  year: number | null
  technique: string | null
  paper: string | null
  dimensions: string | null
  edition: string | null
  imageUrl: string
  mockupUrl: string | null
  basePrice: number | null
  published: boolean
  artistId: string
  variants: VariantRow[]
}

export async function GET() {
  try {
    // ---- Artists ----
    const artistsRaw: ArtistRow[] = await prisma.artist.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        handle: true,
        bio: true,
        avatarUrl: true,
        coverUrl: true,
      },
    })

    // Normaliser la forme attendue par le front (avatar/cover)
    const artists = artistsRaw.map((a: ArtistRow) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      handle: a.handle ?? null,
      bio: a.bio ?? null,
      avatar: a.avatarUrl ?? null,
      cover: a.coverUrl ?? null,
    }))

    // ---- Works + Variants ----
    const works = await prisma.work.findMany({
      where: { published: true },
      orderBy: [{ year: 'desc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        year: true,
        technique: true,
        paper: true,
        dimensions: true,
        edition: true,
        imageUrl: true,
        mockupUrl: true,
        basePrice: true,
        published: true,
        artistId: true,
        variants: {
          select: { id: true, label: true, price: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
    })

    // Normalize + compute priceMin (in cents)
    const artworks = works.map((w: WorkRow) => {
      const priceMin = w.variants.length > 0
        ? Math.min(...w.variants.map(v => v.price))
        : (w.basePrice ?? 0)
      return {
        id: w.id,
        title: w.title,
        slug: w.slug,
        description: w.description,
        year: w.year,
        technique: w.technique,
        paper: w.paper,
        dimensions: w.dimensions,
        edition: w.edition,
        image: w.imageUrl,
        mockup: w.mockupUrl,
        artistId: w.artistId,
        formats: w.variants.map((v: VariantRow) => ({
          id: v.id,
          label: v.label,
          price: v.price,
          order: v.order,
        })),
        priceMin,
        priceMinFormatted: euro(priceMin),
      }
    })

    return NextResponse.json({ artists, artworks }, { status: 200 })
  } catch (err) {
    console.error('GET /api/catalog error:', err)
    return NextResponse.json({ artists: [], artworks: [] }, { status: 500 })
  }
}