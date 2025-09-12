// src/lib/getCatalog.ts
import { list } from '@vercel/blob'
import { artists as staticArtists, artworks as staticArtworks } from '@/lib/data'

const isProd = process.env.NODE_ENV === 'production'
const devLog = (...args: any[]) => { if (!isProd) console.log(...args) }
const devError = (...args: any[]) => { if (!isProd) console.error(...args) }

export type Catalog = { artists: any[]; artworks: any[] }

function mergeBySlug<T extends { slug: string }>(base: T[], drafts: T[]) {
  const map = new Map<string, T>()
  for (const a of base) if (a?.slug) map.set(a.slug, a)
  for (const d of drafts) if (d?.slug) map.set(d.slug, d)
  return Array.from(map.values())
}

export async function getCatalog(): Promise<Catalog> {
  const key = (process.env.CATALOG_BLOB_KEY || '').replace(/^\/+/, '')
  // Log (dev only)
  devLog('[getCatalog] key:', key)
  if (key) {
    try {
      const prefix = key.includes('/') ? key.split('/')[0] + '/' : key
      const it: any = await list({ prefix })
      // Simplifié : on ne regarde que dans blobs
      const hit = it.blobs?.find((b: any) => b.pathname === key)
      devLog('[getCatalog] hit?.url:', hit?.url)
      if (hit?.url) {
        const res = await fetch(hit.url, { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          const draftsArtists = Array.isArray(json?.artists) ? json.artists : []
          const draftsArtworks = Array.isArray(json?.artworks) ? json.artworks : []
          // fallback si pas d'artists ou d'artworks
          return {
            artists: draftsArtists.length > 0 ? mergeBySlug(staticArtists as any[], draftsArtists) : staticArtists as any[],
            artworks: draftsArtworks.length > 0 ? mergeBySlug(staticArtworks as any[], draftsArtworks) : staticArtworks as any[],
          }
        }
      }
    } catch (err) {
      devError('[getCatalog] Error loading catalog:', err)
      // fallback statique
    }
  }
  return {
    artists: staticArtists as any[],
    artworks: staticArtworks as any[],
  }
}