export type Format = {
  id: string
  label: string
  price: number // en centimes
}

export type Artwork = {
  id: string
  slug: string
  title: string
  image: string
  mockup?: string
  artistId: string
  description?: string
  formats?: Format[]

  // Fallback si pas de formats (prix de base)
  price?: number // en centimes

  priceMin: number // en centimes
  priceMinFormatted: string // formaté en €

  // --- Champs optionnels pour la fiche œuvre ---
  year?: number | string
  technique?: string
  paper?: string
  size?: string
  edition?: string
}

export type Artist = {
  id: string
  slug: string
  name: string
  handle?: string
  bio?: string
  avatar?: string
  cover?: string
}

export type CartItem = {
  key: string;            // id unique de ligne
  qty: number;

  // données visuelles
  artwork: {
    id: string;
    title: string;
    image?: string | null;
  };
  format?: {
    id?: string;
    label?: string | null;
    price?: number | null; // centimes (optionnel, pour info)
  };

  // 👉 source de vérité pour les calculs/affichages
  unitPriceCents: number;  // toujours en centimes
};