// src/lib/getCatalog.ts
import 'server-only'
import type { Artist, Artwork } from '@/lib/types'

export const dynamic = 'force-dynamic'

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
  try {
    const base = getBaseUrl()
    const res = await fetch(`${base}/api/catalog`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`Échec du chargement du catalogue: ${res.status} ${res.statusText}`)
    }
    return res.json() as Promise<Catalog>
  } catch (err) {
    console.error('Erreur getCatalog:', err)
    throw err
  }
}