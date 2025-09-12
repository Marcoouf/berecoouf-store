import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'

export async function GET() {
  try {
    const prefix = 'images/artworks/';
    const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
    const { blobs } = await list({ prefix });
    const files = blobs
      .filter((blob) => allowed.has(blob.pathname.slice(blob.pathname.lastIndexOf('.')).toLowerCase()))
      .map((blob) => blob.url);
    return NextResponse.json({ files });
  } catch (e) {
    return NextResponse.json({ files: [] }, { status: 200 });
  }
}