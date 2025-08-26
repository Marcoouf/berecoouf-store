// src/app/api/catalog/route.ts
import { NextResponse } from 'next/server'
import { getCatalog } from '@/lib/getCatalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await getCatalog()
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}