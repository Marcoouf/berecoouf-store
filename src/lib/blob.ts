import { del } from '@vercel/blob'

function parseUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

export function isBlobUrl(input: string | null | undefined): boolean {
  if (!input) return false
  const parsed = parseUrl(input)
  if (!parsed) return false
  return /\.blob\.vercel-storage\.com$/i.test(parsed.hostname)
}

export async function deleteBlobIfNeeded(url: string | null | undefined): Promise<void> {
  if (!isBlobUrl(url)) return
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return
  try {
    await del(url as string, { token })
  } catch (err) {
    console.warn('Blob deletion failed', url, err)
  }
}
