import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { unstable_cache, revalidateTag } from 'next/cache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const HERO_CACHE_TAG = 'hero-images'
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

const getHeroImages = unstable_cache(
  async () => {
    try {
      const prefix = 'images/artworks/'
      const { blobs } = await list({ prefix })
      return blobs
        .filter((blob) => allowedExtensions.has(blob.pathname.slice(blob.pathname.lastIndexOf('.')).toLowerCase()))
        .map((blob) => blob.url)
    } catch (error) {
      console.error('hero-images-cache-error', error)
      return [] as string[]
    }
  },
  [HERO_CACHE_TAG],
  { revalidate: 300 },
)

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_READ_TOKEN) {
    return NextResponse.json({ files: [] })
  }

  const files = await getHeroImages()
  return NextResponse.json({ files })
}

export async function POST() {
  await revalidateTag(HERO_CACHE_TAG)
  return NextResponse.json({ ok: true })
}
