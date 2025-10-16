/**
 * Petit rate limiter en mémoire pour routes Next.js (Node ou Edge).
 * ⚠️ En serverless, ce Map n'est pas partagé entre instances et peut être réinitialisé à froid.
 * Pour de la prod critique, préférer un KV/Redis (Upstash, Vercel KV) avec un algo "sliding window".
 */

type Hit = { c: number; t: number } // count, start timestamp
const buckets = new Map<string, Hit>()

// Nettoyage paresseux pour éviter l'emballement du Map en long-run (dev local / single instance)
let sweepCounter = 0
const SWEEP_EVERY = 200

export type RateLimitOptions = {
  /** Max requêtes par fenêtre (défaut: 20) */
  limit?: number
  /** Taille de fenêtre rolling en ms (défaut: 60s) */
  windowMs?: number
  /**
   * Clé optionnelle pour segmenter (ex: 'checkout', 'webhook', 'admin')
   * La clé finale devient `${key}:${ip}`
   */
  key?: string
}

/**
 * Tente d'extraire une IP fiable depuis les en-têtes fournis par la plateforme.
 * - Vercel: `x-vercel-forwarded-for`
 * - Reverse proxy: `x-real-ip` ou `x-forwarded-for`
 * Fallback sur 'local' (dev).
 */
export function getClientIp(req: Request): string {
  const h = req.headers
  const ip =
    h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip')?.trim() ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'local'
  return ip
}

/**
 * Limite "limit" requêtes par fenêtre "windowMs" pour une IP (et clé optionnelle).
 * Retourne un objet riche incluant des headers standard de rate limit.
 *
 * Exemple d'usage dans une route:
 *   const { ok, headers } = rateLimit(req, { key: 'checkout', limit: 15, windowMs: 60_000 })
 *   if (!ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429, headers })
 */
export function rateLimit(req: Request, opts: RateLimitOptions = {}) {
  const { limit = 20, windowMs = 60_000, key } = opts
  const ip = getClientIp(req)
  const bucketKey = key ? `${key}:${ip}` : ip

  const now = Date.now()
  let hit = buckets.get(bucketKey)

  // (Re)démarre la fenêtre si entrée inexistante ou expirée
  if (!hit || now - hit.t > windowMs) {
    hit = { c: 0, t: now }
  }

  hit.c += 1
  buckets.set(bucketKey, hit)

  const remaining = Math.max(0, limit - hit.c)
  const ok = hit.c <= limit
  const resetAt = hit.t + windowMs
  const retryAfterSec = ok ? 0 : Math.ceil((resetAt - now) / 1000)

  // Nettoyage paresseux des clés trop anciennes
  if (++sweepCounter % SWEEP_EVERY === 0) {
    const cutoff = now - windowMs * 2
    for (const [k, v] of buckets) {
      if (v.t < cutoff) buckets.delete(k)
    }
  }

  // Headers standard pour aider le client/cdn
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', String(limit))
  headers.set('X-RateLimit-Remaining', String(remaining < 0 ? 0 : remaining))
  headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))
  if (!ok) headers.set('Retry-After', String(retryAfterSec))

  return { ok, remaining, resetAt, headers }
}
