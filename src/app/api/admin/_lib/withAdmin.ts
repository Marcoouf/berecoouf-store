import { NextRequest, NextResponse } from 'next/server'

export function withAdmin<T extends (req: NextRequest, ...rest: any[]) => Promise<Response>>(handler: T) {
  return async (req: NextRequest, ...rest: any[]) => {
    const expectedKeys = [process.env.ADMIN_KEY, process.env.NEXT_PUBLIC_ADMIN_KEY]
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim())

    if (expectedKeys.length === 0) {
      return NextResponse.json({ ok: false, error: 'Server misconfigured: no ADMIN_KEY set' }, { status: 500 })
    }

    const url = new URL(req.url)
    const fromHeader = (req.headers.get('x-admin-key') || '').trim()
    const fromAuth = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
    const fromCookie = (req.cookies?.get?.('admin_key')?.value || '').trim()
    const fromQuery = (url.searchParams.get('admin_key') || '').trim()

    const provided = fromHeader || fromAuth || fromCookie || fromQuery
    const ok = provided && expectedKeys.some((k) => k === provided)
    if (!ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    return handler(req, ...rest)
  }
}

