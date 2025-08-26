import { rateLimit } from "@/lib/rateLimit"
// ⬇️ on n'utilise plus la version header; on passe par le cookie guard
import { assertAdmin as assertAdminCookie } from "@/lib/adminGuard"
import { assertMethod } from "@/lib/adminAuth" // on garde pour le 405
import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { put, list } from '@vercel/blob'

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// --- helpers d'env ---
const isProd = () => process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
const BLOB_KEY = 'data/catalog.json' // clé stable dans le bucket
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

// Types légers
type Format = { id: string; label: string; price: number }
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
  formats?: Format[]
}
type Catalog = { artists: any[]; artworks: Artwork[] }

const CATALOG_PATH = path.join(process.cwd(), 'data', 'catalog.json')

// Utils
function toNumber(n: any, fallback = 0) {
  const v = Number(n)
  return Number.isFinite(v) ? v : fallback
}
function slugify(input: string) {
  return input
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ---------- lecture/écriture du catalogue ----------
async function ensureCatalog(): Promise<Catalog> {
  if (isProd()) {
    // Vérif token blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('blob_token_missing')
    }
    // Dernière version dans Blob
    const { blobs } = await list({ prefix: BLOB_KEY, token: BLOB_TOKEN })
    const latest = [...(blobs as any[])].sort(
      (a: any, b: any) => (b.uploadedAt?.getTime?.() ?? 0) - (a.uploadedAt?.getTime?.() ?? 0)
    )[0]

    if (latest?.url) {
      const res = await fetch(latest.url, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        return {
          artists: Array.isArray(json?.artists) ? json.artists : [],
          artworks: Array.isArray(json?.artworks) ? json.artworks : [],
        }
      }
    }
    // Seed
    const seed: Catalog = { artists: [], artworks: [] }
    await put(BLOB_KEY, JSON.stringify(seed, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      token: BLOB_TOKEN,
    })
    return seed
  }

  // DEV: fichier local
  try {
    const raw = await fs.readFile(CATALOG_PATH, 'utf8')
    const json = JSON.parse(raw)
    return {
      artists: Array.isArray(json?.artists) ? json.artists : [],
      artworks: Array.isArray(json?.artworks) ? json.artworks : [],
    }
  } catch {
    const seed: Catalog = { artists: [], artworks: [] }
    await fs.mkdir(path.dirname(CATALOG_PATH), { recursive: true })
    await fs.writeFile(CATALOG_PATH, JSON.stringify(seed, null, 2), 'utf8')
    return seed
  }
}

async function writeCatalog(data: Catalog) {
  if (isProd()) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('blob_token_missing')
    }
    await put(BLOB_KEY, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      token: BLOB_TOKEN,
    })
    return
  }
  await fs.mkdir(path.dirname(CATALOG_PATH), { recursive: true })
  await fs.writeFile(CATALOG_PATH, JSON.stringify(data, null, 2), 'utf8')
}
// ----------------------------------------------------

