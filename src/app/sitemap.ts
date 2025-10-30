// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { prisma } from '../lib/prisma'

export const revalidate = 3600 // 1h
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://point-bleu.vercel.app'
  const now = new Date()

  let artists: { slug: string; updatedAt: Date }[] = []
  let works: { slug: string; updatedAt: Date }[] = []

  try {
    artists = await prisma.artist.findMany({
      where: { isArchived: false, deletedAt: null, isHidden: false },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: 'asc' },
    })

    works = await prisma.work.findMany({
      where: { published: true, deletedAt: null, artist: { isArchived: false, deletedAt: null, isHidden: false } },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: 'asc' },
    })
  } catch (err) {
    console.error('sitemap_fetch_failed', err)
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/artists`, lastModified: now },
    { url: `${base}/artworks`, lastModified: now },
  ]

  const artistUrls: MetadataRoute.Sitemap = artists.map(
    (a: { slug: string; updatedAt: Date }) => ({
      url: `${base}/artists/${a.slug}`,
      lastModified: a.updatedAt,
    })
  )

  const workUrls: MetadataRoute.Sitemap = works.map(
    (w: { slug: string; updatedAt: Date }) => ({
      url: `${base}/artworks/${w.slug}`,
      lastModified: w.updatedAt,
    })
  )

  return [...staticPages, ...artistUrls, ...workUrls]
}
