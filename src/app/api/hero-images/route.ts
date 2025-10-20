import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const prefix = 'images/artworks/'
    const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

    // During local builds or missing credentials, fall back to an empty array
    if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_READ_TOKEN) {
      return NextResponse.json({ files: [] })
    }

    const { blobs } = await list({ prefix })
    const files = blobs
      .filter((blob) => allowed.has(blob.pathname.slice(blob.pathname.lastIndexOf('.')).toLowerCase()))
      .map((blob) => blob.url)
    return NextResponse.json({ files })
  } catch (e) {
    return NextResponse.json({ files: [] }, { status: 200 })
  }
}
