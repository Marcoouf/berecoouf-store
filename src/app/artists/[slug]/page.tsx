import SmartImage from '@/components/SmartImage'
import ConditionalPaddingImage from '@/components/ConditionalPaddingImage'
import Link from 'next/link'
import ArtworkHoverCard from '@/components/ArtworkHoverCard'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import { euro } from '@/lib/format'
import { getCatalog } from '@/lib/getCatalog'
import { MoonIcon } from '@/components/icons'

export const dynamic = 'force-dynamic'

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = await prisma.artist.findFirst({
    where: { slug: params.slug, deletedAt: null, isArchived: false, isHidden: false },
    select: { name: true, bio: true },
  })
  const bio = artist?.bio ? artist.bio.trim() : ''
  return {
    title: artist ? `${artist.name} — Vague` : 'Artiste — Vague',
    description: bio || undefined,
    openGraph: {
      title: artist ? `${artist.name} — Vague` : 'Artiste — Vague',
      description: bio || undefined,
      type: 'profile',
    },
    alternates: { canonical: `/artists/${params.slug}` },
  }
}

export default async function ArtistPage({ params }: Props) {
  const artist = await prisma.artist.findFirst({
    where: { slug: params.slug, deletedAt: null, isArchived: false, isHidden: false },
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      image: true,      // cover
      portrait: true,   // avatar
      contactEmail: true,
      socials: true,
      handle: true,
      isOnVacation: true,
    },
  })
  if (!artist) {
    return <div className="mx-auto max-w-3xl px-6 py-20">Artiste introuvable.</div>
  }

  const { artworks } = await getCatalog()

  const norm = (s: any) => String(s ?? '').trim().toLowerCase()
  const works = artworks
    .filter((w: any) => {
      const byId   = norm(w.artistId) === norm(artist.id)
      const bySlug = norm((w as any).artistSlug) === norm(artist.slug)
      const byName = norm((w as any).artistName) === norm(artist.name)
      return byId || bySlug || byName
    })
    .sort((a: any, b: any) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }))

  // Hero image: prefer explicit artist.image, else first work mockup/image
  const heroSrc: string | undefined =
    (artist as any)?.image
    ?? (works.find(w => (w as any).mockup)?.mockup as string | undefined)
    ?? (works[0]?.image as string | undefined)

  const hasHero = Boolean(heroSrc)

  // Avatar & stats helpers
  const avatarSrc: string | undefined =
    (artist as any)?.portrait || (artist as any)?.image || (works[0]?.image as string | undefined)

  const worksCount = works.length
  const minPriceCents = worksCount ? Math.min(...works.map((w: any) => (w as any).priceMin ?? 0)) : 0
  const minPriceFormatted = worksCount
    ? (works.find((w: any) => (w as any).priceMin === minPriceCents) as any)?.priceMinFormatted ?? euro(minPriceCents)
    : euro(0)

  const socials: string[] = Array.isArray((artist as any)?.socials)
    ? ((artist as any).socials as string[]).filter(Boolean)
    : []
  const isOnVacation = Boolean((artist as any)?.isOnVacation)

  const labelFromUrl = (s: string) => {
    try {
      const u = new URL(s)
      return u.hostname.replace(/^www\./, '')
    } catch {
      return s.replace(/^https?:\/\//, '')
    }
  }

  // JSON-LD Artist schema for SEO (ok to keep here: not inside MDX articles)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  const canonicalUrl = `${siteUrl || ''}/artists/${artist.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artist.name,
    description: artist.bio ? artist.bio.trim() || undefined : undefined,
    url: canonicalUrl,
    image: heroSrc || undefined,
    sameAs: (artist as any)?.socials?.filter(Boolean) ?? [],
    availability: isOnVacation ? 'https://schema.org/PreOrder' : undefined,
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="pt-6">
        <Breadcrumb
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Artistes', href: '/artists' },
            { label: artist.name },
          ]}
        />
      </div>

      <section className="py-6 sm:py-8 md:py-10">
        <div className="grid gap-6">
          {/* Bandeau image de l'artiste */}
          <div className="aspect-[21/9] relative overflow-hidden rounded-2xl border" aria-label={`Visuel de ${artist.name}`}>
            {hasHero ? (
              <ConditionalPaddingImage
                src={heroSrc as string}
                alt={artist.name}
                sizes="(min-width:1024px) 1024px, 100vw"
                imageClassName="!object-cover"
                padding={0}
              />
            ) : (
              <div className="absolute inset-0 bg-neutral-100" />
            )}
          </div>

          {/* Infos artiste */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 relative overflow-hidden rounded-full border bg-neutral-100">
                {avatarSrc ? (
                  <SmartImage
                    src={avatarSrc}
                    alt={`Portrait de ${artist.name}`}
                    fill
                    sizes="96px"
                    wrapperClass="absolute inset-0"
                    imgClassName="object-cover"
                  />
                ) : null}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">{artist.name}</h1>
                {artist.handle && (
                  <div className="text-sm text-neutral-500">{artist.handle}</div>
                )}
                {isOnVacation ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    <MoonIcon className="h-4 w-4" />
                    En vacances — commandes suspendues
                  </div>
                ) : null}
                {artist.bio && artist.bio.trim().length > 0 && (
                  <p className="mt-2 max-w-prose text-sm text-neutral-600 whitespace-pre-line">
                    {artist.bio.trim()}
                  </p>
                )}
                {socials.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {socials.map((s) => (
                      <a
                        key={s}
                        href={s}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                      >
                        {labelFromUrl(s)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="ml-auto min-w-[200px] text-right">
              <div className="text-xs text-neutral-500">Statistiques</div>
              <div className="mt-1 text-sm">{worksCount} œuvre{worksCount > 1 ? 's' : ''}</div>
              <div className="mt-1 text-sm">À partir de <span className="tabular-nums">{minPriceFormatted}</span></div>
            </div>
          </div>
          <div className="mt-4 border-t border-neutral-200/60" />
        </div>
      </section>

      <section className="border-t border-neutral-200/60 py-8 sm:py-10 md:py-16">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-medium tracking-tight">Œuvres</h2>
          <div className="text-xs text-neutral-500" aria-live="polite">{works.length} œuvre{works.length > 1 ? 's' : ''}</div>
        </div>

        {isOnVacation ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <MoonIcon className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <div className="font-semibold">L’artiste est en vacances</div>
              <p className="mt-1 text-amber-700/90">
                Ses œuvres restent visibles mais les commandes seront possibles à son retour.
              </p>
            </div>
          </div>
        ) : null}

        {works.length === 0 && (
          <div className="mb-6 text-sm text-neutral-500">Aucune œuvre trouvée pour cet artiste.</div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {works.map((w: any) => {
            const workOnVacation = Boolean((w as any).artistOnVacation ?? (w as any).artist?.isOnVacation ?? isOnVacation)
            const variants = Array.isArray((w as any).variants) ? ((w as any).variants as any[]) : []
            const soldOut = variants.length > 0 && variants.every((v) => typeof v?.stock === 'number' && v.stock <= 0)
            const lowStock =
              !soldOut &&
              variants.length > 0 &&
              variants.some((v) => typeof v?.stock === 'number' && v.stock > 0 && v.stock <= 2)
            const badge = workOnVacation ? 'Vacances' : soldOut ? 'Hors stock' : lowStock ? 'Stock bas' : null
            const priceLabel = soldOut
              ? 'Épuisé'
              : (w as any).priceMinFormatted ?? euro((w as any).priceMin ?? 0)
            return (
              <ArtworkHoverCard
                key={w.id}
                artwork={w}
                artistName={artist.name}
                priceLabel={priceLabel}
                badge={badge}
              />
            )
          })}
        </div>

        <div className="mt-10">
          <Link href="/artists" className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50" aria-label="Retour à la liste des artistes">← Retour</Link>
        </div>
      </section>
    </div>
  )
}
