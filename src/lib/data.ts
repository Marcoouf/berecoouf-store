import type { Artist, Artwork } from './types'

export const artists: Artist[] = [
  {
    id: 'a-Couf',
    slug: 'Marcouf',
    name: 'Marcouf Lebar',
    handle: '@Marcouf',
    bio: 'Textures brutes, encres profondes, géométries silencieuses.',
    avatar: '/images/artists/marcouf-lebar.webp',
    cover: '/images/artworks/art5.webp',
  },
    {
    id: 'a-Couf',
    slug: 'Marcouf',
    name: 'Marcouf Lebar',
    handle: '@Marcouf',
    bio: 'Textures brutes, encres profondes, géométries silencieuses.',
    avatar: '/images/artists/marcouf-lebar.webp',
    cover: '/images/artworks/art6.webp',
  },
  {
    id: 'a-Couf',
    slug: 'Marcouf',
    name: 'Marcouf Lebar',
    handle: '@Marcouf',
    bio: 'Textures brutes, encres profondes, géométries silencieuses.',
    avatar: '/images/artists/marcouf-lebar.webp',
    cover: '/images/artworks/art7.webp',
  },
]

export const artworks: Artwork[] = [
  {
    id: 'w-01',
    slug: 'quiet-grid',
    artistId: 'a-Couf',
    title: 'Quiet Grid',
    price: 120,
    formats: [
      { id: 'f-a3', label: 'A3 — 297×420mm', price: 120 },
      { id: 'f-a2', label: 'A2 — 420×594mm', price: 180 },
      { id: 'f-a1', label: 'A1 — 594×841mm', price: 260 },
    ],
    image: '/images/artworks/art1.webp',
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
    image: '/images/artworks/art2.webp',
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
    image: '/images/artworks/art3.webp',
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
