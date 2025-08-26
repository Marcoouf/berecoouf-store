import { NextResponse } from 'next/server'

function getCookie(req: Request, name: string) {
  const raw = req.headers.get('cookie') || ''
  const m = raw.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))
  return m ? decodeURIComponent(m.split('=').slice(1).join('=')) : undefined
}

/**
 * Vérifie l’accès admin :
 *  - Cookie de session: pb_admin_session=ok (défini par /api/admin/login)
 *  - Ou en-tête x-admin-key égal à ADMIN_KEY (fallback/outillage)
 */
export function assertAdmin(req: Request) {
  const strong = process.env.ADMIN_KEY
  const fromHeader = req.headers.get('x-admin-key')

  const session = getCookie(req, 'pb_admin_session')
  const byCookie = session === 'ok'
  const byHeader = !!strong && fromHeader === strong

  if (!byCookie && !byHeader) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  return null
}

/** Refuse les méthodes non prévues. */
export function assertMethod(req: Request, methods: Array<'POST' | 'PUT' | 'DELETE'>) {
  if (!methods.includes(req.method as any)) {
    return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 })
  }
  return null
}