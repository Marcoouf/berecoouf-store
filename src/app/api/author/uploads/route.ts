import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getAuthSession } from '@/lib/auth'

export const runtime = 'nodejs'

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
const MAX_BYTES = 12 * 1024 * 1024 // 12 Mo

function safeName(raw: string) {
  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.\-_]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase()
}

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user || !Array.isArray(session.user.artistIds) || session.user.artistIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'file_missing' }, { status: 400 })
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ ok: false, error: 'unsupported_type' }, { status: 415 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 })
    }

    const hint = typeof form.get('hint') === 'string' ? (form.get('hint') as string) : 'work'
    const base = safeName(hint || 'work')
    const ext = file.type.split('/')[1] || 'bin'
    const key = `authors/${base}-${Date.now()}.${ext}`

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json({ ok: false, error: 'missing_blob_token' }, { status: 500 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const blob = await put(key, arrayBuffer, {
      access: 'public',
      token,
      contentType: file.type,
    })

    return NextResponse.json({ ok: true, url: blob.url })
  } catch (err: any) {
    console.error('Author upload error', err)
    return NextResponse.json({ ok: false, error: err?.message || 'upload_failed' }, { status: 500 })
  }
}
