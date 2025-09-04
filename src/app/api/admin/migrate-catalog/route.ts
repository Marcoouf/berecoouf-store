import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { put } from '@vercel/blob'
import { rateLimit } from '@/lib/rateLimit'
import { assertAdmin } from '@/lib/adminAuth'
import { getCatalog } from '@/lib/getCatalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Artwork = {
  id: string
  slug: string
  title: string
  artistId: string
  image: string
  mockup?: string
  price: number
  description?: string
  year?: number
  technique?: string
  paper?: string
  size?: string
  edition?: string
  formats?: { id: string; label: string; price: number }[]
}

type Catalog = { artists: any[]; artworks: Artwork[] }

function isLocalImageUrl(u?: string | null) {
  if (!u) return false
  return u.startsWith('/images/') || u.startsWith('/public/images/')
}

function toMime(ext: string) {
  const e = ext.replace('.', '').toLowerCase()
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg'
  if (e === 'png') return 'image/png'
  if (e === 'webp') return 'image/webp'
  if (e === 'avif') return 'image/avif'
  if (e === 'gif') return 'image/gif'
  return 'application/octet-stream'
}

function cleanLocalPath(u: string) {
  return u.startsWith('/public/') ? u.slice('/public/'.length) : (u.startsWith('/') ? u.slice(1) : u)
}

function blobKeyFor(localRelPath: string) {
  // Range propre & stable côté Blob (ex: images/artworks/xxx.webp)
  return localRelPath
    .replace(/^images\//, '')         // enlève "images/" en tête
    .replace(/^public\//, '')         // sécurité
    .replace(/^\/+/, '')              // trim slashes
    .replace(/\\/g, '/')
    .replace(/^/, 'images/')          // préfixe "images/"
}

async function uploadLocalToBlob(localRelPath: string) {
  const absPath = path.join(process.cwd(), 'public', cleanLocalPath(localRelPath))
  const data = await fs.readFile(absPath)
  const ext = path.extname(absPath) || '.bin'
  const contentType = toMime(ext)

  // addRandomSuffix pour éviter les collisions si déjà présent
  const res = await put(blobKeyFor(localRelPath), data, {
    access: 'public',
    contentType,
    addRandomSuffix: true,
  })
  return res.url // URL publique Blob
}

export async function POST(req: Request) {
  // Sécurité: rate limit + clé admin côté serveur (header x-admin-key recommandé) OU session via middleware
  if (!rateLimit(req, 5, 10_000)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }
  const denied = assertAdmin(req)
  if (denied) return denied

  const dry = new URL(req.url).searchParams.get('dry') === '1'

  // 1) Lire le catalogue actuel (depuis Blob via getCatalog)
  let catalog: Catalog
  try {
    const data = await getCatalog()
    catalog = {
      artists: Array.isArray(data.artists) ? data.artists : [],
      artworks: Array.isArray(data.artworks) ? data.artworks as Artwork[] : [],
    }
  } catch (e) {
    console.error('MIGRATE: fail read catalog', e)
    return NextResponse.json({ ok: false, error: 'catalog_read_failed' }, { status: 500 })
  }

  // 2) Parcourir & migrer
  const updates: Array<{ id: string; title: string; image?: string; mockup?: string }> = []
  let migratedImages = 0
  let migratedMockups = 0
  let skippedMissing = 0
  let unchanged = 0

  for (const a of catalog.artworks) {
    let changed = false
    const updateRec: { id: string; title: string; image?: string; mockup?: string } = { id: a.id, title: a.title }

    // image principale
    if (isLocalImageUrl(a.image)) {
      const localRel = cleanLocalPath(a.image.replace(/^\/+/, ''))
      const abs = path.join(process.cwd(), 'public', localRel)
      try {
        await fs.access(abs)
        if (!dry) {
          const url = await uploadLocalToBlob(localRel)
          a.image = url
          updateRec.image = url
        }
        migratedImages++
        changed = true
      } catch {
        // fichier introuvable localement
        skippedMissing++
      }
    }

    // mockup (optionnel)
    if (a.mockup && isLocalImageUrl(a.mockup)) {
      const localRel = cleanLocalPath(a.mockup.replace(/^\/+/, ''))
      const abs = path.join(process.cwd(), 'public', localRel)
      try {
        await fs.access(abs)
        if (!dry) {
          const url = await uploadLocalToBlob(localRel)
          a.mockup = url
          updateRec.mockup = url
        }
        migratedMockups++
        changed = true
      } catch {
        skippedMissing++
      }
    }

    if (changed) updates.push(updateRec)
    else unchanged++
  }

  // 3) Écrire le catalogue si pas dry-run
  if (!dry) {
    try {
      const CATALOG_BLOB_KEY = process.env.CATALOG_BLOB_KEY
      if (!CATALOG_BLOB_KEY) {
        return NextResponse.json({ ok: false, error: 'CATALOG_BLOB_KEY_missing' }, { status: 500 })
      }
      await put(CATALOG_BLOB_KEY, JSON.stringify(catalog, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      })
    } catch (e) {
      console.error('MIGRATE: fail write catalog', e)
      return NextResponse.json({ ok: false, error: 'catalog_write_failed' }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun: dry,
    migrated: { images: migratedImages, mockups: migratedMockups },
    skippedMissing,
    unchanged,
    updates,
  })
}