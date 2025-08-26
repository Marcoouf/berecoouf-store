// src/lib/getCatalog.ts
import 'server-only'
import { list } from '@vercel/blob'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Artist, Artwork } from '@/lib/types'

export const dynamic = 'force-dynamic'

export type Catalog = {
  artists: Artist[]
  artworks: Artwork[]
}

// Emplacement du catalogue dans Vercel Blob (clé déterministe)
const CATALOG_BLOB_KEY = 'catalog/catalog.json'
const CATALOG_LOCAL = path.join(process.cwd(), 'data', 'catalog.json')

/**
 * Lecture prioritaire depuis Vercel Blob.
 * Fallback en dev: fichier local `data/catalog.json` si présent.
 */
export async function getCatalog(): Promise<Catalog> {
  // 1) PROD/Preview: essaye de lire le JSON depuis Vercel Blob
  try {
    // Try to locate the catalog file in Vercel Blob
    const { blobs } = await list({ prefix: CATALOG_BLOB_KEY, mode: 'expanded' })
    let item = blobs.find(b => b.pathname === CATALOG_BLOB_KEY)

    // Some SDK versions require a directory prefix; try listing the folder if needed
    if (!item) {
      const alt = await list({ prefix: 'catalog/', mode: 'expanded' })
      item = alt.blobs.find(b => b.pathname === CATALOG_BLOB_KEY)
    }

    if (item?.url) {
      const res = await fetch(item.url, { cache: 'no-store' })
      if (res.ok) return (await res.json()) as Catalog
    }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[getCatalog] lecture Blob impossible, fallback local:', e)
    }
  }

  // 2) DEV: fallback sur le fichier packagé si présent
  try {
    const raw = await fs.readFile(CATALOG_LOCAL, 'utf8')
    return JSON.parse(raw) as Catalog
  } catch {
    // Fallback final: catalogue vide
    return { artists: [], artworks: [] }
  }
}