"use server";

import { revalidatePath /*, revalidateTag*/ } from "next/cache";

/**
 * Utilitaires de revalidation côté serveur.
 * NB: si vos pages consomment les données via `noStore()`/`cache: 'no-store'`,
 * ces appels n'auront pas d'effet (pas de cache à invalider).
 */
export async function revalidateArtistPaths(slug?: string): Promise<void> {
  revalidatePath("/artists");          // liste artistes
  if (slug) revalidatePath(`/artists/${slug}`); // page artiste
  revalidatePath("/artworks");         // la galerie peut être filtrée par artiste
  revalidatePath("/");                 // la home affiche des sélections
}

/** Revalide les pages liées aux œuvres. */
export async function revalidateWorkPaths(slug?: string): Promise<void> {
  revalidatePath("/artworks");         // liste œuvres
  if (slug) revalidatePath(`/artworks/${slug}`); // fiche œuvre
  revalidatePath("/");                 // home
  revalidatePath("/artists");          // si la page artistes affiche une grille d’œuvres
}

/** Revalide les vues principales du catalogue (home + listes). */
export async function revalidateAllCatalog(): Promise<void> {
  revalidatePath("/");
  revalidatePath("/artworks");
  revalidatePath("/artists");
}

// Optionnel : décommentez si vous passez vos fetch() en mode tagué (next: { tags: ['catalog'] })
// import { revalidateTag } from "next/cache";
// export function revalidateCatalogTag() {
//   revalidateTag("catalog");
// }