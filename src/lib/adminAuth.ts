import { NextResponse } from 'next/server'

/**
 * Vérifie la présence d'une clé d'admin dans l'en-tête "x-admin-key".
 * - ADMIN_KEY : clé forte côté serveur (jamais exposée)
 * - NEXT_PUBLIC_ADMIN_CALL (optionnel) : clé d'appel "faible" acceptée
 *   uniquement si la requête provient de ton site (referer).
 */
export function assertAdmin(req: Request) {
  const header = req.headers.get('x-admin-key')
  const strong = process.env.ADMIN_KEY
  const weak = process.env.NEXT_PUBLIC_ADMIN_CALL // optionnel

  // Verrou d'origine (si on utilise la clé "weak")
  const referer = req.headers.get('referer') || ''
  const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  const originOk = site && referer.startsWith(site)

  const ok =
    (!!strong && header === strong) ||
    (!!weak && header === weak && originOk)

  if (!ok) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  return null
}

/** Refuse les méthodes non prévues. */
export function assertMethod(req: Request, methods: Array<'POST'|'PUT'|'DELETE'>) {
  if (!methods.includes(req.method as any)) {
    return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 })
  }
  return null
}
