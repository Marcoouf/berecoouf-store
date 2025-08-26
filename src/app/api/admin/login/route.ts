import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  if (process.env.ADMIN_ENABLED !== 'true') {
    return NextResponse.json({ ok: false, error: 'admin désactivé' }, { status: 404 })
  }

  const { key } = await req.json().catch(() => ({}))
  if (!key || key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: 'clé invalide' }, { status: 401 })
  }

  // 12h de session. HttpOnly + Secure en prod.
  cookies().set('pb_admin_session', 'ok', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  return NextResponse.json({ ok: true })
}

export async function GET() {
  // logout
  cookies().set('pb_admin_session', '', { path: '/', maxAge: 0 })
  return NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}