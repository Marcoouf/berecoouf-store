import { rateLimit } from "@/lib/rateLimit"
import { assertAdmin, assertMethod } from "@/lib/adminAuth"
// src/app/api/admin/save-artwork/route.ts
import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'


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
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }
  try {
    const body = (await req.json()) as Partial<Artwork>

    // Validation minimale
    if (!body?.title || !body?.image || !body?.artistId) {
      return NextResponse.json(
        { ok: false, error: 'Champs requis manquants (title, image, artistId)' },
        { status: 400 }
      )
    }

    const catalog = await ensureCatalog()

    // Slug
    const base = slugify(String(body.slug || body.title || '')) || String(body.id || '') || `art-${Date.now()}`
    let slug = base
    let i = 2
    const taken = new Set(catalog.artworks.map(a => a.slug))
    while (taken.has(slug)) slug = `${base}-${i++}`

    // ID
    const id = String(body.id || `w-${Date.now()}`)

    // Formats nettoyés
    const formats: Format[] = Array.isArray(body.formats)
      ? body.formats
          .filter(f => !!f && typeof f === 'object' && String(f.label || '').trim())
          .map((f, idx) => ({
            id: String(f.id || `f-${idx + 1}`),
            label: String(f.label),
            price: toNumber((f as any).price, 0),
          }))
      : []

    // Prix principal: utilise body.price ou le 1er format
    const price = toNumber(body.price, formats[0]?.price ?? 0)

    const artwork: Artwork = {
      id,
      slug,
      title: String(body.title),
      artistId: String(body.artistId),
      image: String(body.image),
      mockup: body.mockup ? String((body as any).mockup) : undefined,
      price,
      description: body.description ? String(body.description) : undefined,
      year: body.year != null ? toNumber(body.year) : undefined,
      technique: body.technique ? String(body.technique) : undefined,
      paper: body.paper ? String(body.paper) : undefined,
      size: body.size ? String(body.size) : undefined,
      edition: body.edition ? String(body.edition) : undefined,
      formats,
    }

    // Upsert par id
    const idx = catalog.artworks.findIndex(a => a.id === artwork.id)
    if (idx >= 0) catalog.artworks[idx] = artwork
    else catalog.artworks.push(artwork)

    await writeCatalog(catalog)

    return NextResponse.json(
      { ok: true, message: 'Saved', artwork, counts: { artworks: catalog.artworks.length } },
      { status: 200 }
    )
  } catch (e) {
    console.error('SAVE_ARTWORK ERROR', e)
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  // Optionnel: permet de vérifier rapidement le contenu depuis le navigateur
  const catalog = await ensureCatalog()
  return NextResponse.json(catalog, { status: 200 })
}
export async function DELETE(req: Request) {
  const badMethod = assertMethod(req, ['DELETE'])
  if (badMethod) return badMethod

  const notAdmin = assertAdmin(req)
  if (notAdmin) return notAdmin

  if (!rateLimit(req, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }
  try {
    const url = new URL(req.url)

    const id = url.searchParams.get('id')
    const slug = url.searchParams.get('slug')
    if (!id && !slug) {
      return NextResponse.json({ ok: false, error: 'id ou slug manquant' }, { status: 400 })
    }

    const raw = await fs.readFile(CATALOG_PATH, 'utf8').catch(() => '{}')
    const json = JSON.parse(raw || '{}')
    const artworks: any[] = Array.isArray(json.artworks) ? json.artworks : []

    const before = artworks.length
    const next = artworks.filter(a => (id ? a.id !== id : true) && (slug ? a.slug !== slug : true))

    if (next.length === before) {
      return NextResponse.json({ ok: false, error: 'Œuvre introuvable' }, { status: 404 })
    }

    json.artworks = next
    await fs.writeFile(CATALOG_PATH, JSON.stringify(json, null, 2), 'utf8')

    return NextResponse.json({ ok: true, deleted: id || slug })
  } catch (e) {
    console.error('DELETE SAVE-ARTWORK ERROR', e)
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

export function OPTIONS() {
  return NextResponse.json({ ok: true })
}