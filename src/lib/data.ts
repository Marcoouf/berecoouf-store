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
    id: 'b-Béré',
    slug: 'Bere',
    name: 'Bérénice Duchemin',
    handle: '@Béré',
    bio: 'Textures brutes, encres profondes, géométries silencieuses.',
    avatar: '/images/artists/bere.webp',
    cover: '/images/artworks/art4.webp',
  },
  {
    id: 'c-Cam',
    slug: 'Cam',
    name: 'Camille Dubois',
    handle: '@Camille',
    bio: 'Textures brutes, encres profondes, géométries silencieuses.',
    avatar: '/images/artists/cam.webp',
    cover: '/images/artworks/art9.webp',
  },
]

export const artworks: Artwork[] = [
  {
    id: 'w-01',
    slug: 'quiet-grid',
    title: 'Quiet Grid',
    image: '/images/artworks/art1.webp',
    artistId: 'a-Couf',
    price: 120,
    description: 'Série “Quiet”…',
    formats: [
      { id: 'a3', label: 'A3 — 297×420mm', price: 120 },
      { id: 'a2', label: 'A2 — 420×594mm', price: 150 },
    ],
    year: 2024,
    technique: 'Sérigraphie',
    paper: 'Coton 315g',
    size: '297×420mm',
    edition: 'Tirage limité / numéroté',
  },
  {
    id: 'w-02',
    slug: 'mono-field-02',
    artistId: 'a-Couf',
    title: 'Photo de fête',
    price: 140,
    formats: [
      { id: 'f-a3', label: 'A3 — 297×420mm', price: 140 },
      { id: 'f-a2', label: 'A2 — 420×594mm', price: 210 },
    ],
    image: '/images/artworks/art7.webp',
    description: 'Photographie argentique noir et blanc.',
    year: 2023,
    technique: 'Impression pigmentaire',
    paper: 'Hahnemühle Photo Rag 308g',
    size: '420×594mm',
    edition: 'Édition de 30 exemplaires',
  },
  {
    id: 'w-03',
    slug: 'muted-wave-1',
    artistId: 'c-Cam',
    title: 'Muted Wave',
    price: 160,
    formats: [
      { id: 'f-a3', label: 'A3 — 297×420mm', price: 160 },
      { id: 'f-a2', label: 'A2 — 420×594mm', price: 230 },
      { id: 'f-a1', label: 'A1 — 594×841mm', price: 310 },
    ],
    image: '/images/artworks/art11.webp',
    description: 'Ondes calmes et palette sourde. Tirage numéroté.',
    year: 2022,
    technique: 'Lithographie',
    paper: 'Papier vélin 250g',
    size: '594×841mm',
    edition: 'Édition limitée à 20 exemplaires',
  },
  {
    id: 'w-04',
    slug: 'soleil',
    artistId: 'b-Béré',
    title: 'Soleil',
    price: 160,
    formats: [
      { id: 'f-a3', label: 'A3 — 297×420mm', price: 160 },
      { id: 'f-a2', label: 'A2 — 420×594mm', price: 230 },
      { id: 'f-a1', label: 'A1 — 594×841mm', price: 310 },
    ],
    image: '/images/artworks/art4.webp',
    description: 'Ondes calmes et palette sourde. Tirage numéroté.',
    year: 2024,
    technique: 'Gravure sur cuivre',
    paper: 'Arches 300g',
    size: '420×594mm',
    edition: 'Édition originale, 15 tirages',
  },
  {
    id: 'w-05',
    slug: 'muted-wave-2',
    artistId: 'c-Cam',
    title: 'Muted Wave',
    price: 160,
    formats: [
      { id: 'f-a3', label: 'A3 — 297×420mm', price: 160 },
      { id: 'f-a2', label: 'A2 — 420×594mm', price: 230 },
      { id: 'f-a1', label: 'A1 — 594×841mm', price: 310 },
    ],
    image: '/images/artworks/art12.webp',
    description: 'Ondes calmes et palette sourde. Tirage numéroté.',
    year: 2021,
    technique: 'Eau-forte',
    paper: 'Canson Édition 270g',
    size: '297×420mm',
    edition: 'Série de 25 épreuves signées',
  },
  {
    id: 'w-06',
    slug: 'quineville',
    artistId: 'c-Cam',
    title: 'Quinéville',
    price: 160,
    formats: [
      { id: 'f-a3', label: 'A3 — 297×420mm', price: 160 },
      { id: 'f-a2', label: 'A2 — 420×594mm', price: 230 },
      { id: 'f-a1', label: 'A1 — 594×841mm', price: 310 },
    ],
    image: '/images/artworks/art8.webp',
    mockup: '/images/artworks/mockups/art8-mockup.webp',
    description: 'Ondes calmes et palette sourde. Tirage numéroté.',
    year: 2020,
    technique: 'Sérigraphie',
    paper: 'Papier Fabriano 300g',
    size: '594×841mm',
    edition: 'Tirage limité à 12 exemplaires',
  },
  {
    id: 'w-07',
    slug: 'mouettes',
    artistId: 'b-Béré',
    title: 'Mouettes',
    price: 160,
    formats: [
      { id: 'f-a3', label: 'A3 — 297×420mm', price: 160 },
      { id: 'f-a2', label: 'A2 — 420×594mm', price: 230 },
      { id: 'f-a1', label: 'A1 — 594×841mm', price: 310 },
    ],
    image: '/images/artworks/art2.webp',
    description: 'Ondes calmes et palette sourde. Tirage numéroté.',
    year: 2023,
    technique: 'Linogravure',
    paper: 'Papier Ingres 200g',
    size: '420×594mm',
    edition: 'Édition limitée à 18 exemplaires',
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
