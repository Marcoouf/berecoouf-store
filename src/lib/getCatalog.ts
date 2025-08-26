// src/lib/getCatalog.ts
import 'server-only'
import type { Artist, Artwork } from '@/lib/types'

export type Catalog = {
  artists: Artist[]
  artworks: Artwork[]
}

// Build a base URL that works on Vercel and locally
function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`

  const port = process.env.PORT ?? '3000'
  return `http://localhost:${port}`
}

export async function getCatalog(): Promise<Catalog> {
  const base = getBaseUrl()
  const res = await fetch(`${base}/api/catalog`, {
    cache: 'no-store', // or { next: { revalidate: 0 } }
  })
  if (!res.ok) {
    throw new Error(`catalog fetch failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<Catalog>
}