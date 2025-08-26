import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  // Admin désactivée ?
  if (process.env.ADMIN_ENABLED !== 'true') {
    return NextResponse.json({ ok: false, error: 'admin_disabled' }, { status: 404 })
  }
  // Anti-bruteforce léger
  if (!rateLimit(req, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }
  try {
    const { key } = await req.json().catch(() => ({}))
    const clientKey = (key || '').trim()
    const ADMIN = (process.env.ADMIN_KEY || '').trim()
    console.log('Login attempt', { clientKeyLength: clientKey.length, adminKeyLength: ADMIN.length })
    if (!ADMIN || clientKey !== ADMIN) {
      return NextResponse.json({ ok: false, error: 'bad_credentials' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set('pb_admin_session', 'ok', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8h
    })
    return res
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}

export async function DELETE() {
  if (process.env.ADMIN_ENABLED !== 'true') {
    return NextResponse.json({ ok: false, error: 'admin_disabled' }, { status: 404 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('pb_admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}