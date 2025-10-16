// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { prisma } from '../lib/prisma'

export const revalidate = 3600 // 1h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://point-bleu.vercel.app'
  const now = new Date()

  const artists = await prisma.artist.findMany({
    where: { isArchived: false, deletedAt: null },
    select: { slug: true, updatedAt: true },
    orderBy: { slug: 'asc' },
  })

  const works = await prisma.work.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { slug: 'asc' },
  })

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