import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getCatalog } from '@/lib/getCatalog'
import { assertAdmin, assertMethod } from '@/lib/adminAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const m = assertMethod(req, ['POST']); if (m) return m
  const a = assertAdmin(req); if (a) return a

  try {
    const key = (process.env.CATALOG_BLOB_KEY || '').replace(/^\/+/, '')
    if (!key) return NextResponse.json({ ok: false, error: 'blob_key_missing' }, { status: 500 })

    const merged = await getCatalog()
    await put(key, new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' }), {
      access: 'public',
      contentType: 'application/json',
      cacheControlMaxAge: 0,
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    return NextResponse.json({ ok: true, counts: { artists: merged.artists.length, artworks: merged.artworks.length } })
  } catch (e) {
    console.error('MIGRATE ERROR', e)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}