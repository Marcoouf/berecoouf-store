export type MoneyCents = number // entier >= 0 — toujours en centimes

export type Format = {
  id: string
  label: string
  price: MoneyCents // centimes
  stock?: number | null // stock disponible ; null = illimité
}

export type Artwork = {
  id: string
  slug: string
  title: string
  image?: string | null        // URL principale (Blob) ; peut être null
  mockup?: string | null       // URL mockup optionnelle
  artistId: string
  description?: string | null

  // Fallback si pas de formats/variants
  price?: MoneyCents // en centimes

  // Calculés côté lib/getCatalog
  priceMin: MoneyCents // en centimes
  priceMinFormatted: string // déjà formaté via euro()

  // --- Champs optionnels pour la fiche œuvre ---
  year?: number | string | null
  technique?: string | null
  paper?: string | null
  dimensions?: string | null // remplace "size" ; ex. "30×40 cm"
  edition?: string | null

  // Options de tirage (variants)
  formats?: Format[]
}

export type Artist = {
  id: string
  slug: string
  name: string
  handle?: string | null
  bio?: string | null

  // Images normalisées depuis l’admin
  portrait?: string | null // avatar
  image?: string | null    // cover
  contactEmail?: string | null

  socials?: string[]
  isArchived?: boolean
  isOnVacation?: boolean
  isHidden?: boolean
}

export type CartItem = {
  key: string // id unique de ligne
  qty: number

  // données visuelles
  artwork: {
    id: string
    title: string
    image?: string | null
  }
  format?: {
    id?: string
    label?: string | null
    price?: MoneyCents | null // centimes (indicatif)
  }

  // 👉 source de vérité pour les calculs/affichages
  unitPriceCents: MoneyCents // toujours en centimes
}
