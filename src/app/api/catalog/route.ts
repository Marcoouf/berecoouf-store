// src/app/api/catalog/route.ts
import { NextResponse } from 'next/server'
import { getCatalog } from '@/lib/getCatalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getCatalog()
    return NextResponse.json(data, { status: 200 })
  } catch (e) {
    console.error('api/catalog error', e)
    return NextResponse.json({ artists: [], artworks: [] }, { status: 200 })
  }
}