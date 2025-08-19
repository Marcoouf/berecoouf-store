export type Format = { id: string; label: string; price: number }

export type Artwork = {
  id: string
  slug: string
  artistId: string
  title: string
  price: number
  formats?: Format[]
  image: string
  description?: string
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
