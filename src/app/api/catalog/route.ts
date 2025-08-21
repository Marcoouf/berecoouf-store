// src/app/api/catalog/route.ts
import { NextResponse } from 'next/server'
import path from 'node:path'
import { promises as fs } from 'node:fs'

// Données statiques existantes
import { artists as staticArtists, artworks as staticArtworks } from '@/lib/data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CATALOG_PATH = path.join(process.cwd(), 'data', 'catalog.json')

async function readDrafts() {
  try {
    const raw = await fs.readFile(CATALOG_PATH, 'utf8')
    const json = JSON.parse(raw) as { artists?: any[]; artworks?: any[] }
    return {
      artists: Array.isArray(json.artists) ? json.artists : [],
      artworks: Array.isArray(json.artworks) ? json.artworks : [],
    }
  } catch {
    return { artists: [], artworks: [] }
  }
}

function mergeBySlug<T extends { slug: string }>(base: T[], drafts: T[]): T[] {
  const map = new Map<string, T>()
  for (const a of base) map.set(a.slug, a)   // base = lib/data
  for (const d of drafts) map.set(d.slug, d) // drafts écrasent si même slug
  return Array.from(map.values())
}

export async function GET() {
  const drafts = await readDrafts()

  // Artistes : on garde les statiques comme source principale
  const artists = mergeBySlug(staticArtists as any, drafts.artists as any)

  // Œuvres : statiques + admin (admin écrase si même slug)
  const artworks = mergeBySlug(staticArtworks as any, drafts.artworks as any)

  return NextResponse.json({ artists, artworks }, { headers: { 'Cache-Control': 'no-store' } })
}