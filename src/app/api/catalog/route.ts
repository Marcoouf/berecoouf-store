// src/app/api/catalog/route.ts
import { NextResponse } from 'next/server'
import path from 'node:path'
import { promises as fs } from 'node:fs'

// Données statiques existantes (fallback robuste)
import { artists as staticArtists, artworks as staticArtworks } from '@/lib/data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Chemins possibles du catalogue généré (ordre de priorité)
const PUBLIC_CATALOG_PATH = path.join(process.cwd(), 'public', 'catalog.json')
const DATA_CATALOG_PATH   = path.join(process.cwd(), 'data',   'catalog.json')

type Catalog = { artists?: any[]; artworks?: any[] }

async function readJsonSafe(p: string): Promise<Catalog | null> {
  try {
    const raw = await fs.readFile(p, 'utf8')
    const json = JSON.parse(raw) as Catalog
    return json
  } catch {
    return null
  }
}

async function readDrafts() {
  // 1) privilégie public/catalog.json (présent après build/copier)
  const fromPublic = await readJsonSafe(PUBLIC_CATALOG_PATH)
  if (fromPublic) {
    return {
      artists: Array.isArray(fromPublic.artists) ? fromPublic.artists : [],
      artworks: Array.isArray(fromPublic.artworks) ? fromPublic.artworks : [],
    }
  }
  // 2) sinon tente data/catalog.json (dev/local)
  const fromData = await readJsonSafe(DATA_CATALOG_PATH)
  if (fromData) {
    return {
      artists: Array.isArray(fromData.artists) ? fromData.artists : [],
      artworks: Array.isArray(fromData.artworks) ? fromData.artworks : [],
    }
  }
  // 3) sinon aucun draft
  return { artists: [], artworks: [] }
}

function mergeBySlug<T extends { slug: string }>(base: T[], drafts: T[]): T[] {
  const map = new Map<string, T>()
  for (const a of base) if (a && typeof a.slug === 'string') map.set(a.slug, a)
  for (const d of drafts) if (d && typeof d.slug === 'string') map.set(d.slug, d)
  return Array.from(map.values())
}

export async function GET() {
  const drafts = await readDrafts()

  // Artistes : on garde les statiques comme source principale et on laisse
  // les entrées avec le même slug écraser depuis les brouillons
  const artists = mergeBySlug(staticArtists as any[], drafts.artists as any[])

  // Œuvres : statiques + admin (admin écrase si même slug)
  const artworks = mergeBySlug(staticArtworks as any[], drafts.artworks as any[])

  return NextResponse.json(
    { artists, artworks },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}