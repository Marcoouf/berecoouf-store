// src/app/page.tsx
import Site from "@/components/UI";
import { getCatalog as fetchCatalog } from "@/lib/getCatalog";

export const dynamic = "force-dynamic";

/**
 * Page d'accueil
 * - Reprend 100% de l'UI/UX définie dans `src/components/UI.tsx`.
 * - Passe le catalogue tel quel, sans re-normaliser les prix (utiliser exactement ce que renvoie /api/catalog).
 * - Ouvre le panier si `?cart=1` est présent.
 * - Si l'API échoue, on renvoie un objet vide minimal.
 */
export default async function Page({
  searchParams,
}: {
  searchParams?: { cart?: string };
}) {
  const openCart = searchParams?.cart === "1";

  // Chargement robuste du catalogue
  let catalog: any = null;
  try {
    catalog = await fetchCatalog();
  } catch (_) {
    // Fallback minimal pour éviter de casser le rendu de l'UI
    catalog = {
      artworks: [],
      artists: [],
      collections: [],
    } as any;
  }

  return <Site openCartOnLoad={openCart} catalog={catalog} />;
}