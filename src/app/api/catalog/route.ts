// src/app/api/catalog/route.ts
import { NextResponse } from 'next/server'
import { getCatalog } from '@/lib/getCatalog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = await getCatalog()
    return NextResponse.json(data, {
      headers: { 'cache-control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('GET /api/catalog', err)
    return NextResponse.json({ artists: [], artworks: [] }, { status: 500 })
  }
}