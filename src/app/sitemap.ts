import { headers } from 'next/headers'
import { artists, artworks } from '@/lib/data'

function base() {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')) || `${proto}://${host}`
}

export default async function sitemap() {
  const b = base()
  const now = new Date().toISOString()

  const staticUrls = [
    { url: `${b}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${b}/artists`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${b}/artworks`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ]

  const artistUrls = artists.map(a => ({
    url: `${b}/artists/${a.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.6,
  }))

  const artworkUrls = artworks.map(w => ({
    url: `${b}/artworks/${w.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.7,
  }))

  return [...staticUrls, ...artistUrls, ...artworkUrls]
}