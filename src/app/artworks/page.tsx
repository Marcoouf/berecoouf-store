import Breadcrumb from '@/components/Breadcrumb'
import SmartImage from '@/components/SmartImage'
import { getCatalog } from '@/lib/getCatalog'
import { euro } from '@/lib/format'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Toutes les œuvres — Vague',
  description:
    'Découvrez l’ensemble des illustrations et tirages disponibles : éditions limitées, formats encadrés ou numériques, expédition suivie et fichiers HD.',
  alternates: { canonical: '/artworks' },
}

type SearchParams = {
  artist?: string
  q?: string
  max?: string
  sort?: string
}

type SortKey = 'titleAsc' | 'titleDesc' | 'priceAsc' | 'priceDesc' | 'recent'

const sortLabels: Record<SortKey, string> = {
  titleAsc: 'Titre A → Z',
  titleDesc: 'Titre Z → A',
  priceAsc: 'Prix croissant',
  priceDesc: 'Prix décroissant',
  recent: 'Nouveautés',
}

const parseSort = (value: string | undefined): SortKey => {
  if (!value) return 'titleAsc'
  return (['titleAsc', 'titleDesc', 'priceAsc', 'priceDesc', 'recent'] as SortKey[]).includes(value as SortKey)
    ? (value as SortKey)
    : 'titleAsc'
}

const unitPriceCents = (work: any): number => {
  const fromPriceMin = Number(work?.priceMin)
  if (Number.isFinite(fromPriceMin) && fromPriceMin > 0) return fromPriceMin

  if (Array.isArray(work?.formats) && work.formats.length > 0) {
    const min = work.formats.reduce((m: number, f: any) => Math.min(m, Number(f.price || 0)), Infinity)
    if (Number.isFinite(min) && min !== Infinity) return min
  }

  const fromPrice = Number(work?.price)
  return Number.isFinite(fromPrice) ? fromPrice : 0
}

const yearOrRecentScore = (work: any, index: number): number => {
  const year = Number(work?.year)
  if (Number.isFinite(year) && year > 0) return year
  return Number.MAX_SAFE_INTEGER - index
}

const filterArtworks = (artworks: any[], searchParams: SearchParams) => {
  const artistId = searchParams.artist && searchParams.artist !== 'all' ? searchParams.artist : null
  const q = searchParams.q?.trim().toLowerCase() ?? ''
  const sort = parseSort(searchParams.sort)

  let filtered = [...artworks]
  const indexMap = new Map(artworks.map((item, idx) => [item.id, idx]))

  if (artistId) filtered = filtered.filter((w) => w.artistId === artistId)

  if (q) {
    filtered = filtered.filter((w) => (w.title || '').toLowerCase().includes(q))
  }

  if (typeof searchParams.max === 'string' && searchParams.max !== '') {
    const maxEuros = Number(searchParams.max)
    if (!Number.isNaN(maxEuros)) {
      const cap = Math.round(maxEuros * 100)
      filtered = filtered.filter((w) => unitPriceCents(w) <= cap)
    }
  }

  switch (sort) {
    case 'priceAsc':
      filtered.sort((a, b) => unitPriceCents(a) - unitPriceCents(b))
      break
    case 'priceDesc':
      filtered.sort((a, b) => unitPriceCents(b) - unitPriceCents(a))
      break
    case 'titleDesc':
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' }) * -1)
      break
    case 'recent':
      filtered.sort((a, b) => yearOrRecentScore(b, indexMap.get(b.id) ?? 0) - yearOrRecentScore(a, indexMap.get(a.id) ?? 0))
      break
    case 'titleAsc':
    default:
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' }))
  }

  return filtered
}

export default async function ArtworksPage({ searchParams }: { searchParams: SearchParams }) {
  const { artworks, artists } = await getCatalog()

  const artistOptions = artists.map((a) => ({ label: a.name, value: a.id }))
  const maxAvailableEuros = (() => {
    const prices = artworks.map(unitPriceCents).filter((n) => Number.isFinite(n) && n > 0)
    const maxCents = prices.length ? Math.max(...prices) : 0
    return Math.max(0, Math.round(maxCents / 100))
  })()

  const filtered = filterArtworks(artworks, searchParams)
  const count = filtered.length

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Œuvres' }]} />
      <h1 className="text-2xl sm:text-3xl font-medium mb-6">Toutes les œuvres</h1>

      <form className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" method="get" suppressHydrationWarning>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600" htmlFor="artist">
            Artiste
          </label>
          <select
            id="artist"
            name="artist"
            defaultValue={searchParams.artist ?? 'all'}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="all">Tous</option>
            {artistOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600" htmlFor="q">
            Recherche
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={searchParams.q ?? ''}
            placeholder="Titre d’une œuvre"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600" htmlFor="max">
            Prix max (€)
          </label>
          <input
            id="max"
            name="max"
            type="number"
            inputMode="numeric"
            min={0}
            max={maxAvailableEuros || undefined}
            defaultValue={searchParams.max ?? ''}
            placeholder={maxAvailableEuros ? `jusqu’à ${maxAvailableEuros}` : '—'}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600" htmlFor="sort">
            Tri
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={parseSort(searchParams.sort)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            {(Object.keys(sortLabels) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {sortLabels[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink transition hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Appliquer les filtres
          </button>
          <Link href="/artworks" className="text-sm text-accent underline-offset-4 hover:underline">
            Réinitialiser
          </Link>
          <span className="ml-auto text-xs text-neutral-500" aria-live="polite">
            {count} œuvre{count > 1 ? 's' : ''}
          </span>
        </div>
      </form>

      {count === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-8 text-center text-sm text-neutral-600">
          Aucune œuvre ne correspond à vos filtres pour le moment. Modifiez les critères ou découvrez toutes nos collections.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((art) => {
            const priceLabel: string =
              (art as any).priceMinFormatted ??
              (typeof (art as any).priceMin === 'number' ? euro((art as any).priceMin) : euro(unitPriceCents(art)))
            const image =
              (art as any).cover?.url ?? (art as any).image ?? (art as any).mockup ??
              (Array.isArray((art as any).images) ? (art as any).images[0]?.url : undefined)

            return (
              <div key={art.id} className="flex flex-col">
                <Link
                  href={`/artworks/${art.slug}`}
                  className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl border bg-white">
                    {image ? (
                      <SmartImage
                        src={image}
                        alt={`Visuel de l’œuvre ${art.title}`}
                        fill
                        wrapperClass="absolute inset-0 flex items-center justify-center p-4"
                        className="!object-contain"
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        draggable={false}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
                        Visuel en préparation
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="truncate text-sm font-medium group-hover:text-accent transition">{art.title}</div>
                    <div className="ml-auto text-sm tabular-nums">{priceLabel}</div>
                  </div>
                </Link>
                {art.artist?.name ? (
                  <div className="text-xs text-neutral-500">{art.artist.name}</div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
