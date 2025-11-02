import Link from 'next/link'
import clsx from 'clsx'
import ConditionalPaddingImage from '@/components/ConditionalPaddingImage'
import { euro } from '@/lib/format'

type ArtworkLike = {
  id: string
  slug?: string | null
  title?: string | null
  image?: string | null
  cover?: { url?: string | null } | string | null
  mockup?: string | null
  images?: Array<{ url?: string | null } | string | null> | null
  price?: number | null
  priceMin?: number | null
  priceMinFormatted?: string | null
}

type Props = {
  artwork: ArtworkLike
  artistName?: string | null
  priceLabel?: string | null
  badge?: React.ReactNode | string | null
  className?: string
  imagePadding?: number
}

function resolveImage(art: ArtworkLike): string | null {
  if (typeof art.cover === 'string' && art.cover.trim().length > 0) return art.cover
  const cover = art.cover && typeof art.cover === 'object' ? art.cover.url : undefined
  if (cover && cover.trim().length > 0) return cover
  if (art.image && art.image.trim().length > 0) return art.image
  if (art.mockup && art.mockup.trim().length > 0) return art.mockup
  if (Array.isArray(art.images)) {
    for (const entry of art.images) {
      if (!entry) continue
      if (typeof entry === 'string' && entry.trim().length > 0) return entry
      if (typeof entry === 'object' && 'url' in entry && typeof entry.url === 'string' && entry.url.trim().length > 0) {
        return entry.url
      }
    }
  }
  return null
}

function computePriceLabel(art: ArtworkLike, fallback?: string | null): string | null {
  if (fallback) return fallback
  if (art.priceMinFormatted) return art.priceMinFormatted
  const numeric =
    (typeof art.priceMin === 'number' ? art.priceMin : null) ??
    (typeof art.price === 'number' ? art.price : null)
  if (numeric != null && Number.isFinite(numeric) && numeric > 0) return euro(numeric)
  return null
}

export default function ArtworkHoverCard({ artwork, artistName, priceLabel, badge, className, imagePadding = 28 }: Props) {
  const slug = artwork.slug || artwork.id
  const image = resolveImage(artwork)
  const label = computePriceLabel(artwork, priceLabel)

  const badgeNode =
    typeof badge === 'string'
      ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-100/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-900 shadow">
            {badge}
          </span>
        )
      : badge ?? null

  return (
    <Link
      href={`/artworks/${slug}`}
      scroll
      className={clsx(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-accent-300 focus:ring-offset-2',
        className,
      )}
      aria-label={`Voir l’œuvre ${artwork.title ?? ''}`.trim() || 'Voir l’œuvre'}
    >
      <div className="relative aspect-square w-full">
        {image ? (
          <ConditionalPaddingImage
            src={image}
            alt={`Visuel de l’œuvre ${artwork.title ?? ''}`.trim() || 'Visuel de l’œuvre'}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            padding={imagePadding}
            imageClassName="transition-transform duration-500 group-hover:scale-105 group-focus-visible:scale-105 !object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-accent text-ink text-sm font-medium">
            {artwork.title ?? 'Œuvre'}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-accent/70 via-accent/15 to-transparent opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />

        {badgeNode ? (
          <div className="pointer-events-none absolute left-4 top-4 z-10">{badgeNode}</div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-5 text-white opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        <div className="rounded-2xl bg-accent/80 p-4 text-neutral-900 backdrop-blur-sm">
          {artistName ? (
            <div className="text-[11px] uppercase tracking-[0.32em] text-neutral-700">
              {artistName}
            </div>
          ) : null}
          <div className="mt-2 text-lg font-semibold leading-tight text-neutral-900">
            {artwork.title ?? 'Œuvre sans titre'}
          </div>
          {label ? (
            <div className="mt-2 text-sm text-neutral-800">À partir de {label}</div>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
