// src/lib/getCatalog.ts
import { artists as seedArtists, artworks as seedArtworks } from '@/lib/data'

type Artwork = {
  id: string
  slug: string
  title: string
  image: string
  mockup?: string
  artistId: string
  price: number
  description?: string
  year?: number
  technique?: string
  paper?: string
  size?: string
  edition?: string
  formats?: Array<{ id: string; label: string; price: number }>
}
type Artist = {
  id: string
  slug: string
  name: string
  handle?: string
  bio?: string
  avatar?: string
  cover?: string
}
type Catalog = { artists: Artist[]; artworks: Artwork[] }

// petites aides
function isArtist(x: any): x is Artist {
  return !!x && typeof x === 'object' && typeof x.id === 'string' && typeof x.slug === 'string' && typeof x.name === 'string'
}
function isArtwork(x: any): x is Artwork {
  return !!x && typeof x === 'object' && typeof x.id === 'string' && typeof x.slug === 'string' && typeof x.title === 'string' && typeof x.artistId === 'string'
}
function uniqBy<T>(arr: T[], key: (t: T) => string) {
  const seen = new Set<string>()
  const out: T[] = []
  for (const it of arr) {
    const k = key(it)
    if (!seen.has(k)) { seen.add(k); out.push(it) }
  }
  return out
}

/**
 * getCatalog :
 * - essaie la source distante PUBLIC_CATALOG_URL (Blob / API) si définie
 * - valide le JSON
 * - merge avec le seed local (lib/data) en fallback
 * - ne renvoie JAMAIS des tableaux vides si le seed est dispo
 */
export async function getCatalog(): Promise<Catalog> {
  const seed: Catalog = {
    artists: Array.isArray(seedArtists) ? seedArtists.filter(isArtist) : [],
    artworks: Array.isArray(seedArtworks) ? seedArtworks.filter(isArtwork) : [],
  }

  const remoteUrl =
    process.env.PUBLIC_CATALOG_URL ||
    process.env.NEXT_PUBLIC_PUBLIC_CATALOG_URL || // safety valve si renommage
    ''

  let remote: Partial<Catalog> = {}

  if (remoteUrl) {
    try {
      const r = await fetch(remoteUrl, { cache: 'no-store', next: { revalidate: 0 } })
      if (r.ok) {
        const j = await r.json()
        const ra = Array.isArray(j?.artists) ? j.artists.filter(isArtist) : []
        const rw = Array.isArray(j?.artworks) ? j.artworks.filter(isArtwork) : []
        remote = { artists: ra, artworks: rw }
      } else {
        console.error('getCatalog: remote non-OK', r.status, await safeText(r))
      }
    } catch (e) {
      console.error('getCatalog: remote fetch error', e)
    }
  }

  // Fusion (remote prioritaire, seed en complément), dé-doublonnage par id puis par slug
  const artists = uniqBy(
    uniqBy([...(remote.artists ?? []), ...seed.artists], a => a.id),
    a => a.slug
  )
  const artworks = uniqBy(
    uniqBy([...(remote.artworks ?? []), ...seed.artworks], w => w.id),
    w => w.slug
  )

  // Sécurité : s’il n’y a vraiment plus rien, renvoyer au moins un objet vide propre
  return {
    artists: artists,
    artworks: artworks,
  }
}

async function safeText(r: Response) {
  try { return await r.text() } catch { return '' }
}