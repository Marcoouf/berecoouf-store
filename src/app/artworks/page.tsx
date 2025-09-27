'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import SmartImage from '@/components/SmartImage'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { euro } from '@/lib/format'

// --- Prix utilitaires (en CENTIMES) ---
function unitPriceCents(w: any): number {
  // Priorité à priceMin (fourni par l'API / Prisma), sinon min des formats, sinon fallback `price`.
  const fromPriceMin = Number(w?.priceMin)
  if (Number.isFinite(fromPriceMin) && fromPriceMin > 0) return fromPriceMin

  if (Array.isArray(w?.formats) && w.formats.length > 0) {
    const min = w.formats.reduce((m: number, f: any) => Math.min(m, Number(f.price || 0)), Infinity)
    if (Number.isFinite(min) && min !== Infinity) return min
  }

  const fromPrice = Number(w?.price)
  return Number.isFinite(fromPrice) ? fromPrice : 0
}

function ArtworkCard({
  artwork,
  artist,
}: {
  artwork: any
  artist: any
}) {
  // Affichage prix : priorité à priceMinFormatted ; sinon, on formate directement des CENTIMES
  const priceLabel: string =
    (artwork as any).priceMinFormatted ??
    (typeof (artwork as any).priceMin === 'number'
      ? euro((artwork as any).priceMin) // priceMin est en centimes
      : euro(unitPriceCents(artwork))); // unitPriceCents renvoie des centimes

  return (
    <div className="flex flex-col">
      <Link href={`/artworks/${artwork.slug}`} scroll className="group block">
        <div className="aspect-square relative overflow-hidden rounded-lg border bg-white">
          <SmartImage
            src={artwork.image}
            alt={artwork.title}
            fill
            wrapperClass="absolute inset-0 flex items-center justify-center p-4"
            className="!object-contain mx-auto"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            draggable={false}
          />
          <span className="pointer-events-none absolute inset-0 select-none" aria-hidden />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="truncate text-sm font-medium">{artwork.title}</div>
          <div className="ml-auto text-sm tabular-nums">{priceLabel}</div>
        </div>
        <div className="text-xs text-neutral-500">{artist?.name}</div>
      </Link>
    </div>
  )
}

function ArtworksPageInner() {
  // → on lit toujours le catalogue depuis /api/catalog (DB), sans données locales
  const [artworks, setArtworks] = useState<any[]>([])
  const [artists, setArtists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/catalog', { cache: 'no-store' })
      .then(r => r.json())
      .then((data) => {
        if (!active) return
        if (Array.isArray(data.artworks)) {
          setArtworks(data.artworks)
        }
        if (Array.isArray(data.artists)) {
          setArtists(data.artists)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => { active = false }
  }, [])

  // — Etats filtres & tri (synchro URL)
  const search = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [artistId, setArtistId] = useState<string>(search.get('artist') || 'all')
  const [q, setQ] = useState<string>(search.get('q') || '')
  const [max, setMax] = useState<string>(search.get('max') || '') // saisi utilisateur en EUROS ; converti en cents plus bas
  const [sort, setSort] = useState<'titleAsc' | 'titleDesc' | 'priceAsc' | 'priceDesc'>(
    (search.get('sort') as any) || 'titleAsc'
  )

  // push des filtres dans l'URL (sans rechargement)
  useEffect(() => {
    const params = new URLSearchParams()
    if (artistId && artistId !== 'all') params.set('artist', artistId)
    if (q.trim()) params.set('q', q.trim())
    if (max !== '') params.set('max', String(max))
    if (sort !== 'titleAsc') params.set('sort', sort)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [artistId, q, max, sort, router, pathname])

  const maxAvailableEuros = useMemo(() => {
    const prices = artworks.map(unitPriceCents).filter(n => Number.isFinite(n))
    const maxCents = prices.length ? Math.max(...prices) : 0
    return Math.round(maxCents / 100)
  }, [artworks])

  const filtered = useMemo(() => {
    let list = [...artworks]

    if (artistId !== 'all') list = list.filter(w => w.artistId === artistId)
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      list = list.filter(w => (w.title || '').toLowerCase().includes(needle))
    }

    // Filtre prix max en EUROS → on convertit en CENTS pour comparer
    const maxNumEuros = Number(max)
    if (!Number.isNaN(maxNumEuros) && max !== '') {
      const cap = Math.round(maxNumEuros * 100)
      list = list.filter(w => unitPriceCents(w) <= cap)
    }

    switch (sort) {
      case 'priceAsc':
        list.sort((a, b) => unitPriceCents(a) - unitPriceCents(b))
        break
      case 'priceDesc':
        list.sort((a, b) => unitPriceCents(b) - unitPriceCents(a))
        break
      case 'titleDesc':
        list.sort((a, b) => (a.title || '').localeCompare(b.title || '') * -1)
        break
      case 'titleAsc':
      default:
        list.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    }
    return list
  }, [artworks, artistId, q, max, sort])

  const reset = () => {
    setArtistId('all')
    setQ('')
    setMax('')
    setSort('titleAsc')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Œuvres' }]} />
      <h1 className="text-2xl sm:text-3xl font-medium mb-6">Toutes les œuvres</h1>

      {/* Barre de filtres */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Artiste</label>
          <select
            value={artistId}
            onChange={e => setArtistId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="all">Tous</option>
            {artists.map((a: any) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Recherche</label>
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Titre d’une œuvre"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Prix max (€)</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={maxAvailableEuros || undefined}
            value={max}
            onChange={e => setMax(e.target.value)}
            placeholder={maxAvailableEuros ? `jusqu’à ${maxAvailableEuros}` : '—'}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Trier par</label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="titleAsc">Titre A→Z</option>
              <option value="titleDesc">Titre Z→A</option>
              <option value="priceAsc">Prix croissant</option>
              <option value="priceDesc">Prix décroissant</option>
            </select>
          </div>
          <div className="self-end">
            <button
              type="button"
              onClick={reset}
              className="h-[38px] rounded-lg border px-3 text-sm hover:bg-neutral-50"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* État de chargement */}
      {loading && (
        <div className="mb-4 text-xs text-neutral-500">Mise à jour…</div>
      )}

      {/* Grille */}
      <div className="grid items-stretch gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map(w => {
          const artist = artists.find((a: any) => a.id === w.artistId)
          return (
            <ArtworkCard key={w.id} artwork={w} artist={artist} />
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-lg border p-6 text-sm text-neutral-600">
            Aucune œuvre ne correspond à ces filtres.
          </div>
        )}
      </div>
    </div>
  )
}

export default function ArtworksPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Chargement…</div>}>
      <ArtworksPageInner />
    </Suspense>
  )
}
