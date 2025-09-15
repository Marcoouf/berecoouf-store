// src/lib/getCatalog.ts
import { artists as seedArtists, artworks as seedArtworks } from "@/lib/data";

// --- Types minimaux consommés par l'UI ---
type Artist = {
  id: string;
  slug: string;
  name: string;
  handle?: string;
  bio?: string;
  avatar?: string;
  cover?: string | { url: string };
};

type Variant = {
  id: string;
  label: string;
  price: number; // en centimes ou euros selon ta source (on ne force pas la devise ici)
  type?: "digital" | "print";
  sku?: string;
  stock?: number | null;
};

type Artwork = {
  id: string;
  slug: string;
  title: string;
  // source hétérogène : on accepte image / images / mockup
  image?: string;
  images?: Array<string | { url: string }>;
  mockup?: string;
  cover?: string | { url: string };
  artistId: string;
  artist?: Pick<Artist, "id" | "slug" | "name">;
  price?: number; // prix par défaut si pas de variants
  description?: string;
  year?: number;
  technique?: string;
  paper?: string;
  size?: string;
  edition?: string;
  formats?: Array<{ id: string; label: string; price: number }>; // legacy
  variants?: Variant[];
  priceMin?: number;
};

// --- Helpers ---
function isArtist(x: any): x is Artist {
  return !!x && typeof x === "object" && typeof x.id === "string" && typeof x.slug === "string" && typeof x.name === "string";
}

function isArtwork(x: any): x is Artwork {
  return !!x && typeof x === "object" && typeof x.id === "string" && typeof x.slug === "string" && typeof x.title === "string" && typeof x.artistId === "string";
}

function uniqBy<T>(arr: T[], key: (t: T) => string) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    const k = key(it);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}

function toUrlString(x: unknown): string | null {
  if (!x) return null;
  if (typeof x === "string") return x;
  if (typeof x === "object" && x && "url" in x && typeof (x as any).url === "string") return (x as any).url as string;
  return null;
}

function asArray<T>(x: T | T[] | null | undefined): T[] {
  if (Array.isArray(x)) return x;
  return x ? [x] : [];
}

// --- Normalisation d'une oeuvre ---
function normalizeArtwork(raw: Artwork, artistIndex: Map<string, Artist>): Artwork {
  const imagesCandidates: Array<string | { url: string }> = [
    ...(Array.isArray(raw.images) ? raw.images : []),
    ...asArray(raw.image),
    ...asArray(raw.mockup),
    ...asArray(raw.cover as any),
  ];
  const normalizedImages = imagesCandidates
    .map((it) => toUrlString(it as any))
    .filter((u): u is string => typeof u === "string" && u.length > 0);

  const coverUrl = toUrlString(raw.cover) || normalizedImages[0] || null;

  // Variants : on rétro-compatibilise `formats` → `variants`.
  let variants: Variant[] | undefined = undefined;
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    variants = raw.variants;
  } else if (Array.isArray(raw.formats) && raw.formats.length > 0) {
    variants = raw.formats.map((f) => ({ id: f.id, label: f.label, price: f.price, type: "print" as const }));
  } else if (typeof raw.price === "number") {
    variants = [{ id: `${raw.id}-digital`, label: "Numérique", price: raw.price, type: "digital" }];
  }

  const priceMin = Array.isArray(variants) && variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : raw.price ?? undefined;

  const artist = artistIndex.get(raw.artistId);

  return {
    ...raw,
    images: normalizedImages.length > 0 ? normalizedImages.map((u) => ({ url: u })) : undefined,
    cover: coverUrl ? { url: coverUrl } : undefined,
    artist: artist ? { id: artist.id, slug: artist.slug, name: artist.name } : raw.artist,
    variants,
    priceMin,
  };
}

/**
 * getCatalog
 * - essaie la source distante PUBLIC_CATALOG_URL (Blob / API) si définie
 * - valide le JSON
 * - merge avec le seed local (lib/data) en fallback
 * - normalise les œuvres pour l'UI : images[], cover{url}, artist embarqué, variants, priceMin
 */
export async function getCatalog(): Promise<{ artists: any[]; artworks: any[] }> {
  const seed = {
    artists: Array.isArray(seedArtists) ? seedArtists.filter(isArtist) : [],
    artworks: Array.isArray(seedArtworks) ? seedArtworks.filter(isArtwork) : [],
  };

  const remoteUrl =
    process.env.PUBLIC_CATALOG_URL || process.env.NEXT_PUBLIC_PUBLIC_CATALOG_URL || "";

  let remote: { artists?: any[]; artworks?: any[] } = {};

  if (remoteUrl) {
    try {
      const r = await fetch(remoteUrl, { cache: "no-store", next: { revalidate: 0 } });
      if (r.ok) {
        const j = await r.json();
        const ra = Array.isArray(j?.artists) ? j.artists.filter(isArtist) : [];
        const rw = Array.isArray(j?.artworks) ? j.artworks.filter(isArtwork) : [];
        remote = { artists: ra, artworks: rw };
      } else {
        console.error("getCatalog: remote non-OK", r.status, await safeText(r));
      }
    } catch (e) {
      console.error("getCatalog: remote fetch error", e);
    }
  }

  // Fusion (remote prioritaire, seed en complément), dé-doublonnage par id puis par slug
  const artistsMerged = uniqBy(uniqBy([...(remote.artists ?? []), ...seed.artists], (a) => a.id), (a) => a.slug);
  const artworksMerged = uniqBy(uniqBy([...(remote.artworks ?? []), ...seed.artworks], (w) => w.id), (w) => w.slug);

  // Index artiste → normalisation des œuvres
  const artistIndex = new Map<string, Artist>(artistsMerged.map((a) => [a.id, a]));
  const artworksNormalized = artworksMerged
    .map((w) => normalizeArtwork(w, artistIndex))
    .filter(isArtwork);

  // Tri léger : par année décroissante puis titre
  artworksNormalized.sort((a, b) => {
    const ya = typeof a.year === "number" ? a.year : -Infinity;
    const yb = typeof b.year === "number" ? b.year : -Infinity;
    if (yb !== ya) return yb - ya;
    return (a.title || "").localeCompare(b.title || "");
  });

  return { artists: artistsMerged as any[], artworks: artworksNormalized as any[] };
}

async function safeText(r: Response) {
  try {
    return await r.text();
  } catch {
    return "";
  }
}