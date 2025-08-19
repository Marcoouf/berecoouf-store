import type { Artist, Artwork } from './types'

export const artists: Artist[] = [
  {
    id: 'a-ava',
    slug: 'ava-darnell',
    name: 'Ava Darnell',
    handle: '@avadarnell',
    bio: 'Textures brutes, encres profondes, géométries silencieuses.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1526312426976-593c128eea49?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'a-kenji',
    slug: 'kenji-mori',
    name: 'Kenji Mori',
    handle: '@kenjimori',
    bio: 'Sérigraphies minimalistes sur trame fine.',
    avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=200&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'a-lina',
    slug: 'lina-zhou',
    name: 'Lina Zhou',
    handle: '@linazhou',
    bio: 'Couleurs sourdes, formats généreux, calme graphique.',
    avatar: 'https://images.unsplash.com/photo-1541534401786-2077eed87a74?q=80&w=200&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop',
  },
]

export const artworks: Artwork[] = [
  {
    id: 'w-01',
    slug: 'quiet-grid',
    artistId: 'a-ava',
    title: 'Quiet Grid',
    price: 120,
    formats: [
      { id: 'f-a3', label: 'A3 — 297×420mm', price: 120 },
      { id: 'f-a2', label: 'A2 — 420×594mm', price: 180 },
      { id: 'f-a1', label: 'A1 — 594×841mm', price: 260 },
    ],
    image: 'https://images.unsplash.com/photo-1534791547709-17f37b2f3aa6?q=80&w=1200&auto=format&fit=crop',
    description: 'Série “Quiet”. Trame régulière, teintes sourdes, sérigraphie sur papier coton 315g.',
  },
  {
    id: 'w-02',
    slug: 'mono-field-02',
    artistId: 'a-kenji',
    title: 'Mono Field 02',
    price: 140,
    formats: [
      { id: 'f-a3', label: 'A3 — 297×420mm', price: 140 },
      { id: 'f-a2', label: 'A2 — 420×594mm', price: 210 },
    ],
    image: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop',
    description: 'Monochrome sur trame fine. Impression pigmentaire, tirage limité.',
  },
  {
    id: 'w-03',
    slug: 'muted-wave',
    artistId: 'a-lina',
    title: 'Muted Wave',
    price: 160,
    formats: [
      { id: 'f-a3', label: 'A3 — 297×420mm', price: 160 },
      { id: 'f-a2', label: 'A2 — 420×594mm', price: 230 },
      { id: 'f-a1', label: 'A1 — 594×841mm', price: 310 },
    ],
    image: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?q=80&w=1200&auto=format&fit=crop',
    description: 'Ondes calmes et palette sourde. Tirage numéroté.',
  },
]

// Helpers typés
export function findArtistBySlug(slug: string) {
  return artists.find(a => a.slug === slug) ?? null
}
export function findArtworkBySlug(slug: string) {
  return artworks.find(w => w.slug === slug) ?? null
}
export function artworksByArtist(artistId: string) {
  return artworks.filter(w => w.artistId === artistId)
}
