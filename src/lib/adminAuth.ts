import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

function getCookie(req: Request, name: string) {
  const raw = req.headers.get('cookie') || ''
  const m = raw.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${name}=`))
  return m ? decodeURIComponent(m.split('=').slice(1).join('=')) : undefined
}

async function hasAdminSession() {
  try {
    const session = await getAuthSession()
    return session?.user?.role === 'admin'
  } catch {
    return false
  }
}

function headerProvidesAccess(req: Request): boolean {
  const strong = (process.env.ADMIN_KEY || '').trim()
  if (!strong) return false
  const fromHeader = (req.headers.get('x-admin-key') || '').trim()
  const fromAuth = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  return Boolean((fromHeader && fromHeader === strong) || (fromAuth && fromAuth === strong))
}

/**
 * Vérifie l’accès admin :
 *  - Session NextAuth avec rôle admin
 *  - Cookie pb_admin_session=ok (défini par /api/admin/login)
 *  - Ou en-tête x-admin-key / Authorization Bearer égal à ADMIN_KEY (usage outillage backend)
 */
export async function assertAdmin(req: Request) {
  const bySession = await hasAdminSession()
  const byCookie = getCookie(req, 'pb_admin_session') === 'ok'
  const byHeader = headerProvidesAccess(req)

  if (bySession || byCookie || byHeader) {
    return null
  }

  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
}

/** Refuse les méthodes non prévues. */
export function assertMethod(req: Request, methods: Array<'POST' | 'PUT' | 'DELETE'>) {
  if (!methods.includes(req.method as any)) {
    return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 })
  }
  return null
}
