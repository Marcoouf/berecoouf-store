// prisma/seed.ts
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../src/lib/prisma'

// -- Petit helper si ton slug util n’existe pas :
function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// -- Types attendus dans catalog.json (souples)
type JsonArtist = {
  id?: string
  slug?: string
  name: string
  handle?: string
  bio?: string
  avatar?: string
  cover?: string
  contactEmail?: string
  email?: string
}

type JsonFormat = {
  id?: string
  label: string
  price: number | string // en euros dans ton JSON ; on convertit en cents
  sku?: string
  stock?: number | string | null
  order?: number
}

type JsonArtwork = {
  id?: string
  slug?: string
  title: string
  description?: string
  year?: number
  technique?: string
  paper?: string
  dimensions?: string
  edition?: string
  image?: string
  mockup?: string
  basePrice?: number | string // euros
  published?: boolean
  artistId?: string
  artistSlug?: string
  artist?: string // fallback par nom
  formats?: JsonFormat[]
}

type CatalogJson = {
  artists: JsonArtist[]
  artworks: JsonArtwork[]
}

function eurosToCents(v?: number | string | null): number | null {
  if (v == null) return null
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v
  if (Number.isFinite(n)) return Math.round(n * 100)
  return null
}

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const jsonPath = path.resolve(__dirname, '../data/catalog.json') // catalogue à la racine /data
  const raw = await readFile(jsonPath, 'utf8')
  const data = JSON.parse(raw) as CatalogJson

  // 1) ARTISTS
  const artistsInput: JsonArtist[] = (data.artists ?? [])
  console.log(`Seeding artists: ${artistsInput.length}`)

  for (const a of artistsInput) {
    const id = a.id ?? undefined
    const slug = (a.slug || toSlug(a.name)).trim()

    const contactEmail = (a.contactEmail ?? a.email ?? '').trim() || null

    await prisma.artist.upsert({
      where: { slug },
      create: {
        id,
        slug,
        name: a.name,
        handle: a.handle ?? null,
        bio: a.bio ?? null,
        portrait: a.avatar ?? null, // ancien avatarUrl -> portrait
        image: a.cover ?? null,     // ancien coverUrl  -> image
        contactEmail,
      },
      update: {
        name: a.name,
        handle: a.handle ?? null,
        bio: a.bio ?? null,
        portrait: a.avatar ?? null, // ancien avatarUrl -> portrait
        image: a.cover ?? null,     // ancien coverUrl  -> image
        contactEmail,
      },
    })
  }

  // index util pour retrouver un artiste par slug/nom (sélection typée)
  type ArtistIndex = { id: string; slug: string; name: string }
  const artistsList: ArtistIndex[] = await prisma.artist.findMany({
    select: { id: true, slug: true, name: true },
  })
  const artistsBySlug = new Map<string, ArtistIndex>(
    artistsList.map((a: ArtistIndex) => [a.slug, a])
  )
  const artistsByName = new Map<string, ArtistIndex>(
    artistsList.map((a: ArtistIndex) => [a.name.toLowerCase(), a])
  )

  // 2) WORKS (+ VARIANTS)
  const worksInput: JsonArtwork[] = (data.artworks ?? [])
  console.log(`Seeding works: ${worksInput.length}`)

  for (const w of worksInput) {
    const slug = (w.slug || toSlug(w.title)).trim()

    // Résolution artiste
    let artistId = w.artistId
    if (!artistId && w.artistSlug) {
      artistId = artistsBySlug.get(w.artistSlug)?.id
    }
    if (!artistId && w.artist) {
      artistId = artistsByName.get(w.artist.toLowerCase())?.id
    }
    if (!artistId) {
      throw new Error(`Aucun artistId trouvable pour l’œuvre "${w.title}"`)
    }

    const basePrice = eurosToCents(w.basePrice ?? (w as any).price ?? (w.formats?.[0]?.price ?? null)) ?? undefined

    // Upsert de l’œuvre
// Upsert de l’œuvre
const work = await prisma.work.upsert({
  where: { slug },
  create: {
    // id: w.id ?? undefined,   // <-- SUPPRIMER CETTE LIGNE
    slug,
    title: w.title,
    description: w.description ?? null,
    year: w.year ?? null,
    technique: w.technique ?? null,
    paper: w.paper ?? null,
    dimensions: w.dimensions ?? null,
    edition: w.edition ?? null,
    imageUrl: w.image ?? 'about:blank',
    mockupUrl: w.mockup ?? null,
    basePrice,
    published: w.published ?? true,
    artistId,
  },
  update: {
    title: w.title,
    description: w.description ?? null,
    year: w.year ?? null,
    technique: w.technique ?? null,
    paper: w.paper ?? null,
    dimensions: w.dimensions ?? null,
    edition: w.edition ?? null,
    imageUrl: w.image ?? 'about:blank',
    mockupUrl: w.mockup ?? null,
    basePrice,
    published: w.published ?? true,
    artistId,
  },
})
    // Sync variants — stratégie simple : on remplace tout
    const incoming = (w.formats ?? []).map((f, idx) => {
      const stockValueRaw =
        typeof f.stock === 'string'
          ? Number(f.stock.replace(',', '.'))
          : typeof f.stock === 'number'
          ? f.stock
          : null
      const stock =
        typeof stockValueRaw === 'number' && Number.isFinite(stockValueRaw)
          ? Math.max(0, Math.round(stockValueRaw))
          : null
      return {
        // ne PAS inclure d'id : on laisse Prisma générer
        label: f.label,
        price: eurosToCents(f.price) ?? 0,
        order: typeof f.order === 'number' ? f.order : idx,
        stock,
      }
    })

    // Supprime les anciens variants puis (re)crée
    await prisma.variant.deleteMany({ where: { workId: work.id } })
    if (incoming.length > 0) {
      await prisma.variant.createMany({
        data: incoming.map(v => ({
          workId: work.id,
          label: v.label,
          price: v.price,
          order: v.order,
          stock: v.stock,
        })),
        skipDuplicates: true,
      })
    }
  }

  console.log('✅ Seed terminé.')

  const adminEmailRaw = (process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim()
  const adminEmail = adminEmailRaw.toLowerCase()
  if (adminEmail) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: 'admin',
        name: process.env.SEED_ADMIN_NAME?.trim() || null,
      },
      create: {
        email: adminEmail,
        role: 'admin',
        name: process.env.SEED_ADMIN_NAME?.trim() || 'Admin',
        passwordHash: null,
      },
    })
    console.log(`👤 Admin ajouté/confirmé : ${adminEmail}`)
  }
}

main()
  .catch(err => {
    console.error('❌ Seed error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
