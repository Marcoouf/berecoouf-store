import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { key } = await req.json()
    const ADMIN = process.env.ADMIN_KEY
    if (!ADMIN) {
      return NextResponse.json({ ok: false, error: 'ADMIN_KEY manquante' }, { status: 500 })
    }
    if (key !== ADMIN) {
      return NextResponse.json({ ok: false, error: 'Clé invalide' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set('pb_admin_session', 'ok', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8h
    })
    return res
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad Request' }, { status: 400 })
  }
}
