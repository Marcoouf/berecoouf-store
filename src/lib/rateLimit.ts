const hits = new Map<string, { c: number; t: number }>()

/**
 * Limite "limit" requêtes par fenêtre "windowMs" pour une IP.
 * Retourne true si OK, false si bloqué.
 */
export function rateLimit(req: Request, limit = 20, windowMs = 60_000) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const now = Date.now()
  const r = hits.get(ip) || { c: 0, t: now }
  if (now - r.t > windowMs) { r.c = 0; r.t = now }
  r.c++
  hits.set(ip, r)
  return r.c <= limit
}
