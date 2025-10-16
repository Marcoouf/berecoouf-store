

// Server-only helpers to read/write the catalog JSON on Vercel Blob
// Usage from API routes only (never import in client components)

import 'server-only'
import { list, put } from '@vercel/blob'
import type { Artist, Artwork } from '@/lib/types'

export type Catalog = {
  artists: Artist[];
  artworks: Artwork[];
}

/**
 * Resolve the blob pathname that stores the catalog.
 * Example: CATALOG_BLOB_KEY = "data/catalog.json"
 */
function getCatalogKey(): string {
  const key = process.env.CATALOG_BLOB_KEY?.trim()
  if (!key) throw new Error('CATALOG_BLOB_KEY is not set')
  return key
}

/**
 * Get a RW token for server-side blob operations.
 */
function getBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not set')
  return token
}

/**
 * Optionally get the RW token; return null if not configured.
 * Useful for read paths where a public URL might already suffice.
 */
function getOptionalBlobToken(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  return token || null
}

/**
 * Try read a JSON file from Vercel Blob and parse it as Catalog.
 * 1) Prefer the public URL (NEXT_PUBLIC_CATALOG_URL) if present.
 * 2) Otherwise, try the RW token lookup (if configured).
 *    When multiple blob versions exist for the same key, pick the most recent.
 * Returns `null` if nothing can be read (no throw on missing token in read path).
 */
export async function readCatalogFromBlob(): Promise<Catalog | null> {
  // 1) Public URL path — fastest & cache-controllable edge CDN
  const publicUrl = process.env.NEXT_PUBLIC_CATALOG_URL?.trim()
  if (publicUrl) {
    try {
      const r = await fetch(publicUrl, { cache: 'no-store' })
      if (r.ok) return (await r.json()) as Catalog
    } catch {
      // ignore and try token-based path
    }
  }

  // 2) Token-based lookup (optional here; don't throw if not configured)
  const token = getOptionalBlobToken()
  const key = process.env.CATALOG_BLOB_KEY?.trim() || null
  if (!token || !key) return null

  const { blobs } = await list({ prefix: key, token })
  if (!blobs?.length) return null

  // Filter to exact pathname if present; otherwise use all results for prefix
  const samePath = blobs.filter((b) => b.pathname === key)
  const pickFrom = samePath.length ? samePath : blobs

  // Pick the newest by uploadedAt (fallback to 0 if not present)
  const file = pickFrom
    .slice()
    .sort((a: any, b: any) => {
      const da = new Date(a?.uploadedAt ?? 0).getTime()
      const db = new Date(b?.uploadedAt ?? 0).getTime()
      return db - da
    })[0]

  if (!file) return null

  const res = await fetch(file.url, { cache: 'no-store' })
  if (!res.ok) return null
  return (await res.json()) as Catalog
}

/**
 * Write the given Catalog to Vercel Blob, publicly readable as JSON.
 * Returns the public URL of the written blob.
 */
export async function writeCatalogToBlob(catalog: Catalog): Promise<string> {
  const token = getBlobToken()
  const key = getCatalogKey()

  const body = JSON.stringify(catalog, null, 2)
  const { url } = await put(key, body, {
    access: 'public',
    contentType: 'application/json; charset=utf-8',
    token,
  })

  return url
}

/** Upsert helper: read, transform, write */
export async function updateCatalog(
  mutator: (current: Catalog | null) => Catalog
): Promise<{ url: string; catalog: Catalog }> {
  const current = await readCatalogFromBlob()
  const next = mutator(current)
  const url = await writeCatalogToBlob(next)
  return { url, catalog: next }
}