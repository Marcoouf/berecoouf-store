// src/lib/getCatalog.ts
import 'server-only'
import type { Artist, Artwork } from '@/lib/types'

export const dynamic = 'force-dynamic'

export type Catalog = {
  artists: Artist[]
  artworks: Artwork[]
}

// Construit une base URL absolue qui marche en local et sur Vercel
function getBaseUrl(): string {
  // 1) Si on a défini explicitement l'URL publique
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit && explicit.trim()) return explicit.replace(/\/$/, '')

  // 2) En prod/préprod Vercel, VERCEL_URL ne contient PAS le protocole
  const vercel = process.env.VERCEL_URL
  if (vercel && vercel.trim()) return `https://${vercel.replace(/\/$/, '')}`

  // 3) Fallback: dev local
  const port = process.env.PORT ?? '3000'
  return `http://localhost:${port}`
}

// Ajoute l’en-tête de contournement si la « Deployment Protection » est activée
function getBypassHeaders(): HeadersInit | undefined {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  if (!secret) return undefined
  return { 'x-vercel-protection-bypass': secret }
}

export async function getCatalog(): Promise<Catalog> {
  const base = getBaseUrl()
  const url = `${base}/api/catalog`

  const res = await fetch(url, {
    // On ne met pas en cache: la page d’accueil lit des données qui peuvent changer
    cache: 'no-store',
    // Recommandé également par Next pour désactiver la revalidation ISR côté serveur
    next: { revalidate: 0 },
    // Si Vercel Protection est active, on envoie le header
    headers: getBypassHeaders(),
  })

  if (!res.ok) {
    throw new Error(`Échec du chargement du catalogue: ${res.status} ${res.statusText}`)
  }

  return (await res.json()) as Catalog
}