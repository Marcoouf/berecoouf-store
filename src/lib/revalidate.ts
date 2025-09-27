"use server";

import { revalidatePath } from "next/cache";

/**
 * Revalide les pages dépendantes des artistes.
 * Ajoute ici d’autres chemins si besoin (home, galeries, etc.).
 */
export async function revalidateArtistPaths(slug?: string) {
  revalidatePath("/artists");
  if (slug) revalidatePath(`/artists/${slug}`);
  revalidatePath("/artworks"); // si la galerie liste par artiste
}