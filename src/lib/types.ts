export type Format = { id: string; label: string; price: number }

export type Artwork = {
  id: string
  slug: string
  title: string
  image: string
  artistId: string
  price: number
  description?: string
  formats?: Format[]

  // --- Nouveaux champs optionnels pour la fiche œuvre ---
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
  handle: string
  bio: string
  avatar: string
  cover: string
}