export async function POST(req: Request) {
  const badMethod = assertMethod(req, ['POST'])
  if (badMethod) return badMethod

  // ⬇️ Auth via cookie (adminGuard) — jette si pas connecté
  try {
    assertAdminCookie()
  } catch {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401, headers: NO_STORE })
  }

  if (!rateLimit(req, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429, headers: NO_STORE })
  }

  try {
    const raw = await req.json()
    const body = (typeof raw === 'object' && raw) ? raw as Partial<Artwork> : {}

    const title = String(body?.title ?? '').trim()
    const artistId = String(body?.artistId ?? '').trim()
    const image = String(body?.image ?? '').trim()
    if (!title || !artistId || !image) {
      return NextResponse.json(
        { ok: false, error: 'Champs requis manquants (title, image, artistId)' },
        { status: 400, headers: NO_STORE }
      )
    }

    const catalog = await ensureCatalog()

    // Slug / id / update-or-create
    const baseProvided = String(body.slug ?? '').trim()
    const base = slugify(baseProvided || title) || String(body.id || '') || `art-${Date.now()}`
    const id = String(body.id ?? '').trim() || `w-${Date.now()}`
    const existingIdx = catalog.artworks.findIndex(a => a.id === id)
    const taken = new Set(catalog.artworks.map(a => a.slug))

    let slug = base
    if (existingIdx < 0) {
      let i = 2
      while (taken.has(slug)) slug = `${base}-${i++}`
    } else {
      if (baseProvided) {
        let next = slug
        let i = 2
        while (catalog.artworks.some(a => a.slug === next && a.id !== id)) next = `${base}-${i++}`
        slug = next
      } else {
        slug = catalog.artworks[existingIdx].slug
      }
    }

    // Formats
    const formats: Format[] = Array.isArray(body.formats)
      ? body.formats
        .filter(f => !!f && typeof f === 'object' && String((f as any).label || '').trim())
        .map((f, idx) => ({
          id: String((f as any).id || `f-${idx + 1}`).trim(),
          label: String((f as any).label).trim(),
          price: toNumber((f as any).price, 0),
        }))
      : []

    const price = toNumber(body.price, formats[0]?.price ?? 0)

    const artwork: Artwork = {
      id,
      slug,
      title,
      artistId,
      image,
      mockup: body.mockup ? String(body.mockup).trim() : undefined,
      price,
      description: body.description ? String(body.description).trim() : undefined,
      year: body.year != null ? toNumber(body.year) : undefined,
      technique: body.technique ? String(body.technique).trim() : undefined,
      paper: body.paper ? String(body.paper).trim() : undefined,
      size: body.size ? String(body.size).trim() : undefined,
      edition: body.edition ? String(body.edition).trim() : undefined,
      formats,
    }

    if (existingIdx >= 0) catalog.artworks[existingIdx] = artwork
    else catalog.artworks.push(artwork)

    await writeCatalog(catalog)

    return NextResponse.json(
      { ok: true, message: existingIdx >= 0 ? 'Updated' : 'Created', artwork, counts: { artworks: catalog.artworks.length } },
      { status: 200, headers: NO_STORE }
    )
  } catch (e: any) {
    // erreurs parlantes
    const msg = e?.message === 'blob_token_missing'
      ? 'Blob token manquant (BLOB_READ_WRITE_TOKEN)'
      : 'Erreur serveur'
    console.error('SAVE_ARTWORK POST ERROR', e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500, headers: NO_STORE })
  }
}

export async function PUT(req: Request) {
  return POST(new Request(req.url, { method: 'POST', headers: req.headers, body: await req.text() }))
}

export async function GET() {
  const catalog = await ensureCatalog()
  return NextResponse.json(catalog, { status: 200, headers: NO_STORE })
}

export async function DELETE(req: Request) {
  const badMethod = assertMethod(req, ['DELETE'])
  if (badMethod) return badMethod

  try {
    assertAdminCookie()
  } catch {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401, headers: NO_STORE })
  }

  if (!rateLimit(req, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429, headers: NO_STORE })
  }

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const slug = url.searchParams.get('slug')
    if (!id && !slug) {
      return NextResponse.json({ ok: false, error: 'id ou slug manquant' }, { status: 400, headers: NO_STORE })
    }

    const catalog = await ensureCatalog()
    const before = catalog.artworks.length
    catalog.artworks = catalog.artworks.filter(a =>
      (id ? a.id !== id : true) && (slug ? a.slug !== slug : true)
    )

    if (catalog.artworks.length === before) {
      return NextResponse.json({ ok: false, error: 'Œuvre introuvable' }, { status: 404, headers: NO_STORE })
    }

    await writeCatalog(catalog)
    return NextResponse.json({ ok: true, deleted: id || slug }, { headers: NO_STORE })
  } catch (e) {
    console.error('DELETE SAVE-ARTWORK ERROR', e)
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500, headers: NO_STORE })
  }
}

export function OPTIONS() {
  return NextResponse.json({ ok: true })
}