// src/lib/getCatalog.ts
import { list } from '@vercel/blob'
import { artists as staticArtists, artworks as staticArtworks } from '@/lib/data'

export type Catalog = { artists: any[]; artworks: any[] }

function mergeBySlug<T extends { slug: string }>(base: T[], drafts: T[]) {
  const map = new Map<string, T>()
  for (const a of base) if (a?.slug) map.set(a.slug, a)
  for (const d of drafts) if (d?.slug) map.set(d.slug, d)
  return Array.from(map.values())
}

export async function getCatalog(): Promise<Catalog> {
  const key = (process.env.CATALOG_BLOB_KEY || '').replace(/^\/+/, '')
  if (key) {
    try {
      const prefix = key.includes('/') ? key.split('/')[0] + '/' : key
      const it: any = await list({ prefix })
      const hit = it.blobs?.find((b: any) => b.pathname === key) || it.items?.find((b: any) => b.pathname === key)
      if (hit?.url) {
        const res = await fetch(hit.url, { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          const draftsArtists = Array.isArray(json?.artists) ? json.artists : []
          const draftsArtworks = Array.isArray(json?.artworks) ? json.artworks : []
          return {
            artists: mergeBySlug(staticArtists as any[], draftsArtists),
            artworks: mergeBySlug(staticArtworks as any[], draftsArtworks),
          }
        }
      }
    } catch {
      // fallback statique
    }
  }
  return {
    artists: staticArtists as any[],
    artworks: staticArtworks as any[],
  }
}