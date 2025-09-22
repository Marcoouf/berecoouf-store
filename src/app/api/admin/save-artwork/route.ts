import { NextResponse } from 'next/server'
import { list, put } from '@vercel/blob'
import { assertAdmin, assertMethod } from '@/lib/adminAuth'
import { rateLimit } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Format = { id: string; label: string; price: number }
type Artwork = {
  id: string; slug: string; title: string; artistId: string; image: string
  mockup?: string; price: number; description?: string; year?: number
  technique?: string; paper?: string; size?: string; edition?: string; formats?: Format[]
}
type Catalog = { artists: any[]; artworks: Artwork[] }

function toNum(n: any, f = 0) { const v = Number(n); return Number.isFinite(v) ? v : f }
function safeSlug(s: string) {
  return (s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim().toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '')
}

async function readBlobJSON<T = any>(key: string): Promise<T | null> {
  const prefix = key.includes('/') ? key.split('/')[0] + '/' : key
  const it: any = await list({ prefix })
  const hit = it.blobs?.find((b: any) => b.pathname === key) || it.items?.find((b: any) => b.pathname === key)
  if (!hit?.url) return null
  const res = await fetch(hit.url, { cache: 'no-store' })
  if (!res.ok) return null
  return (await res.json()) as T
}

async function writeBlobJSON(key: string, json: any) {
  const body = JSON.stringify(json, null, 2)
  await put(key, new Blob([body], { type: 'application/json' }), {
    access: 'public',
    contentType: 'application/json',
    cacheControlMaxAge: 0,
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

export async function POST(req: Request) {
  // sécurité de base
  const m = assertMethod(req, ['POST']); if (m) return m
  if (!rateLimit(req, 20, 60_000)) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  const a = assertAdmin(req); if (a) return a

  try {
    const BODY = await req.json() as Partial<Artwork>
    if (!BODY?.title || !BODY?.artistId) {
      return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })
    }

    const key = (process.env.CATALOG_BLOB_KEY || '').replace(/^\/+/, '')
    if (!key) return NextResponse.json({ ok: false, error: 'blob_key_missing' }, { status: 500 })

    // 1) lire catalogue courant (sinon seed)
    let current = await readBlobJSON<Catalog>(key)
    if (!current) current = { artists: [], artworks: [] }
    current.artworks = Array.isArray(current.artworks) ? current.artworks : []

    // --- identify previous item if any (prefer id, then slug) ---
    const byId = BODY.id ? current.artworks.find(a => a.id === BODY.id) : undefined
    const bySlug = BODY.slug ? current.artworks.find(a => a.slug === safeSlug(BODY.slug!)) : undefined
    const prev = byId || bySlug

    // --- compute id ---
    const id = prev?.id || String(BODY.id || `w-${Date.now()}`)

    // --- compute slug ---
    const requestedSlug = safeSlug(BODY.slug || '')
    const baseSlug = requestedSlug || safeSlug(prev?.slug || BODY.title || BODY.id || '')

    // When editing, keep previous slug if not explicitly changed
    let slug = prev ? (requestedSlug && requestedSlug !== prev.slug ? requestedSlug : prev.slug || baseSlug) : (baseSlug || `art-${Date.now()}`)

    // ensure uniqueness (exclude previous slug if editing)
    const taken = new Set(current.artworks.filter(a => !prev || a.slug !== prev.slug).map(a => a.slug))
    if (taken.has(slug)) {
      const root = slug
      let n = 2
      while (taken.has(`${root}-${n}`)) n++
      slug = `${root}-${n}`
    }

    const price = toNum(BODY.price, Array.isArray(BODY.formats) && BODY.formats[0] ? toNum((BODY.formats as any)[0]?.price, 0) : 0)

    // normalize formats
    const formats: Format[] = Array.isArray(BODY.formats)
      ? BODY.formats
          .filter(f => f && typeof f === 'object' && String(f.label || '').trim())
          .map((f, i) => ({ id: String((f as any).id || `f-${i + 1}`), label: String((f as any).label), price: toNum((f as any).price) }))
      : (prev?.formats || [])

    // build final artwork, preserving previous fields when not provided
    const artwork: Artwork = {
      id,
      slug,
      title: String(BODY.title ?? prev?.title ?? ''),
      artistId: String(BODY.artistId ?? prev?.artistId ?? ''),
      image: BODY.image !== undefined ? String(BODY.image) : (prev?.image || ''),
      mockup: BODY.mockup !== undefined ? (BODY.mockup ? String(BODY.mockup) : undefined) : prev?.mockup,
      price,
      description: BODY.description !== undefined ? (BODY.description as any as string) : prev?.description,
      year: BODY.year !== undefined ? toNum(BODY.year) : prev?.year,
      technique: BODY.technique !== undefined ? (BODY.technique as any as string) : prev?.technique,
      paper: BODY.paper !== undefined ? (BODY.paper as any as string) : prev?.paper,
      size: BODY.size !== undefined ? (BODY.size as any as string) : prev?.size,
      edition: BODY.edition !== undefined ? (BODY.edition as any as string) : prev?.edition,
      formats,
    }

    // 3) upsert
    const idx = current.artworks.findIndex(a => a.id === id || a.slug === slug)
    if (idx >= 0) current.artworks[idx] = artwork
    else current.artworks.push(artwork)

    // 4) backup horodaté puis écriture atomique
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const backupKey = `catalog-backups/catalog-${ts}.json`
    await writeBlobJSON(backupKey, current)
    await writeBlobJSON(key, current)

    return NextResponse.json(
      { ok: true, artwork, counts: { artworks: current.artworks.length } },
      { status: 201 }
    )
  } catch (e) {
    console.error('SAVE_ARTWORK POST ERROR', e)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  // sécurité de base
  const m = assertMethod(req, ['PUT']); if (m) return m
  if (!rateLimit(req, 20, 60_000)) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  const a = assertAdmin(req); if (a) return a

  try {
    const url = new URL(req.url)
    const idFromQuery = url.searchParams.get('id') || ''
    const BODY = await req.json().catch(() => ({})) as Partial<Artwork>
    const id = String(BODY.id || idFromQuery || '')

    if (!id) return NextResponse.json({ ok: false, error: 'missing_id' }, { status: 400 })

    const key = (process.env.CATALOG_BLOB_KEY || '').replace(/^\/+/, '')
    if (!key) return NextResponse.json({ ok: false, error: 'blob_key_missing' }, { status: 500 })

    // 1) lire catalogue courant
    let current = await readBlobJSON<Catalog>(key)
    if (!current) current = { artists: [], artworks: [] }
    current.artworks = Array.isArray(current.artworks) ? current.artworks : []

    // 2) retrouver l'œuvre existante par id (strict)
    const prevIdx = current.artworks.findIndex(a => a.id === id)
    if (prevIdx === -1) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    }
    const prev = current.artworks[prevIdx]

    // 3) slug demandé & base
    const requestedSlug = safeSlug(BODY.slug || '')
    const baseSlug = requestedSlug || safeSlug(prev.slug || BODY.title || BODY.id || id)

    // 4) si aucun changement explicite de slug, conserver celui d'avant
    let slug = (requestedSlug && requestedSlug !== prev.slug) ? requestedSlug : (prev.slug || baseSlug || `art-${Date.now()}`)

    // 5) unicité du slug (en excluant l'item courant)
    const taken = new Set(current.artworks.filter(a => a.id !== id).map(a => a.slug))
    if (taken.has(slug)) {
      const root = slug
      let n = 2
      while (taken.has(`${root}-${n}`)) n++
      slug = `${root}-${n}`
    }

    // 6) calcul prix & formats
    const price = toNum(BODY.price, Array.isArray(BODY.formats) && (BODY.formats as any)[0] ? toNum((BODY.formats as any)[0]?.price, prev.price || 0) : (prev.price || 0))

    const formats: Format[] = Array.isArray(BODY.formats)
      ? BODY.formats
          .filter(f => f && typeof f === 'object' && String((f as any).label || '').trim())
          .map((f, i) => ({ id: String((f as any).id || `f-${i + 1}`), label: String((f as any).label), price: toNum((f as any).price) }))
      : (prev.formats || [])

    // 7) fusion finale
    const artwork: Artwork = {
      id: prev.id,
      slug,
      title: String(BODY.title ?? prev.title ?? ''),
      artistId: String(BODY.artistId ?? prev.artistId ?? ''),
      image: BODY.image !== undefined ? String(BODY.image) : (prev.image || ''),
      mockup: BODY.mockup !== undefined ? (BODY.mockup ? String(BODY.mockup) : undefined) : prev.mockup,
      price,
      description: BODY.description !== undefined ? (BODY.description as any as string) : prev.description,
      year: BODY.year !== undefined ? toNum(BODY.year) : prev.year,
      technique: BODY.technique !== undefined ? (BODY.technique as any as string) : prev.technique,
      paper: BODY.paper !== undefined ? (BODY.paper as any as string) : prev.paper,
      size: BODY.size !== undefined ? (BODY.size as any as string) : prev.size,
      edition: BODY.edition !== undefined ? (BODY.edition as any as string) : prev.edition,
      formats,
    }

    // 8) remplacement en place puis écriture
    current.artworks[prevIdx] = artwork

    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const backupKey = `catalog-backups/catalog-${ts}.json`
    await writeBlobJSON(backupKey, current)
    await writeBlobJSON(key, current)

    return NextResponse.json({ ok: true, artwork, counts: { artworks: current.artworks.length } }, { status: 200 })
  } catch (e) {
    console.error('SAVE_ARTWORK PUT ERROR', e)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}