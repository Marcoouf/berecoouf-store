'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { artworks as staticArtworks, artists as staticArtists } from '@/lib/data'

// petit util pour obtenir un prix "défaut" (si formats présents on prend le moins cher)
function basePrice(w: any): number {
  if (Array.isArray(w?.formats) && w.formats.length > 0) {
    return w.formats.reduce((m: number, f: any) => Math.min(m, Number(f.price || 0)), Infinity)
  }
  return Number(w?.price || 0)
}

// simple format monétaire suffixé d'un €
function euro(n: number) {
  if (!Number.isFinite(n)) return '—'
  return `${Math.round(n)}\u00A0€`
}

export default function ArtworksPage() {
  // → on précharge avec les données statiques, puis on remplace par /api/catalog (permet de voir aussi les oeuvres créées depuis l'admin)
  const [artworks, setArtworks] = useState<any[]>(staticArtworks)
  const [artists, setArtists] = useState<any[]>(staticArtists)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch('/api/catalog')
      .then(r => r.json())
      .then((data) => {
        if (!active) return
        if (Array.isArray(data.artworks)) setArtworks(data.artworks)
        if (Array.isArray(data.artists)) setArtists(data.artists)
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
  const [max, setMax] = useState<string>(search.get('max') || '') // saisi utilisateur; on convertit plus bas
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

  const maxAvailable = useMemo(() => {
    const prices = artworks.map(basePrice).filter(n => Number.isFinite(n))
    return prices.length ? Math.max(...prices) : 0
  }, [artworks])

  const filtered = useMemo(() => {
    let list = [...artworks]

    if (artistId !== 'all') list = list.filter(w => w.artistId === artistId)
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      list = list.filter(w => w.title?.toLowerCase().includes(needle))
    }
    const maxNum = Number(max)
    if (!Number.isNaN(maxNum) && max !== '') list = list.filter(w => basePrice(w) <= maxNum)

    switch (sort) {
      case 'priceAsc':
        list.sort((a, b) => basePrice(a) - basePrice(b))
        break
      case 'priceDesc':
        list.sort((a, b) => basePrice(b) - basePrice(a))
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
            max={maxAvailable || undefined}
            value={max}
            onChange={e => setMax(e.target.value)}
            placeholder={maxAvailable ? `jusqu’à ${maxAvailable}` : '—'}
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
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map(w => {
          const artist = artists.find((a: any) => a.id === w.artistId)
          return (
            <Link key={w.id} href={`/artworks/${w.slug}`} scroll className="group block">
              <div className="aspect-[4/5] relative overflow-hidden rounded-lg border">
                <Image
                  src={w.image}
                  alt={w.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                />
              </div>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{w.title}</div>
                  <div className="text-xs text-neutral-500">{artist?.name}</div>
                </div>
                <div className="shrink-0 text-sm tabular-nums">{euro(basePrice(w))}</div>
              </div>
            </Link>
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
