import { rateLimit } from "@/lib/rateLimit"
import { assertAdmin, assertMethod } from "@/lib/adminAuth"
// src/app/api/admin/save-artwork/route.ts
import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

// Helpers
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

async function ensureCatalog(): Promise<Catalog> {
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
  await fs.mkdir(path.dirname(CATALOG_PATH), { recursive: true })
  await fs.writeFile(CATALOG_PATH, JSON.stringify(data, null, 2), 'utf8')
}

export async function POST(req: Request) {
  const badMethod = assertMethod(req, ['POST'])
  if (badMethod) return badMethod

  const notAdmin = assertAdmin(req)
  if (notAdmin) return notAdmin

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

    // Slug: si fourni on le normalise, sinon on dérive du titre. On ne force la déduplication que si on crée.
    const baseProvided = String(body.slug ?? '').trim()
    const base = slugify(baseProvided || title) || String(body.id || '') || `art-${Date.now()}`

    // ID: conserve si fourni sinon nouveau
    const id = String(body.id ?? '').trim() || `w-${Date.now()}`

    // Cherche si l’œuvre existe (update)
    const existingIdx = catalog.artworks.findIndex(a => a.id === id)
    const taken = new Set(catalog.artworks.map(a => a.slug))

    let slug = base
    if (existingIdx < 0) {
      // création → on garantit l’unicité
      let i = 2
      while (taken.has(slug)) slug = `${base}-${i++}`
    } else {
      // update → si slug spécifique fourni on le normalise et on évite les collisions avec d’autres ids
      if (baseProvided) {
        let next = slug
        let i = 2
        while (catalog.artworks.some(a => a.slug === next && a.id !== id)) next = `${base}-${i++}`
        slug = next
      } else {
        slug = catalog.artworks[existingIdx].slug
      }
    }

    // Formats nettoyés
    const formats: Format[] = Array.isArray(body.formats)
      ? body.formats
          .filter(f => !!f && typeof f === 'object' && String(f.label || '').trim())
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
  } catch (e) {
    console.error('SAVE_ARTWORK POST ERROR', e)
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500, headers: NO_STORE })
  }
}

export async function PUT(req: Request) {
  // même logique que POST (upsert), simplement autre verbe pour clarté REST
  return POST(new Request(req.url, { method: 'POST', headers: req.headers, body: await req.text() }))
}

export async function GET() {
  // Optionnel: permet de vérifier rapidement le contenu depuis le navigateur
  const catalog = await ensureCatalog()
  return NextResponse.json(catalog, { status: 200, headers: NO_STORE })
}
export async function DELETE(req: Request) {
  const badMethod = assertMethod(req, ['DELETE'])
  if (badMethod) return badMethod

  const notAdmin = assertAdmin(req)
  if (notAdmin) return notAdmin

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

    const raw = await fs.readFile(CATALOG_PATH, 'utf8').catch(() => '{}')
    const json = JSON.parse(raw || '{}')
    const artworks: any[] = Array.isArray(json.artworks) ? json.artworks : []

    const before = artworks.length
    const next = artworks.filter(a => (id ? a.id !== id : true) && (slug ? a.slug !== slug : true))

    if (next.length === before) {
      return NextResponse.json({ ok: false, error: 'Œuvre introuvable' }, { status: 404, headers: NO_STORE })
    }

    json.artworks = next
    await fs.writeFile(CATALOG_PATH, JSON.stringify(json, null, 2), 'utf8')

    return NextResponse.json({ ok: true, deleted: id || slug }, { headers: NO_STORE })
  } catch (e) {
    console.error('DELETE SAVE-ARTWORK ERROR', e)
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500, headers: NO_STORE })
  }
}

export function OPTIONS() {
  return NextResponse.json({ ok: true })
}