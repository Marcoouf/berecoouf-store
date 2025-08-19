import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  const dir = path.join(process.cwd(), 'public', 'images', 'artworks')
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
    const files = entries
      .filter(e => e.isFile() && allowed.has(path.extname(e.name).toLowerCase()))
      .map(e => `/images/artworks/${e.name}`)
    return NextResponse.json({ files })
  } catch (e) {
    return NextResponse.json({ files: [] }, { status: 200 })
  }
}